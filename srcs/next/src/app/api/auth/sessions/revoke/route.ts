import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/session";
import { prisma } from "%/lib/prisma/prisma";

export async function POST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user)
        return NextResponse.json({error: "Not logged in"}, {status: 401});
    const body = await req.json();
    const sessionId = body.sessionId as string;
    if (!sessionId)
        return NextResponse.json({error: "Session id required"}, {status: 400});
    const session = await prisma.session.findUnique({where: {id: sessionId}});
    if (!session || session.userToken !== user.user_id)
        return NextResponse.json({error: "Session not found"}, {status: 404});
    await prisma.session.delete({where: {id: sessionId}});
    return NextResponse.json({success: true});
}