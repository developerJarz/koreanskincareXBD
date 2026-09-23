import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import fs from "fs";
import path from "path";

let mongoUri = process.env.MONGODB_URI;

if (!mongoUri && fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("MONGODB_URI=")) {
      mongoUri = trimmed
        .substring("MONGODB_URI=".length)
        .replace(/^["']|["']$/g, "")
        .trim();
      break;
    }
  }
}

const ACCOUNTS = [
  {
    email: "superadmin@koreanskincare.bd",
    name: "koreanskincare.bd Super Admin",
    role: "super_admin",
    password: "Shajgoj#SuperAdmin!2026$X9",
  },
  {
    email: "admin@koreanskincare.bd",
    name: "koreanskincare.bd Store Admin",
    role: "admin",
    password: "Shajgoj#Admin!9982*Secure",
  },
  {
    email: "staff@koreanskincare.bd",
    name: "Store Staff (Moderator)",
    role: "staff",
    password: "Staff#Mod@Shajgoj8821$",
  },
  {
    email: "customer@koreanskincare.bd",
    name: "Nusrat Jahan",
    role: "customer",
    password: "Customer#Lux!Nusrat2026@",
  },
  {
    email: "superadmin@shajgoj.bd",
    name: "Shajgoj Super Admin (Alias)",
    role: "super_admin",
    password: "Shajgoj#SuperAdmin!2026$X9",
  },
  {
    email: "admin@shajgoj.bd",
    name: "Shajgoj Store Admin (Alias)",
    role: "admin",
    password: "Shajgoj#Admin!9982*Secure",
  },
  {
    email: "staff@shajgoj.bd",
    name: "Store Staff (Alias)",
    role: "staff",
    password: "Staff#Mod@Shajgoj8821$",
  },
  {
    email: "customer@shajgoj.bd",
    name: "Nusrat Jahan (Alias)",
    role: "customer",
    password: "Customer#Lux!Nusrat2026@",
  },
  {
    email: "ayesha@example.com",
    name: "Ayesha Rahman",
    role: "customer",
    password: "Ayesha#Luxe2026!Bd",
  },
];

async function updatePasswords() {
  if (!mongoUri) {
    console.log("No MONGODB_URI found, skipping DB password sync.");
    return;
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log("Connected to MongoDB successfully.");

    const db = mongoose.connection.db;
    if (!db) {
      console.log("No DB connection.");
      return;
    }

    const usersCollection = db.collection("users");
    const settingsCollection = db.collection("settings");

    for (const acc of ACCOUNTS) {
      const hashedPassword = await bcryptjs.hash(acc.password, 12);
      const res = await usersCollection.updateOne(
        { email: acc.email.toLowerCase().trim() },
        {
          $set: {
            password: hashedPassword,
            name: acc.name,
            role: acc.role,
            isActive: true,
            emailVerified: true,
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );
      console.log(
        `Updated/Upserted ${acc.email}: modified=${res.modifiedCount}, upserted=${res.upsertedCount}`,
      );
    }

    // Update settings in database to koreanskincare.bd
    await settingsCollection.updateMany(
      {},
      {
        $set: {
          siteName: "koreanskincare.bd",
          siteDescription: "Premium authentic Korean skincare & beauty essentials for Bangladesh",
          contactEmail: "hello@koreanskincare.bd",
          updatedAt: new Date(),
        },
      },
    );
    console.log("Updated site settings to koreanskincare.bd in database.");

    console.log("SUCCESS: All user passwords and site branding in MongoDB updated!");
    await mongoose.disconnect();
  } catch (err) {
    console.error("MongoDB update error:", err.message);
  }
}

updatePasswords();
