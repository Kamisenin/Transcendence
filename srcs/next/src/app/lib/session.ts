import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "%/lib/prisma";

const ten_y_ms = 10 * 365 * 24 * 60 * 60 * 1000;

export async function createSession(userId: string) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + ten_y_ms);

    await prisma.session.create({data: {id: token, userToken: userId, expiresAt,},});
    return token;
}

export async function getSessionUser(token: string) {
    const session = await prisma.session.findUnique({where: {id: token}, include: {user: true},});
    if (!session)
        return null;
    return session.user;
}

export async function deleteSession(token: string) {
    await prisma.session.delete({where: {id: token}}).catch(() => {});
}

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    
    if (!token)
        return null;
    return getSessionUser(token);
}