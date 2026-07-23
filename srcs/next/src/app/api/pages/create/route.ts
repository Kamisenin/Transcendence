import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/session";
import { prisma } from "%/lib/prisma";

export async function POST(req: NextRequest) {
    const user = await getCurrentUser();

    if (!user)
        return NextResponse.json({error: "Not logged in"}, {status: 401});

    const page = await prisma.page.create({
        data: {
            title: "Untitled page",
            ownerId: user.user_id,
        },
    });
    return NextResponse.json({success: true, pageId: page.pageId});
}