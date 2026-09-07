import { cookies } from "next/headers";
import type { Session, User } from "@prisma/client";
import { prisma } from "%/lib/prisma/prisma";
import { getUserIp } from "%/lib/auth";

export async function createSession(userId: string, stayConnected = false): Promise<Session> {

    const ip: string = await getUserIp();
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

export async function getSessionCookie() : Promise<string | null> {
    const cookieStore = await cookies();
    const session_id = cookieStore.get("session_id");
    return session_id ? session_id.value : null;

}

export async function getSessionUser(token: string | null) : Promise<User | null> {

    if (!token || token.length === 0) return null;

    const session = await prisma.session.findUnique({where: {id: token}, include: {user: true},});
    if (!session || await isSessionExpired(session))
        return null;
    return session.user;
}

export async function isSessionExpired(session : Session) : Promise<boolean> {
    if (session.expiresAt < new Date(Date.now())) {
        await deleteSession(session.id);
        return true;
    }
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
    return user;
}

export async function setCookies(session: Session, stayConnected: boolean)
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