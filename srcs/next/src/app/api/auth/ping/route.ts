import { prisma } from '%/lib/prisma/prisma';
import { getSessionUser, getSessionCookie } from '%/lib/session';
import { NextResponse } from 'next/server';

export async function POST() {
    const user = await getSessionUser(await getSessionCookie());
    if (!user) {
        return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    await prisma.user.update({
        where: { user_id: user.user_id },
        data: { lastSeen: new Date() },
    });

    return NextResponse.json({ success: true });
}