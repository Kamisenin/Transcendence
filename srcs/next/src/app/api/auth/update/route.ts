import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/session";
import { prisma } from "%/lib/prisma"

export async function POST(req: NextRequest) {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json(
            {error:"Not logged"},
            {status:401}
        );
    }
    const body = await req.json();

    await prisma.user.update({
        where:{
            user_id:user.user_id
        },
        data:{
            username: body.username,
            email: body.email,
        }
    });
    return NextResponse.json({
        success:true
    });
}