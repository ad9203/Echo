import nodemailer from "nodemailer";

/**
 * Checks whether valid, non-placeholder SMTP credentials are configured
 */
export function isRealSmtpConfigured() {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!user || !pass) return false;
  if (user.includes("your_email@") || user === "example@example.com") return false;
  if (pass === "your_gmail_app_password" || pass === "password") return false;
  return true;
}

/**
 * Creates a fresh Nodemailer transporter with IPv4 forced to avoid cloud container DNS/IPv6 hangs
 */
function createTransporter(port = 465) {
  const cleanPass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");
  const cleanUser = (process.env.SMTP_USER || "").trim();
  const host = process.env.SMTP_HOST || "smtp.gmail.com";

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user: cleanUser,
      pass: cleanPass,
    },
    family: 4, // Force IPv4 to prevent hanging on cloud hosts (Render / Docker)
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Sends a stylized 6-digit OTP verification email via SMTP with dual-port fallback (465 -> 587)
 */
export async function sendOtpEmail({ to, name = "Echo User", otp }) {
  if (!isRealSmtpConfigured()) {
    console.warn(`[Echo Mail Notice] Real SMTP not configured in environment. Cannot dispatch email to ${to}.`);
    return { success: false, error: "SMTP credentials not configured" };
  }

  const senderEmail = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : "no-reply@echo-notes.ai";

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Echo Verification Code</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0c14; color: #f8fafc;">
  <div style="max-width: 520px; margin: 0 auto; background: #131422; border: 1px solid rgba(139, 92, 246, 0.35); border-radius: 24px; padding: 36px 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
    <div style="text-align: center; margin-bottom: 28px;">
      <div style="font-size: 30px; font-weight: 800; background: linear-gradient(135deg, #a855f7, #ec4899); -webkit-background-clip: text; color: #a855f7; display: inline-block;">Echo</div>
      <div style="font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px;">Speak. Structure. Organize.</div>
    </div>
    
    <div style="font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 12px; text-align: center;">Verify your email address</div>
    
    <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 20px;">
      Hi ${name || "there"},<br><br>
      Thank you for joining <strong style="color: #ffffff;">Echo</strong>. Please enter the following 6-digit verification code to verify your email and activate your workspace:
    </p>

    <div style="background: rgba(139, 92, 246, 0.12); border: 2px dashed #a855f7; border-radius: 16px; padding: 20px; text-align: center; margin: 28px 0;">
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #c084fc;">${otp}</div>
      <div style="font-size: 12px; color: #f59e0b; margin-top: 8px; font-weight: 600;">⏱ Valid for 10 minutes</div>
    </div>

    <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin-bottom: 24px;">
      If you did not request this verification code, you can safely ignore this email.
    </p>

    <div style="text-align: center; margin-top: 32px; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px;">
      &copy; ${new Date().getFullYear()} Echo AI Inc. All rights reserved.
    </div>
  </div>
</body>
</html>
  `.trim();

  const mailOptions = {
    from: {
      name: "Echo AI Notes",
      address: senderEmail,
    },
    to,
    subject: `Your Echo Verification Code: ${otp}`,
    text: `Hi ${name},\n\nYour Echo verification code is: ${otp}\n\nThis code will expire in 10 minutes. If you did not request this, please ignore this email.`,
    html: htmlContent,
    headers: {
      "X-Priority": "1",
      "Importance": "high",
    },
  };

  // Primary Attempt: Port 465 (Direct SSL)
  try {
    const transporter465 = createTransporter(465);
    const info = await transporter465.sendMail(mailOptions);
    console.info(`[Echo Mail] Verification OTP email dispatched to ${to} via port 465 (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err465) {
    console.warn(`[Echo Mail Notice] Port 465 attempt to ${to} failed: ${err465.message}. Retrying via port 587...`);

    // Fallback Attempt: Port 587 (STARTTLS)
    try {
      const transporter587 = createTransporter(587);
      const info = await transporter587.sendMail(mailOptions);
      console.info(`[Echo Mail] Verification OTP email dispatched to ${to} via port 587 (MessageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (err587) {
      console.error(`[Echo Mail Error] All email dispatch attempts to ${to} failed: ${err587.message}`);
      return { success: false, error: err587.message };
    }
  }
}
