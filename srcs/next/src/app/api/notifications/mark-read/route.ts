import { prisma } from '%/lib/prisma/prisma';
import { getSessionUser, getSessionCookie } from '%/lib/session';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const user = await getSessionUser(await getSessionCookie());
    if (!user) {
        return NextResponse.json({ error: 'Unidentified User' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    if (body?.all) {
        await prisma.notification.updateMany({
            where: { recipientId: user.user_id, read: false },
            data: { read: true },
        });
        return NextResponse.json({ success: true });
    }

    const id = Number(body?.id);
    if (!id) {
        return NextResponse.json({ error: 'Missing notification id' }, { status: 400 });
    }

    await prisma.notification.updateMany({
        where: { id, recipientId: user.user_id },
        data: { read: true },
    });

    return NextResponse.json({ success: true });
}