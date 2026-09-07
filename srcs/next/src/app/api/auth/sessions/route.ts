import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/session";
import { prisma } from "%/lib/prisma/prisma";
import { cookies } from "next/headers";

export async function GET() {
    const user = await getCurrentUser();
    if (!user)
        return NextResponse.json({error: "Not logged in"}, {status: 401});
    const cookieStore = await cookies();
    const currentToken = cookieStore.get("session_id")?.value;
    const sessions = await prisma.session.findMany({where: {userToken: user.user_id}, orderBy: {createdAt: "desc"}});
    const result = sessions.map((s) => ({id: s.id, ipAddress: s.ipAddress, createdAt: s.createdAt, expiresAt: s.expiresAt, isCurrent: s.id === currentToken}));
    return NextResponse.json({sessions: result});
}