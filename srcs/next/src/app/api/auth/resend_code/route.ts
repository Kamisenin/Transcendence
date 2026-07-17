import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/session";
import { prisma } from  "%/lib/prisma";
import { sendVerifEmail, getVerifExpiry, generateVerifCode } from "@/app/lib/email";

export async function POST(req: NextRequest) {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: "Not logged in"} , { status: 401});
    }
    if (user.emailVerified) {
        return NextResponse.json( {success: true, message: "Already verified"});
    }
    const code = generateVerifCode();
    const expiry = getVerifExpiry();

    await prisma.user.update({
        where: { user_id: user.user_id },
        data: { verifCode: code, verifExpiry: expiry },
    });
    await sendVerifEmail(user.email, code);
    return NextResponse.json({ success: true, message: "Code resent" });
}