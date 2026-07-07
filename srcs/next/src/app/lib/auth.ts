import { prisma } from "%/lib/prisma";
import { redirect } from "next/navigation";
import { cookies, headers } from 'next/headers'

export async function getUserIp(): Promise<string>
{
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");

    if (forwardedFor) {
        const ip = forwardedFor.split(",")[0].trim();
        return ip;
    }

    const realIp = headersList.get("x-real-ip");
    if (realIp) return realIp;

    return ("idk"); //TODO Throw une erreur
}