import { Resend } from "resend";
import crypto from "crypto";


const resend = new Resend(process.env.RESEND_API_KEY);

export function generateVerifCode(): string {
    return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export  function getVerifExpiry(): Date {
    return new Date(Date.now() + 15 * 60 * 1000);
}

export async function sendVerifEmail(to: string, code: string) {
    await resend.emails.send({
        from: "onboarding@resend.dev",
        to,
        subject: "Your verification code",
        html: `<p>Your verification code is: <strong>${code}</strong></p><p>This code expires in 15 minutes.</p>`,
    });
}