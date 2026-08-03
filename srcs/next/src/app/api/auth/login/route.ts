import { sendVerifEmail, generateVerifCode, getVerifExpiry } from "@/app/lib/email";
import {createUser, getUser, isAccountIdUsed, isEmailUsed} from "%/lib/prisma/prisma-utils";
import {createSession, setCookies} from "%/lib/session";
import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcrypt';
import { cookies } from "next/headers";
import { prisma } from "%/lib/prisma/prisma"

export async function POST(req: NextRequest) {
    const body = await req.json();

    if (!body.id || !body.password)
        return NextResponse.json({error: "Field Required"}, {status: 400});

    const user = await getUser(body.id);
    if (!user)
        return NextResponse.json({error: "Invalid credentials"}, {status: 401});

    const password = body.password as string;
    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch)
        return NextResponse.json({error: "Invalid credentials"}, {status: 401});
    if (user.twoFactorEnabled) {
        const code = generateVerifCode();
        const expiry = getVerifExpiry();

        await prisma.user.update({where: {user_id: user.user_id}, data: {verifCode: code, verifExpiry: expiry}});
        await sendVerifEmail(user.email, code);

        const cookieStore = await cookies();
        cookieStore.set("pending_2fa_user", user.user_id, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 10,
        });
        return NextResponse.json({success: true, twoFactorRequired: true});
    }

    const stayConnected = body.stayConnected as boolean;
    const session = await createSession(user.user_id, stayConnected);
    await setCookies(session, stayConnected);
    return NextResponse.json({success: true, twoFactorRequired: false});
}
