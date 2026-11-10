const { db } = require("../models/db");

function configuredChannel(preferred) {
  const hasWhatsApp = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM;
  const hasSms = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_SMS_FROM;
  if (preferred === "whatsapp" && hasWhatsApp) return "whatsapp";
  if (preferred === "sms" && hasSms) return "sms";
  if (hasWhatsApp) return "whatsapp";
  if (hasSms) return "sms";
  return null;
}

async function sendApplicationUpdate(user, application, message, preferred = "whatsapp") {
  const channel = configuredChannel(preferred);
  if (!channel || !user.phone_number || (channel === "whatsapp" && !user.whatsapp_opt_in)) {
    db.prepare(`INSERT INTO notifications (user_id, application_id, channel, message, status) VALUES (?, ?, ?, ?, ?)`)
      .run(user.id, application.id, channel || preferred || "whatsapp", message, "demo_pending");
    return { sent: false, status: "demo_pending", reason: channel ? "WhatsApp opt-in is required" : "Twilio is not configured" };
  }

  try {
    const account = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const to = channel === "whatsapp" ? `whatsapp:${user.phone_number}` : user.phone_number;
    const from = channel === "whatsapp" ? process.env.TWILIO_WHATSAPP_FROM : process.env.TWILIO_SMS_FROM;
    const body = new URLSearchParams({ To: to, From: from, Body: message });
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${account}/Messages.json`, {
      method: "POST",
      headers: { "Authorization": `Basic ${Buffer.from(`${account}:${token}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
      body
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Twilio HTTP ${response.status}`);
    db.prepare(`INSERT INTO notifications (user_id, application_id, channel, message, provider_message_id, status) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(user.id, application.id, channel, message, data.sid || null, data.status || "queued");
    return { sent: true, status: data.status || "queued", channel, sid: data.sid || null };
  } catch (err) {
    db.prepare(`INSERT INTO notifications (user_id, application_id, channel, message, status) VALUES (?, ?, ?, ?, ?)`)
      .run(user.id, application.id, channel, message, "failed");
    return { sent: false, status: "failed", reason: err.message };
  }
}

module.exports = { sendApplicationUpdate };
