import nodemailer, { type Transporter } from "nodemailer";

/**
 * SMTP mailer (Brevo in production). Settings come only from environment variables:
 * SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.
 */

declare global {
  // eslint-disable-next-line no-var
  var smtpTransport: Transporter | undefined;
}

export function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

function getTransport(): Transporter {
  if (global.smtpTransport) return global.smtpTransport;

  const port = Number(process.env.SMTP_PORT || 587);
  const hasAuth = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
  global.smtpTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    // Port 587: always upgrade to TLS before sending credentials
    requireTLS: hasAuth && port !== 465,
    auth: hasAuth ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    pool: true,
    maxConnections: 3,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return global.smtpTransport;
}

export async function sendEmail(message: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  if (!isEmailConfigured()) {
    throw new Error("Email is not configured (set SMTP_HOST and SMTP_FROM).");
  }
  const info = await getTransport().sendMail({ from: process.env.SMTP_FROM, ...message });
  // "Accepted" only means Brevo queued it. Search this message ID in Brevo → Transactional → Logs
  // to see whether it was delivered, bounced, or blocked (e.g. unverified sender domain).
  console.info(
    `Email accepted by SMTP for ${maskEmail(message.to)}: ${info.messageId} (${String(info.response).slice(0, 80)})`,
  );
}

/** "nadia@gmail.com" → "na***@gmail.com" so logs don't hold full addresses */
function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  return `${user.slice(0, 2)}***@${domain}`;
}

const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

/** Branded one-time-code email. Plain text version included for clients that block HTML. */
export function codeEmail({
  name,
  code,
  purpose,
  minutes,
}: {
  name?: string;
  code: string;
  purpose: "signup" | "reset";
  minutes: number;
}) {
  const greeting = name ? `Hi ${name},` : "Hi,";
  const intro =
    purpose === "signup"
      ? "Use this code to finish creating your koreanskincare.bd account."
      : "Use this code to reset your koreanskincare.bd password.";
  const ignore =
    purpose === "signup"
      ? "If you didn't try to sign up, you can ignore this email."
      : "If you didn't ask to reset your password, you can ignore this email. Your password stays the same.";
  const subject =
    purpose === "signup"
      ? `${code} is your koreanskincare.bd verification code`
      : `${code} is your koreanskincare.bd password reset code`;

  const text = `${greeting}\n\n${intro}\n\n${code}\n\nThe code expires in ${minutes} minutes. Never share it with anyone — our team will never ask for it.\n\n${ignore}\n\nkoreanskincare.bd`;

  const html = `<!doctype html>
<html><body style="margin:0;background:#faf6f3;font-family:Arial,Helvetica,sans-serif;color:#2a1a1c">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #eadfdb;border-radius:16px;padding:32px">
        <tr><td style="font-family:Georgia,serif;font-size:20px;color:#9b3a4a;padding-bottom:24px">koreanskincare.bd</td></tr>
        <tr><td style="font-size:15px;line-height:1.6">${escapeHtml(greeting)}<br>${escapeHtml(intro)}</td></tr>
        <tr><td style="padding:24px 0">
          <div style="font-size:34px;letter-spacing:8px;font-weight:bold;text-align:center;background:#f6ecea;border-radius:12px;padding:16px 0;color:#2a1a1c">${code}</div>
        </td></tr>
        <tr><td style="font-size:13px;line-height:1.6;color:#6b5a5c">
          The code expires in ${minutes} minutes. Never share it with anyone — our team will never ask for it.<br><br>${escapeHtml(ignore)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, text, html };
}
