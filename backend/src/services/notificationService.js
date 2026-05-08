const nodemailer = require("nodemailer");

// ─── Transporter ────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleString("so-SO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Email Templates ─────────────────────────────────────────────────────────
function buildTripAssignedEmail({ customerName, origin, destination, departureDate, tripDate, vehicleType, plateNumber, driverName, seatCount, notes }) {
  const subject = `✅ Booking Confirmed — ${origin} → ${destination}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
    .wrapper { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0f2557, #1a3a8f); padding: 32px 28px; text-align: center; }
    .header h1 { color: #2dd4bf; margin: 0; font-size: 22px; }
    .header p { color: rgba(255,255,255,0.75); margin: 8px 0 0; font-size: 14px; }
    .body { padding: 28px; }
    .greeting { font-size: 16px; color: #111827; margin-bottom: 20px; }
    .info-box { background: #f0f9ff; border-left: 4px solid #2dd4bf; border-radius: 8px; padding: 18px 20px; margin-bottom: 20px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e8f4f8; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #6b7280; font-weight: 600; }
    .info-value { color: #111827; font-weight: 500; }
    .route-banner { text-align: center; background: #ecfffb; border-radius: 10px; padding: 18px; margin-bottom: 20px; }
    .route-banner .route-text { font-size: 20px; font-weight: 700; color: #0f2557; }
    .route-banner .route-arrow { color: #2dd4bf; margin: 0 8px; }
    .footer { background: #f9fafb; padding: 20px 28px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
    .btn { display: inline-block; margin-top: 10px; background: #0f2557; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🚌 Hayaan Wacan Transport</h1>
      <p>Your booking has been confirmed</p>
    </div>
    <div class="body">
      <p class="greeting">Hello <strong>${customerName}</strong>,</p>
      <p style="color:#374151; font-size:14px; margin-bottom:20px;">
        Great news! Your booking has been assigned to a trip. Here are your travel details:
      </p>

      <div class="route-banner">
        <div class="route-text">
          <span>${origin}</span>
          <span class="route-arrow">→</span>
          <span>${destination}</span>
        </div>
      </div>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">📅 Trip Date </span>
          <span class="info-value">${tripDate ? new Date(tripDate).toLocaleDateString() : "N/A"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">🕐 Departure Time </span>
          <span class="info-value">${formatDate(departureDate)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">🚌 Vehicle</span>
          <span class="info-value">${vehicleType ?? "N/A"} — ${plateNumber ?? "N/A"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">👤 Driver Name </span>
          <span class="info-value">${driverName ?? "N/A"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">💺 Seats Reserved </span>
          <span class="info-value">${seatCount}</span>
        </div>
        ${notes ? `<div class="info-row"><span class="info-label">📝 Notes</span><span class="info-value">${notes}</span></div>` : ""}
      </div>

      <p style="font-size:13px; color:#6b7280;">
        Please arrive at the departure point at least <strong>15 minutes early</strong>. 
        For any changes or inquiries, contact our support team.
      </p>
    </div>
    <div class="footer">
      <p>© 2025 Hayaan Wacan Transport. All rights reserved.</p>
      <p>This is an automated notification — please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, html };
}

// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * Send a trip-assigned notification email to a customer.
 * Fails silently (logs error) so it never breaks the main trip flow.
 */
async function sendTripAssignedEmail(to, data) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("[Notification] Gmail credentials not configured — skipping email.");
    return;
  }

  try {
    const { subject, html } = buildTripAssignedEmail(data);
    await transporter.sendMail({
      from: `"Hayaan Wacan Transport" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Notification] Email sent to ${to}`);
  } catch (error) {
    console.error(`[Notification] Failed to send email to ${to}:`, error.message);
  }
}

module.exports = { sendTripAssignedEmail };
