import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/session";
import { prisma } from "%/lib/prisma/prisma"

export async function POST(req: NextRequest) {
    const user = await getCurrentUser();

    if (!user)
        return NextResponse.json({error:"Not logged"},{status:401});
    const body = await req.json();

    const accountId = body.accountId?.trim();
    const username = body.username?.trim();
    const firstName = body.firstName?.trim() || null;
    const lastName = body.lastName?.trim() || null;
    const email = body.email?.trim();

    if (!accountId || !username || !email)
        return NextResponse.json({error: "Account name, username and email are required"}, {status: 400});

    const accountIdChanged = body.accountId !== user.accountId;
    const emailChanged = body.email !== user.email;
    const usernameChanged = body.username !== user.username;

    if (accountIdChanged) {
        const existing = await prisma.user.findUnique({where: {accountId: body.accountId}});
        if (existing && existing.user_id !== user.user_id) {
            return NextResponse.json({error: "Account name already in use"}, {status: 409});
        }
    }
    if (usernameChanged){
        const existing = await prisma.user.findFirst({where: {username: body.username}});
        if (existing && existing.user_id !== user.user_id) {
            return NextResponse.json({error: "Username already in use"}, {status: 409});
        }
    }
    if (emailChanged) {
        const existing = await prisma.user.findUnique({ where : { email: body.email }});
        if (existing && existing.user_id !== user.user_id)
            return NextResponse.json({ error: "Email already in use" }, {status: 409});

        await prisma.user.update({
            where: {user_id: user.user_id},
            data: {
                accountId: body.accountId,
                username: body.username,
                firstName: body.firstName,
                lastName: body.lastName,
                email: body.email,
                emailVerified: false,
                twoFactorEnabled: false,
            },
        });
    } else {
        await prisma.user.update({
            where:{
                user_id:user.user_id
            },
            data:{
                accountId: body.accountId,
                username: body.username,
                firstName: body.firstName,
                lastName: body.lastName,
                email: body.email,
            }
        });
    }
    return NextResponse.json({success:true});
}
