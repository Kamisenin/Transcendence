import { NextRequest, NextResponse } from "next/server";
import { createSession, setCookies } from "@/app/lib/session";
import { cookies } from "next/headers";
import { prisma } from "%/lib/prisma"

export async function POST(req: NextRequest) {
    const cookieStore = await cookies();
    const userId = cookieStore.get("pending_2fa_user")?.value;

    if (!userId)
        return NextResponse.json({error: "No pending 2FA verification"}, {status: 400});
    const body = await req.json();
    const submittedCode = body.code as string;

    if (!submittedCode)
        return NextResponse.json({error: "Code required"}, {status: 400});
    const user = await prisma.user.findUnique({where: {user_id: userId}});

    if (!user || !user.verifCode || !user.verifExpiry)
        return NextResponse.json({error: "No pending verification"}, {status: 400});
    if (user.verifCode !== submittedCode) 
        return NextResponse.json({error: "invalid code"}, {status: 400});
    
    await prisma.user.update({where: {user_id: user.user_id}, data: {verifCode: null, verifExpiry: null}});
    const session = await createSession(user.user_id, body.stayConnected ?? false)
    await setCookies(session, body.stayConnected ?? false);
    cookieStore.delete("pending_2fa_user");
    return NextResponse.json({success: true});    
}