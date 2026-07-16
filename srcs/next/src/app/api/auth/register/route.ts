import {createUser, isAccountIdUsed, isEmailUsed} from "%/lib/prisma-utils";
import bcrypt from 'bcrypt';
import { NextResponse, NextRequest } from 'next/server';
import {createSession, setCookies} from "%/lib/session";
import { sendVerifEmail, generateVerifCode, getVerifExpiry } from "@/app/lib/email";
import { prisma } from "%/lib/prisma";

export async function POST(req: NextRequest) {
    const body = await req.json();
    let username = '';

    console.log(body)
    if (!body.password || !body.email || !body.accountId) {
        return NextResponse.json({ error: "Field Required" }, { status: 400 });
    }

    username = body.accountId;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(body.password, salt);
    console.log("Password ready to be registered : ", hashedPassword);

    if (body.username) username = body.username;

    console.log("Email : " + body.email + " accountId : " + body.accountId);
    if (await isEmailUsed(body.email) || await isAccountIdUsed(body.accountId)) {
        return NextResponse.json({ error: "Email or Account id already in use" }, { status: 409 });
    }
    const user = await createUser(hashedPassword, body.email, body.accountId, username);
    const code = generateVerifCode();
    const expiry = getVerifExpiry();
    await prisma.user.update({
        where: { user_id: user.user_id },
        data: { verifCode: code, verifExpiry: expiry },
    });
    await sendVerifEmail(user.email, code);
    const session = await createSession(user.user_id);
    await setCookies(session, body.stayConnected);
    return NextResponse.json({ success: true, message: "User created and logged in" }, { status: 201 });
}