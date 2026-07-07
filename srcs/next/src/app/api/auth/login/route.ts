import {createSession, setCookies} from "%/lib/session";
import { compare } from 'bcrypt';
import { NextResponse, NextRequest } from 'next/server';

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
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const stayConnected = false; //TODO create a stay connected button
    // formData.get("stayConnected") as boolean;
    const session = await createSession(user.user_id, stayConnected);
    await setCookies(session, stayConnected);
    return NextResponse.json({ success: true, message: "User logged in" }, { status: 200 });
}