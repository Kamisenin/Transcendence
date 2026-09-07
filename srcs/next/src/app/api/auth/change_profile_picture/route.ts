import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/session";
import { compare, genSalt, hash} from 'bcrypt';
import { prisma } from "%/lib/prisma/prisma";

export async function POST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user)
        return NextResponse.json({error: "Not logged in"}, {status: 401});
    const body = await req.json();
    const newPath = body.newPath as string;
    if (!newPath)
        return NextResponse.json({error: "Field required"}, {status: 400});

    await prisma.user.update({
        where: {user_id: user.user_id},
        data: {imgLink: newPath},
    });
    return NextResponse.json({success: true});
}
