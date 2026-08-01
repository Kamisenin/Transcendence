import nodemailer from "nodemailer"
import crypto from "crypto";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    }
})

export function generateVerifCode(): string {
    return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export  function getVerifExpiry(): Date {
    return new Date(Date.now() + 15 * 60 * 1000);
}

export async function sendVerifEmail(to: string, code: string) {
    try {
        const info = await transporter.sendMail({
            from: `"transcendence" <${process.env.GMAIL_USER}>`,
            to,
            subject: "Your verification code",
            html: `<p>Your verification code is: <strong>${code}</strong></p><p>This code expires in 15 minutes.</p>`,
        });
        console.log("Email sent:", info.messageId);
    } catch (error) {
        console.error("Resend error:", error);
    }
}