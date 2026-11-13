import nodemailer from "nodemailer";

let transporter = null;

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

export function getTransporter() {
  if (transporter) return transporter;

  // 1. Check for configured SMTP credentials
  if (isRealSmtpConfigured()) {
    const isGmail =
      process.env.SMTP_SERVICE === "gmail" ||
      (process.env.SMTP_HOST || "").toLowerCase().includes("gmail");

    const cleanPass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");
    const cleanUser = process.env.SMTP_USER.trim();

    // Use connection pooling to eliminate repeated handshakes and latency
    transporter = nodemailer.createTransport(
      isGmail
        ? {
            service: "gmail",
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            rateDelta: 1000,
            rateLimit: 5,
            connectionTimeout: 15000,
            greetingTimeout: 15000,
            socketTimeout: 20000,
            auth: {
              user: cleanUser,
              pass: cleanPass,
            },
            tls: {
              rejectUnauthorized: true,
            },
          }
        : {
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465,
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            connectionTimeout: 15000,
            greetingTimeout: 15000,
            socketTimeout: 20000,
            auth: {
              user: cleanUser,
              pass: cleanPass,
            },
            tls: {
              rejectUnauthorized: true,
            },
          }
    );

    return transporter;
  }

  // 2. Fallback logger when SMTP credentials are not configured in environment
  transporter = {
    sendMail: async (options) => {
      console.log("==================== [ECHO EMAIL LOG (DEV MOCK)] ====================");
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Body:\n${options.text || options.html}`);
      console.log("=====================================================================");
      return { messageId: "console-mock-" + Date.now() };
    },
  };

  return transporter;
}

/**
 * Sends a stylized 6-digit OTP verification email with resilient timeout and retry
 */
export async function sendOtpEmail({ to, name = "Echo User", otp }) {
  const mailTransporter = getTransporter();
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

  try {
    // 25-second timeout guard to ensure network/DNS handshakes can complete reliably without hanging
    const sendPromise = mailTransporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Email dispatch timed out after 25s")), 25000)
    );

    const info = await Promise.race([sendPromise, timeoutPromise]);
    console.info(`[Echo Mail] Verification OTP email dispatched to ${to} (MessageId: ${info.messageId || "mock"})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Echo Mail Error] Dispatch to ${to} failed: ${err.message}`);
    console.log(`[Echo Mail Fallback] User: ${to} | Verification OTP: ${otp}`);
    return { success: false, error: err.message, devOtp: otp };
  }
}
