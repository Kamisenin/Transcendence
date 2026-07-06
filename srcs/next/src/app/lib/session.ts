import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "%/lib/prisma";
import { getUserIp } from "%/lib/auth";

const ten_y_ms = 10 * 365 * 24 * 60 * 60 * 1000;

export async function createSession(userId: string, stayConnected: boolean): Promise<prisma.session> {

    const ip : string = await getUserIp();
    const expiresAt = stayConnected
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)  // 30 jours
        : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    return await prisma.session.create({
        data: {
            userToken: userId,
            expiresAt,
            ipAddress: ip
        }
    });
}

export async function getSessionUser(token: string) {
    const session = await prisma.session.findUnique({where: {id: token}, include: {user: true},});
    if (!session || await isSessionExpired(session))
        return null;
    return session.user;
}

export async function isSessionExpired(session : prisma.session) : Promise<boolean> {
    if (session.expiresAt < Date.now()) {
        deleteSession(session.id);
        return true;
    }
    console.log("session not expired: " + Date.now());
    return false;
}

export async function deleteSession(token: string) {
    await prisma.session.delete({where: {id: token}}).catch(() => {});
}

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_id")?.value;
    if (!token)
        return null;
    const user = await getSessionUser(token);
    console.log(user);
    return user;
}

export async function setCookies(session: prisma.session, stayConnected: boolean)
{
    const cookieStore = await cookies();
    if (!stayConnected) {
        cookieStore.set('session_id', session.id, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        });
        return;
    }
    cookieStore.set('session_id', session.id, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30
    });
}