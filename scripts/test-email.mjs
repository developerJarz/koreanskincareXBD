/**
 * Sends ONE real test email with the SMTP settings in .env.local, and checks the sender domain's
 * DNS records that Brevo and Gmail require.
 *
 * Usage:
 *   node scripts/test-email.mjs you@example.com
 *   node scripts/test-email.mjs --check          # DNS checks only, sends nothing
 *
 * If the script says "accepted" but nothing arrives, open Brevo → Transactional → Logs and search
 * for the message ID it prints: Brevo shows there whether it was delivered, bounced or blocked.
 */
import fs from "fs";
import dns from "dns/promises";
import nodemailer from "nodemailer";

const checkOnly = process.argv[2] === "--check";
const to = process.argv[2];
if (!checkOnly && (!to || !to.includes("@"))) {
  console.error("Usage: node scripts/test-email.mjs you@example.com");
  process.exit(1);
}

const env = { ...process.env };
if (fs.existsSync(".env.local")) {
  for (const line of fs.readFileSync(".env.local", "utf-8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && env[m[1]] === undefined) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

for (const key of ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"]) {
  if (!env[key]) {
    console.error(`Missing ${key} in .env.local`);
    process.exit(1);
  }
}

const fromAddress = env.SMTP_FROM.match(/<([^>]+)>/)?.[1] ?? env.SMTP_FROM;
const domain = fromAddress.split("@")[1];

// ── 1. DNS records for the sender domain ──
console.log(`\nSender: ${fromAddress}`);
const txt = async (name) => {
  try {
    return (await dns.resolveTxt(name)).map((r) => r.join(""));
  } catch {
    return [];
  }
};
const cname = async (name) => {
  try {
    return await dns.resolveCname(name);
  } catch {
    return [];
  }
};
const freeMail = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "live.com"].includes(
  domain,
);
if (freeMail) {
  console.log(
    `  ! ${domain} is a free email provider. It only works if this exact address is a verified sender in Brevo,\n    and mail may land in spam. A verified own domain (e.g. koreanskincare.bd) is more reliable.`,
  );
} else {
  const rootTxt = await txt(domain);
  const checks = [
    ["Brevo domain code (TXT brevo-code:…)", rootTxt.some((r) => r.startsWith("brevo-code:"))],
    ["SPF (TXT v=spf1 …)", rootTxt.some((r) => r.startsWith("v=spf1"))],
    ["DKIM (CNAME brevo1._domainkey)", (await cname(`brevo1._domainkey.${domain}`)).length > 0],
    ["DKIM (CNAME brevo2._domainkey)", (await cname(`brevo2._domainkey.${domain}`)).length > 0],
    ["DMARC (TXT _dmarc)", (await txt(`_dmarc.${domain}`)).some((r) => r.startsWith("v=DMARC1"))],
  ];
  for (const [label, found] of checks) console.log(`  ${found ? "✓" : "✗"} ${label}`);
  if (checks.some(([, found]) => !found)) {
    console.log(
      `\n  Missing records: Brevo will not deliver mail "from" ${domain} until the domain is\n  authenticated. Brevo → Senders, Domains & Dedicated IPs → Domains → Add a domain,\n  then add the records it shows in your DNS (for koreanskincare.bd that is Vercel → Domains → DNS Records).`,
    );
  }
}

if (checkOnly) process.exit(0);

// ── 2. Send one test email ──
const port = Number(env.SMTP_PORT);
const transport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port,
  secure: port === 465,
  requireTLS: port !== 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

try {
  const info = await transport.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: "koreanskincare.bd test email",
    text: "This is a test email from your koreanskincare.bd website. If you can read this, email delivery works.",
  });
  console.log(`\nAccepted by ${env.SMTP_HOST}.`);
  console.log(`  Message ID: ${info.messageId}`);
  console.log(`  Server reply: ${info.response}`);
  console.log(
    "\nIf it doesn't arrive within a few minutes (check spam too), search the message ID in\nBrevo → Transactional → Logs to see why.",
  );
} catch (err) {
  console.error(`\nThe SMTP server refused the email: ${err.message}`);
  process.exit(1);
}
