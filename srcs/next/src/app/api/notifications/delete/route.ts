import { prisma } from '%/lib/prisma/prisma';
import { getSessionUser, getSessionCookie } from '%/lib/session';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
    const user = await getSessionUser(await getSessionCookie());
    if (!user) {
        return NextResponse.json({ error: 'Unidentified User' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const id = Number(body?.id);
    if (!id) {
        return NextResponse.json({ error: 'Missing notification id' }, { status: 400 });
    }

    await prisma.notification.deleteMany({
        where: { id, recipientId: user.user_id },
    });

    return NextResponse.json({ success: true });
}