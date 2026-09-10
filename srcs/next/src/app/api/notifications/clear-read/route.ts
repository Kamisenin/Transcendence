import { prisma } from '%/lib/prisma/prisma';
import { getSessionUser, getSessionCookie } from '%/lib/session';
import { NextResponse } from 'next/server';

export async function DELETE() {
    const user = await getSessionUser(await getSessionCookie());
    if (!user) {
        return NextResponse.json({ error: 'Unidentified User' }, { status: 401 });
    }

    await prisma.notification.deleteMany({
        where: { recipientId: user.user_id, read: true },
    });

    return NextResponse.json({ success: true });
}