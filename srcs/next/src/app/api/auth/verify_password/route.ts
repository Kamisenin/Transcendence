import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/session";
import { compare } from "bcrypt";

export async function POST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({error: "Not logged in"}, {status: 401});
    }
    const body = await req.json();
    const currentPassword = body.currentPassword as string;
    if (!currentPassword) {
        return NextResponse.json({ error: "Password required"}, {status: 400});
    }

    const match = await compare(currentPassword, user.password);
    if (!match) {
        return NextResponse.json({error: "incorrect password"}, {status: 401});
    }
    return NextResponse.json({success: true});
}