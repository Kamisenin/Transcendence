import { prisma } from "%/lib/prisma";
import { redirect } from "next/navigation";
import { cookies, headers } from 'next/headers'

export async function getUserIp() : string
{
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");

    if (forwardedFor) {
        const ip = forwardedFor.split(",")[0].trim();
        return ip;
    }

    const realIp = headersList.get("x-real-ip");
    if (realIp) return realIp;

    return ("idk");
}

export async function getSession() : prisma.session {

    const cookieStore  = await cookies();
    const sessionToken : string = cookieStore.get("session_id")?.value
    if (!sessionToken)
        return null;
    const ip : string = getUserIp();
    const session = await prisma.session.findUnique({ where: { id: sessionToken, ipAddress: ip} });
    if (session.expiresAt <= new Date().getTime()) {
        await prisma.session.delete({where: {id: sessionToken}});
        return null;
    }
    return session;
}