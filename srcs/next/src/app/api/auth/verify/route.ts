import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/session";
import { prisma } from  "%/lib/prisma";

export async function POST (req: NextRequest) {
    const user = await getCurrentUser();

    if (!user)
        return NextResponse.json({ error: "Not logged in" }, {status: 401});
    const body = await req.json();
    const submittedCode = body.code as string;
    if (!submittedCode) {
        return NextResponse.json({ error: "Code required" }, {status: 400});
    }
    if (user.email_verified) {
        return NextResponse.json({ error: "Already verified" }, {status: 400});
    }
    if (!user.verifCode || !user.verifExpiry) {
        return NextResponse.json({ error: "No pending verification" }, {status: 400});
    }
    if (user.verifExpiry < new  Date()) {
        return NextResponse.json({ error: "Code expired" }, {status: 400});
    }
    if (user.verifCode !== submittedCode) {
        return NextResponse.json({ error: "Invalid code" }, {status: 400});
    }
    await prisma.user.update({
        where: { user_id: user.user_id },
        data: {
            emailVerified: true,
            verifCode: null,
            verifExpiry: null,
        },
    });
    return NextResponse.json({ success: true, message: "Email verified"});
}