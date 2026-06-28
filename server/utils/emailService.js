import dotenv from "dotenv";
dotenv.config();

export const sendInvoiceEmail = async (user, invoice) => {
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "YourTube Premium",
          email: "rodutta2007@gmail.com",
        },
        to: [{ email: user.email, name: user.name || "User" }],
        subject: `Invoice - YourTube ${invoice.planName} Plan`,
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #eee;border-radius:10px;">
            <h2 style="color:#ff0000;text-align:center;">🎬 YourTube Premium</h2>
            <p>Hi <strong>${user.name || "User"}</strong>,</p>
            <p>Thank you for upgrading to <strong>${invoice.planName}</strong> Plan!</p>
            <div style="background:#f9fafb;padding:15px;border-radius:8px;margin:20px 0;">
              <h3 style="margin-top:0;">Invoice Details</h3>
              <p><strong>Invoice No:</strong> ${invoice.invoiceNumber}</p>
              <p><strong>Date:</strong> ${new Date(invoice.paymentDate).toLocaleDateString("en-IN")}</p>
              <p><strong>Payment ID:</strong> ${invoice.paymentId}</p>
              <p><strong>Plan:</strong> ${invoice.planName}</p>
              <hr style="border:0;border-top:1px solid #e5e7eb;"/>
              <p style="font-size:18px;"><strong>Amount Paid: ₹${invoice.amount}</strong></p>
            </div>
            <p>Your premium subscription is now active. Enjoy unlimited watching! 🚀</p>
            <p style="color:#888;font-size:12px;">This is an automated email from YourTube.</p>
          </div>
        `,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      console.error("❌ Brevo API error:", JSON.stringify(result));
      return false;
    }
    console.log("✅ Invoice email sent to:", user.email);
    return true;
  } catch (err) {
    console.error("❌ Email failed:", err.message);
    return false;
  }
};

export const sendOtpEmail = async (email, otp) => {
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "YourTube Auth",
          email: "rodutta2007@gmail.com",
        },
        to: [{ email }],
        subject: "Your YourTube Login OTP",
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #eee;border-radius:10px;">
            <h2 style="color:#ff0000;text-align:center;">🔐 YourTube Authentication</h2>
            <p>Your One Time Password (OTP) is:</p>
            <h1 style="text-align:center;font-size:48px;letter-spacing:8px;color:#333;">${otp}</h1>
            <p>Valid for <strong>10 minutes</strong>. Do not share with anyone.</p>
          </div>
        `,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      console.error("❌ OTP email error:", JSON.stringify(result));
      return false;
    }
    console.log("✅ OTP email sent to:", email);
    return true;
  } catch (err) {
    console.error("❌ OTP email failed:", err.message);
    return false;
  }
};