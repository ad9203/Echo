import nodemailer from "nodemailer";

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  // 1. Check for configured SMTP credentials in .env
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const isGmail =
      process.env.SMTP_SERVICE === "gmail" ||
      (process.env.SMTP_HOST || "").toLowerCase().includes("gmail");

    const cleanPass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");

    transporter = nodemailer.createTransport(
      isGmail
        ? {
            service: "gmail",
            auth: {
              user: process.env.SMTP_USER.trim(),
              pass: cleanPass,
            },
          }
        : {
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
              user: process.env.SMTP_USER.trim(),
              pass: cleanPass,
            },
          }
    );
    return transporter;
  }

  // 2. Fallback to Nodemailer Ethereal test account or local mock
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.info(`[Echo Mail] Initialized Ethereal test account: ${testAccount.user}`);
  } catch (err) {
    console.warn("[Echo Mail] Could not create Ethereal account, using console logging fallback:", err.message);
    transporter = {
      sendMail: async (options) => {
        console.log("==================== [ECHO EMAIL LOG] ====================");
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Body:\n${options.text || options.html}`);
        console.log("==========================================================");
        return { messageId: "mock-" + Date.now() };
      },
    };
  }

  return transporter;
}

/**
 * Sends a stylized 6-digit OTP verification email
 */
export async function sendOtpEmail({ to, name = "Echo User", otp }) {
  const mailTransporter = await getTransporter();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Echo Verification Code</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0c14; margin: 0; padding: 24px; color: #f8fafc; }
    .card { max-width: 520px; margin: 0 auto; background: #131422; border: 1px solid rgba(139, 92, 246, 0.25); border-radius: 24px; padding: 36px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .header { text-align: center; margin-bottom: 28px; }
    .brand { font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .subtitle { font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; }
    .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px; }
    .otp-box { background: rgba(139, 92, 246, 0.12); border: 2px dashed #a855f7; border-radius: 16px; padding: 20px; text-align: center; margin: 28px 0; }
    .otp-code { font-family: 'Courier New', monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #c084fc; }
    .expire-notice { font-size: 12px; color: #f59e0b; margin-top: 8px; font-weight: 600; }
    .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">Echo</div>
      <div class="subtitle">NOTES TO BUILD U NOTES</div>
    </div>
    
    <div class="title">Verify your email address</div>
    <div class="text">
      Hi ${name},<br><br>
      Thank you for joining <strong>Echo</strong> — the intelligent voice and block-based workspace. Please enter this verification code to complete your registration:
    </div>

    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <div class="expire-notice">⏱ Valid for 10 minutes</div>
    </div>

    <div class="text">
      If you did not request this email, you can safely ignore it.
    </div>

    <div class="footer">
      &copy; ${new Date().getFullYear()} Echo Inc. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  const senderEmail = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : "no-reply@echo-notes.ai";
  const defaultFrom = `"Echo AI Notes" <${senderEmail}>`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || defaultFrom,
    to,
    subject: `Your Echo Verification Code: ${otp}`,
    text: `Your Echo verification code is: ${otp}. It expires in 10 minutes.`,
    html: htmlContent,
  };

  try {
    const info = await mailTransporter.sendMail(mailOptions);
    console.info(`[Echo Mail] Verification OTP email dispatched to ${to} (MessageId: ${info.messageId || "mock"})`);
    if (nodemailer.getTestMessageUrl && info) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.info(`[Echo Mail] Preview URL: ${previewUrl}`);
      }
    }
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("[Echo Mail] Send failed:", err.message);
    // Don't crash registration if email server fails; log OTP in console so user can verify in dev
    console.log(`[Echo Mail DEV FALLBACK] User: ${to} | Verification OTP: ${otp}`);
    return { success: false, error: err.message, devOtp: otp };
  }
}
