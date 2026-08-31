import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/session";
import { prisma } from "%/lib/prisma/prisma"
import { compare } from "bcrypt";
import { DeletedUserExists } from "%/lib/delete_user";
import { sendAccountDeletedEmail } from "@/app/lib/email";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user)
        return NextResponse.json({error: "Not logged in"}, {status: 401});

    const body = await req.json();
    const password = body.password as string;
    if (!password)
        return NextResponse.json({error: "password required"}, {status: 400});
    
    const match = await compare(password, user.password)
    if (!match)
        return NextResponse.json({error: "Incorrect password"}, {status: 401});

    const deletedUser = await DeletedUserExists();
    const email = user.email;
        await prisma.$transaction([
            prisma.page.updateMany({where: {ownerId: user.user_id}, data: {ownerId: deletedUser.user_id}}),
            prisma.tag.updateMany({where: {ownerToken: user.user_id}, data: {ownerToken: deletedUser.user_id}}),
            prisma.organization.updateMany({where: {ownerToken: user.user_id}, data: {ownerToken: deletedUser.user_id}}),
            prisma.upload.updateMany({where: {ownerToken: user.user_id}, data: {ownerToken: deletedUser.user_id}}),
            prisma.tagPageRequest.updateMany({where: {requestedBy: user.user_id}, data: {requestedBy: deletedUser.user_id}}),
            prisma.tagPageRequest.updateMany({where: {reviewedBy: user.user_id}, data: {reviewedBy: deletedUser.user_id}}),
            prisma.user.delete({where: {user_id: user.user_id}}),
        ]);

        const cookieStore = await cookies();
        cookieStore.set("session_id", "", {path: "/", maxAge: 0});
        await sendAccountDeletedEmail(email);
        return NextResponse.json({success: true});
}