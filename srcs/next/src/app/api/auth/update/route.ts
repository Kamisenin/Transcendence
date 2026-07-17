import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/session";
import { prisma } from "%/lib/prisma"
import { sendVerifEmail, generateVerifCode, getVerifExpiry } from "@/app/lib/email";


export async function POST(req: NextRequest) {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({error:"Not logged"},{status:401});
    }
    const body = await req.json();
    const emailChanged = body.email !== user.email;

    if (emailChanged) {
        const existing = await prisma.user.findUnique({ where : { email: body.email }});
        if (existing && existing.user_id !== user.user_id) {
            return NextResponse.json({ error: "Email already in use" }, {status: 409});
        }
    }
    if (emailChanged) {
        const code = generateVerifCode();
        const expiry = getVerifExpiry();

        await prisma.user.update({
            where: {user_id: user.user_id},
            data: {
                username: body.username,
                email: body.email,
                emailVerified: false,
                verifCode: code,
                verifExpiry: expiry,
            },
        });
        await sendVerifEmail(body.email, code);
    } else {
        await prisma.user.update({
            where:{
                user_id:user.user_id
            },
            data:{
                username: body.username,
                email: body.email,
            }
        });
    }
    return NextResponse.json({success:true});
}