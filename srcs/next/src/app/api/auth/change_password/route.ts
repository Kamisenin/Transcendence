import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/session";
import { compare, genSalt, hash} from "bcrypt";
import { prisma } from "%/lib/prisma";

export async function POST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user)
        return NextResponse.json({error: "Not logged in"}, {status: 401});
    const body = await req.json();
    const currentPassword = body.currentPassword as string;
    const newPassword = body.newPassword as string;
    if (!currentPassword || !newPassword)
        return NextResponse.json({error: "Field required"}, {status: 400});

    const match = await compare(currentPassword, user.password);
    if (!match)
        return NextResponse.json({error: "Incorrect password"}, {status: 401});
    
    const salt = await genSalt(10);
    const hashedPassword = await hash(newPassword, salt);

    await prisma.user.update({
        where: {user_id: user.user_id},
        data: {password: hashedPassword},
    });
    return NextResponse.json({success: true});
}