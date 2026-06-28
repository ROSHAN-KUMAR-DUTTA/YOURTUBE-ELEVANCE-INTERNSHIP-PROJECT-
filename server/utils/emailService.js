import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.NODEMAILER_EMAIL,    // b031ae001@smtp-brevo.com
    pass: process.env.NODEMAILER_PASSWORD, // xsmtpsib-xxx...
  },
});

export const sendInvoiceEmail = async (user, invoice) => {
  const mailOptions = {
    from: `"YourTube Premium" <${process.env.NODEMAILER_EMAIL}>`,
    to: user.email,
    subject: `Invoice for YourTube Premium - ${invoice.planName} Plan`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #ff0000; text-align: center;">YourTube Premium</h2>
        <p>Hi <strong>${user.name || "User"}</strong>,</p>
        <p>Thank you for upgrading to <strong>YourTube ${invoice.planName}</strong>!</p>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Invoice Details</h3>
          <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
          <p><strong>Date:</strong> ${new Date(invoice.paymentDate).toLocaleDateString()}</p>
          <p><strong>Payment ID:</strong> ${invoice.paymentId}</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb;" />
          <p style="font-size: 16px;"><strong>Amount Paid:</strong> ₹${invoice.amount}</p>
        </div>
        <p>Your subscription is now active. Enjoy your enhanced experience!</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Invoice email sent to:", user.email);
    return true;
  } catch (error) {
    console.error("❌ Email failed - Code:", error.code);
    console.error("❌ Email failed - Message:", error.message);
    return false;
  }
};

export const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: `"YourTube Auth" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: `YourTube Login OTP`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #ff0000; text-align: center;">YourTube Authentication</h2>
        <p>Your One Time Password (OTP) for login is:</p>
        <h1 style="text-align: center; font-size: 40px; letter-spacing: 5px; color: #333;">${otp}</h1>
        <p>This OTP is valid for 10 minutes. Do not share it with anyone.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ OTP email sent to:", email);
    return true;
  } catch (error) {
    console.error("❌ OTP Email failed - Code:", error.code);
    console.error("❌ OTP Email failed - Message:", error.message);
    return false;
  }
};