import {createUser, isAccountIdUsed, isEmailUsed} from "%/lib/prisma-utils";
import bcrypt from 'bcrypt';
import { redirect } from "next/navigation";
import { NextResponse, NextRequest } from 'next/server';
import {createSession, setCookies} from "%/lib/session";

export async function POST(req: NextRequest) {
    const body = await req.json();
    let username = '';

    if (!body.password || !body.email || !body.accountId) {
        return NextResponse.json({ error: "Field Required" }, { status: 400 });
    }

    username = body.accountId;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(body.password, salt);

    if (body.username) username = body.username;

    if (await isEmailUsed(body.email) || await isAccountIdUsed(body.accountId)) {
        return NextResponse.json({ error: "Email or account id already in use" }, { status: 409 });
    }
    const user = await createUser(hashedPassword, body.email, body.accountId, username);
    const session = await createSession(user.user_id, body.stayConnected);
    await setCookies(session, body.stayConnected);
    return NextResponse.json({ success: true, message: "User created and logged in" }, { status: 201 });
}