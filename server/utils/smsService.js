import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const formatMobile = (mobile) => {
  let formattedMobile = String(mobile).trim();
  if (formattedMobile.length === 10) {
    formattedMobile = `+91${formattedMobile}`;
  } else if (!formattedMobile.startsWith('+')) {
    formattedMobile = `+${formattedMobile}`;
  }
  return formattedMobile;
};

export const sendOtpSms = async (mobile, otp) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !verifyServiceSid) {
    console.warn("[MOCK SMS] Twilio credentials missing. Mocking SMS to:", mobile);
    return true;
  }

  const client = twilio(accountSid, authToken);
  const formattedMobile = formatMobile(mobile);

  try {
    const verification = await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({ to: formattedMobile, channel: "sms" });
      
    console.log(`Twilio OTP sent successfully to: ${formattedMobile}. Status: ${verification.status}`);
    return true;
  } catch (error) {
    console.error("Error sending Twilio OTP:", error);
    return false;
  }
};

export const verifyOtpSms = async (mobile, code) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !verifyServiceSid) {
    console.warn("[MOCK SMS] Twilio credentials missing. Mocking verification for:", mobile, "Code:", code);
    return true; 
  }

  const client = twilio(accountSid, authToken);
  const formattedMobile = formatMobile(mobile);

  try {
    const verificationCheck = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({ to: formattedMobile, code });
      
    if (verificationCheck.status === "approved") {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error verifying Twilio OTP:", error);
    return false;
  }
};
