import nodemailer from "nodemailer";

/**
 * Checks whether any real email service is configured (HTTPS API or SMTP)
 */
export function isRealSmtpConfigured() {
  if (process.env.BREVO_API_KEY?.trim()) return true;
  if (process.env.RESEND_API_KEY?.trim()) return true;
  if (process.env.SENDGRID_API_KEY?.trim()) return true;

  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!user || !pass) return false;
  if (user.includes("your_email@") || user === "example@example.com") return false;
  if (pass === "your_gmail_app_password" || pass === "password") return false;
  return true;
}

/**
 * Dispatch email via Brevo REST API (HTTPS Port 443 - Bypasses Render/Cloud SMTP port blocks)
 */
async function sendViaBrevo({ to, name, otp, htmlContent, textContent }) {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) return null;

  const senderEmail = process.env.BREVO_SENDER || process.env.SMTP_USER || "surebite.support@gmail.com";
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Echo AI Notes", email: senderEmail },
      to: [{ email: to, name: name || "Echo User" }],
      subject: `Your Echo Verification Code: ${otp}`,
      htmlContent,
      textContent,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Brevo API HTTP ${res.status}`);
  }
  return { success: true, messageId: data.messageId || "brevo-" + Date.now(), provider: "Brevo (HTTPS:443)" };
}

/**
 * Dispatch email via Resend REST API (HTTPS Port 443 - Bypasses Render/Cloud SMTP port blocks)
 */
async function sendViaResend({ to, name, otp, htmlContent, textContent }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;

  const from = process.env.RESEND_FROM || "Echo AI Notes <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Your Echo Verification Code: ${otp}`,
      html: htmlContent,
      text: textContent,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Resend API HTTP ${res.status}`);
  }
  return { success: true, messageId: data.id || "resend-" + Date.now(), provider: "Resend (HTTPS:443)" };
}

/**
 * Dispatch email via SendGrid REST API (HTTPS Port 443)
 */
async function sendViaSendGrid({ to, name, otp, htmlContent, textContent }) {
  const apiKey = process.env.SENDGRID_API_KEY?.trim();
  if (!apiKey) return null;

  const senderEmail = process.env.SENDGRID_FROM || process.env.SMTP_USER || "surebite.support@gmail.com";
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to, name: name || "Echo User" }] }],
      from: { email: senderEmail, name: "Echo AI Notes" },
      subject: `Your Echo Verification Code: ${otp}`,
      content: [
        { type: "text/plain", value: textContent },
        { type: "text/html", value: htmlContent },
      ],
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.errors?.[0]?.message || `SendGrid API HTTP ${res.status}`);
  }
  return { success: true, messageId: "sendgrid-" + Date.now(), provider: "SendGrid (HTTPS:443)" };
}

/**
 * Create fresh Nodemailer transporter with IPv4 forced
 */
function createSmtpTransporter(port = 465) {
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
    family: 4, // Force IPv4 to prevent hanging on cloud containers
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Dispatch email via standard SMTP (ports 465 and 587)
 */
async function sendViaSmtp({ to, name, otp, htmlContent, textContent }) {
  const cleanUser = process.env.SMTP_USER?.trim();
  const cleanPass = process.env.SMTP_PASS?.trim();
  if (!cleanUser || !cleanPass) return null;

  const senderEmail = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : "no-reply@echo-notes.ai";

  const mailOptions = {
    from: {
      name: "Echo AI Notes",
      address: senderEmail,
    },
    to,
    subject: `Your Echo Verification Code: ${otp}`,
    text: textContent,
    html: htmlContent,
    headers: {
      "X-Priority": "1",
      Importance: "high",
    },
  };

  // Primary: Port 465
  try {
    const transporter465 = createSmtpTransporter(465);
    const info = await transporter465.sendMail(mailOptions);
    return { success: true, messageId: info.messageId, provider: "SMTP (Port 465)" };
  } catch (err465) {
    console.warn(`[Echo Mail Notice] SMTP port 465 attempt failed: ${err465.message}. Retrying via port 587...`);

    // Fallback: Port 587
    try {
      const transporter587 = createSmtpTransporter(587);
      const info = await transporter587.sendMail(mailOptions);
      return { success: true, messageId: info.messageId, provider: "SMTP (Port 587)" };
    } catch (err587) {
      throw new Error(`SMTP ports 465 and 587 failed: ${err587.message}`);
    }
  }
}

/**
 * Master OTP email dispatch function.
 * Prioritizes HTTPS REST APIs (Port 443) which never get blocked by Render,
 * and falls back to standard SMTP.
 */
export async function sendOtpEmail({ to, name = "Echo User", otp }) {
  if (!isRealSmtpConfigured()) {
    console.warn(`[Echo Mail Notice] No real email provider configured. Cannot dispatch email to ${to}.`);
    return { success: false, error: "No email credentials configured" };
  }

  const textContent = `Hi ${name},\n\nYour Echo verification code is: ${otp}\n\nThis code will expire in 10 minutes. If you did not request this, please ignore this email.`;

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

  const payload = { to, name, otp, htmlContent, textContent };
  const errors = [];

  // Provider 1: Brevo API (HTTPS 443 - Recommended for Render)
  if (process.env.BREVO_API_KEY) {
    try {
      const res = await sendViaBrevo(payload);
      if (res?.success) {
        console.info(`[Echo Mail] Verification OTP email dispatched to ${to} via ${res.provider} (ID: ${res.messageId})`);
        return res;
      }
    } catch (err) {
      console.warn(`[Echo Mail Warning] Brevo dispatch to ${to} failed: ${err.message}`);
      errors.push(`Brevo: ${err.message}`);
    }
  }

  // Provider 2: Resend API (HTTPS 443)
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await sendViaResend(payload);
      if (res?.success) {
        console.info(`[Echo Mail] Verification OTP email dispatched to ${to} via ${res.provider} (ID: ${res.messageId})`);
        return res;
      }
    } catch (err) {
      console.warn(`[Echo Mail Warning] Resend dispatch to ${to} failed: ${err.message}`);
      errors.push(`Resend: ${err.message}`);
    }
  }

  // Provider 3: SendGrid API (HTTPS 443)
  if (process.env.SENDGRID_API_KEY) {
    try {
      const res = await sendViaSendGrid(payload);
      if (res?.success) {
        console.info(`[Echo Mail] Verification OTP email dispatched to ${to} via ${res.provider} (ID: ${res.messageId})`);
        return res;
      }
    } catch (err) {
      console.warn(`[Echo Mail Warning] SendGrid dispatch to ${to} failed: ${err.message}`);
      errors.push(`SendGrid: ${err.message}`);
    }
  }

  // Provider 4: Direct SMTP (Port 465 / 587)
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const res = await sendViaSmtp(payload);
      if (res?.success) {
        console.info(`[Echo Mail] Verification OTP email dispatched to ${to} via ${res.provider} (ID: ${res.messageId})`);
        return res;
      }
    } catch (err) {
      console.error(`[Echo Mail Error] SMTP dispatch to ${to} failed: ${err.message}`);
      errors.push(`SMTP: ${err.message}`);
    }
  }

  const summaryError = errors.join(" | ") || "All email providers failed";
  console.error(`[Echo Mail Final Failure] Could not deliver OTP email to ${to}: ${summaryError}`);
  return { success: false, error: summaryError };
}
