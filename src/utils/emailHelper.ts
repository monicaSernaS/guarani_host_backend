import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Send email using Gmail SMTP
 */
export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"GuaraniHost" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("📧 Email sent to", to);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
};
