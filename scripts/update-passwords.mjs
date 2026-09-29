/**
 * Rotate staff / test account passwords and retire leaked demo accounts.
 *
 * What it does:
 *   1. Sets a new bcrypt-hashed password for each account in ACCOUNTS (creates it if missing),
 *      re-activates it, clears login lockouts and signs out all existing sessions.
 *   2. Deactivates every legacy demo account whose password was ever committed to git,
 *      gives it a random unusable password and signs it out.
 *   3. Lists any OTHER admin / staff accounts so you can check nobody gave themselves a role.
 *
 * Passwords come from environment variables. If a variable is not set, a strong random
 * password is generated and printed once at the end — store it in a password manager.
 *
 * Usage (PowerShell):
 *   $env:SEED_SUPER_ADMIN_PASSWORD='...'; node scripts/update-passwords.mjs
 *   node scripts/update-passwords.mjs --dry-run      # show what would change, write nothing
 */
import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import fs from "fs";

const DRY_RUN = process.argv.includes("--dry-run");

// Load environment variables from .env.local
const envVars = {};
if (fs.existsSync(".env.local")) {
  for (const line of fs.readFileSync(".env.local", "utf-8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const eqIndex = trimmed.indexOf("=");
      const key = trimmed.substring(0, eqIndex).trim();
      envVars[key] = trimmed
        .substring(eqIndex + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  }
}
const env = (key) => process.env[key] || envVars[key];

const mongoUri = env("MONGODB_URI");
if (!mongoUri) {
  console.error("ERROR: No MONGODB_URI found in .env.local or environment variables.");
  process.exit(1);
}

const ACCOUNTS = [
  {
    email: "superadmin@koreanskincare.bd",
    name: "koreanskincare.bd Super Admin",
    role: "super_admin",
    passwordEnvVar: "SEED_SUPER_ADMIN_PASSWORD",
  },
  {
    email: "admin@koreanskincare.bd",
    name: "koreanskincare.bd Store Admin",
    role: "admin",
    passwordEnvVar: "SEED_ADMIN_PASSWORD",
  },
  {
    email: "staff@koreanskincare.bd",
    name: "Store Staff (Moderator)",
    role: "staff",
    passwordEnvVar: "SEED_STAFF_PASSWORD",
  },
  {
    email: "customer@koreanskincare.bd",
    name: "Test Customer",
    role: "customer",
    passwordEnvVar: "SEED_CUSTOMER_PASSWORD",
  },
];

// Every demo login whose password has appeared in this repository's history
const LEGACY_DEMO_EMAILS = [
  "superadmin@noorsbd.com",
  "admin@noorsbd.com",
  "staff@noorsbd.com",
  "customer@noorsbd.com",
  "ayesha@noorsbd.com",
  "superadmin@shajgoj.bd",
  "admin@shajgoj.bd",
  "staff@shajgoj.bd",
  "customer@shajgoj.bd",
  "superadmin@noors.bd",
  "admin@noors.bd",
  "staff@noors.bd",
  "customer@noors.bd",
  "ayesha@example.com",
];

const CHARSET_LOWER = "abcdefghijkmnopqrstuvwxyz";
const CHARSET_UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const CHARSET_DIGIT = "23456789";
const CHARSET_SYMBOL = "!@#%^*-_=+?";

function generatePassword(length = 20) {
  const all = CHARSET_LOWER + CHARSET_UPPER + CHARSET_DIGIT + CHARSET_SYMBOL;
  const pick = (set) => set[crypto.randomInt(set.length)];
  const chars = [
    pick(CHARSET_LOWER),
    pick(CHARSET_UPPER),
    pick(CHARSET_DIGIT),
    pick(CHARSET_SYMBOL),
  ];
  while (chars.length < length) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

function strengthError(password) {
  if (password.length < 12) return "must be at least 12 characters";
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(password));
  if (classes.length < 3) return "needs 3 of: lowercase, uppercase, number, symbol";
  return null;
}

async function main() {
  console.log(`Connecting to MongoDB...${DRY_RUN ? " (DRY RUN — nothing will be written)" : ""}`);
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  const users = mongoose.connection.db.collection("users");

  const generated = [];

  // ── 1. Rotate official accounts ──
  console.log("\n1) Rotating account passwords");
  for (const acc of ACCOUNTS) {
    let password = env(acc.passwordEnvVar);
    if (password) {
      const weak = strengthError(password);
      if (weak) {
        console.log(`   ✗ ${acc.email}: ${acc.passwordEnvVar} ${weak} — skipped`);
        continue;
      }
    } else {
      password = generatePassword();
      generated.push({ email: acc.email, role: acc.role, password });
    }

    const exists = await users.findOne({ email: acc.email }, { projection: { _id: 1 } });
    if (DRY_RUN) {
      console.log(`   • ${acc.email} (${acc.role}) would be ${exists ? "updated" : "created"}`);
      continue;
    }

    const now = new Date();
    await users.updateOne(
      { email: acc.email },
      {
        $set: {
          password: await bcryptjs.hash(password, 12),
          role: acc.role,
          isActive: true,
          emailVerified: true,
          failedLoginAttempts: 0,
          updatedAt: now,
        },
        $unset: { lockUntil: "" },
        $inc: { sessionVersion: 1 },
        $setOnInsert: {
          name: acc.name,
          provider: "credentials",
          walletBalance: 0,
          rewardPoints: 0,
          createdAt: now,
        },
      },
      { upsert: true },
    );
    console.log(`   ✓ ${acc.email} (${acc.role}) ${exists ? "updated" : "created"}`);
  }

  // ── 2. Retire leaked demo accounts ──
  console.log("\n2) Retiring legacy demo accounts");
  const legacy = await users
    .find({ email: { $in: LEGACY_DEMO_EMAILS } }, { projection: { email: 1, role: 1 } })
    .toArray();
  if (legacy.length === 0) console.log("   (none found)");
  for (const u of legacy) {
    if (!DRY_RUN) {
      await users.updateOne(
        { _id: u._id },
        {
          $set: {
            isActive: false,
            role: "customer",
            password: await bcryptjs.hash(crypto.randomBytes(32).toString("hex"), 12),
            updatedAt: new Date(),
          },
          $inc: { sessionVersion: 1 },
        },
      );
    }
    console.log(`   ${DRY_RUN ? "•" : "✓"} ${u.email} (was ${u.role}) → deactivated`);
  }

  // ── 3. Report other privileged accounts ──
  console.log("\n3) Other admin / staff accounts — verify each one is legitimate");
  const others = await users
    .find(
      {
        role: { $in: ["super_admin", "admin", "staff"] },
        email: { $nin: [...ACCOUNTS.map((a) => a.email), ...LEGACY_DEMO_EMAILS] },
      },
      { projection: { email: 1, role: 1, isActive: 1, createdAt: 1 } },
    )
    .toArray();
  if (others.length === 0) console.log("   (none — good)");
  for (const u of others) {
    console.log(
      `   ⚠ ${u.email}  role=${u.role}  active=${u.isActive}  created=${u.createdAt?.toISOString?.() ?? "?"}`,
    );
  }
  if (others.length) {
    console.log(
      "   If you do not recognise an account above, demote or deactivate it in the admin panel.",
    );
  }

  if (generated.length && !DRY_RUN) {
    console.log("\n━━━━━━━━ NEW PASSWORDS (shown once — save them now) ━━━━━━━━");
    for (const g of generated)
      console.log(`   ${g.role.padEnd(12)} ${g.email.padEnd(32)} ${g.password}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  }

  console.log(
    "\n🔒 Passwords are bcrypt-hashed (12 rounds). All previous sessions were signed out.",
  );
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("MongoDB update error:", err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
