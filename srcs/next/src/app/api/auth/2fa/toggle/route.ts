import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/session";
import { prisma } from "%/lib/prisma";
import TwoFactorToggle from "@/components/TwoFactor";

export async function POST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user)
        return NextResponse.json({error: "Not logged in"}, {status: 401});

    const body = await req.json();
    const enable = body.enable as boolean;

    if (enable && !user.emailVerified)
        return NextResponse.json({error: "Email must be verified first"}, {status: 400});

    await prisma.user.update({
        where: {user_id: user.user_id},
        data: {twoFactorEnabled: enable},
    });
    return NextResponse.json({success: true, TwoFactorEnbale: enbale});
}