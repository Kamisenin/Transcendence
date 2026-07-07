import {createUser, getUser, isAccountIdUsed, isEmailUsed} from "%/lib/prisma-utils";
import {createSession, setCookies} from "%/lib/session";
import { compare } from 'bcrypt';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const body = await req.json();

    if (!body.id || !body.password)
        return NextResponse.json({ error: "Field Required" }, { status: 400 });

    const user = await getUser(body.id);
    if (!user) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const password = body.password as string;
    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch) {
        throw new Error("Identifiants incorrects");
    }

    const stayConnected = body.stayConnected as boolean;
    const session = await createSession(user.user_id, stayConnected);
    await setCookies(session, stayConnected);
    return NextResponse.json({ success: true, message: "User logged in" }, { status: 201 });
}