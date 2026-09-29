import crypto from "crypto";

import {
  EmailOtp,
  type EmailOtpDocument,
  type OtpPurpose,
} from "@/server/db/models/email-otp.model";
import { codeEmail, isEmailConfigured, sendEmail } from "@/server/email/mailer";

export const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_SENDS_PER_HOUR = 5;

function hashCode(email: string, purpose: OtpPurpose, code: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set.");
  return crypto.createHmac("sha256", secret).update(`${purpose}:${email}:${code}`).digest("hex");
}

export type IssueResult =
  { ok: true } | { ok: false; status: number; error: string; retryAfter?: number };

/**
 * Creates (or replaces) a code for this email + purpose and emails it.
 * The email is sent before anything is saved, so a failed send never leaves a code nobody received.
 */
export async function issueOtp(input: {
  email: string;
  purpose: OtpPurpose;
  name?: string;
  pendingPasswordHash?: string;
}): Promise<IssueResult> {
  const now = Date.now();
  const existing = await EmailOtp.findOne({ email: input.email, purpose: input.purpose });

  if (existing) {
    const sinceLast = (now - existing.lastSentAt.getTime()) / 1000;
    if (sinceLast < RESEND_COOLDOWN_SECONDS) {
      const retryAfter = Math.ceil(RESEND_COOLDOWN_SECONDS - sinceLast);
      return {
        ok: false,
        status: 429,
        error: `Please wait ${retryAfter} seconds before asking for another code.`,
        retryAfter,
      };
    }
  }

  const windowFresh = !existing || now - existing.sendWindowStart.getTime() > 60 * 60_000;
  const sendCount = windowFresh ? 1 : existing.sendCount + 1;
  if (sendCount > MAX_SENDS_PER_HOUR) {
    return {
      ok: false,
      status: 429,
      error: "Too many codes were requested for this email. Please try again in an hour.",
    };
  }

  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  const message = codeEmail({
    name: input.name ?? existing?.pendingName,
    code,
    purpose: input.purpose,
    minutes: CODE_TTL_MINUTES,
  });

  if (isEmailConfigured()) {
    await sendEmail({ to: input.email, ...message });
  } else if (process.env.NODE_ENV !== "production") {
    // Local development without SMTP settings: show the code in the server terminal instead
    console.info(`[dev] ${input.purpose} code for ${input.email}: ${code}`);
  } else {
    throw new Error("Email is not configured (set SMTP_HOST and SMTP_FROM).");
  }

  await EmailOtp.updateOne(
    { email: input.email, purpose: input.purpose },
    {
      $set: {
        codeHash: hashCode(input.email, input.purpose, code),
        expiresAt: new Date(now + CODE_TTL_MINUTES * 60_000),
        attempts: 0,
        lastSentAt: new Date(now),
        sendCount,
        sendWindowStart: windowFresh ? new Date(now) : existing!.sendWindowStart,
        ...(input.name !== undefined ? { pendingName: input.name } : {}),
        ...(input.pendingPasswordHash !== undefined
          ? { pendingPasswordHash: input.pendingPasswordHash }
          : {}),
      },
    },
    { upsert: true },
  );

  return { ok: true };
}

export type VerifyResult =
  { ok: true; record: EmailOtpDocument } | { ok: false; status: number; error: string };

/** Checks a code. Wrong guesses are counted; after too many the code is cancelled. */
export async function verifyOtp(input: {
  email: string;
  purpose: OtpPurpose;
  code: string;
}): Promise<VerifyResult> {
  const record = await EmailOtp.findOne({ email: input.email, purpose: input.purpose });
  const expired = {
    ok: false as const,
    status: 400,
    error: "This code has expired. Request a new one.",
  };

  if (!record || record.expiresAt.getTime() < Date.now()) return expired;
  if (!/^\d{6}$/.test(input.code)) {
    return { ok: false, status: 400, error: "Enter the 6-digit code from the email." };
  }

  const given = Buffer.from(hashCode(input.email, input.purpose, input.code));
  const stored = Buffer.from(record.codeHash);
  const matches = given.length === stored.length && crypto.timingSafeEqual(given, stored);

  if (!matches) {
    record.attempts += 1;
    if (record.attempts >= MAX_ATTEMPTS) {
      // Cancel the code but keep the record, so the hourly send limit still applies
      record.expiresAt = new Date();
      await record.save();
      return { ok: false, status: 400, error: "Too many wrong codes. Request a new code." };
    }
    await record.save();
    const left = MAX_ATTEMPTS - record.attempts;
    return {
      ok: false,
      status: 400,
      error: `That code isn't right. You have ${left} ${left === 1 ? "try" : "tries"} left.`,
    };
  }

  return { ok: true, record };
}

/** Marks a code as used so it can't be used twice (the record stays for the hourly send limit). */
export async function consumeOtp(record: EmailOtpDocument) {
  await EmailOtp.updateOne(
    { _id: record._id },
    { $set: { expiresAt: new Date(), codeHash: "used" }, $unset: { pendingPasswordHash: 1 } },
  );
}
