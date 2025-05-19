"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * Send email using Gmail SMTP
 */
const sendEmail = async (to, subject, html) => {
    try {
        const transporter = nodemailer_1.default.createTransport({
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
    }
    catch (error) {
        console.error("❌ Error sending email:", error);
    }
};
exports.sendEmail = sendEmail;
