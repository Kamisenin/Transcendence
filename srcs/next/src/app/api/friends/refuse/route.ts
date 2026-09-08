import { prisma } from '%/lib/prisma/prisma';
import { getSessionUser, getSessionCookie } from '%/lib/session';
import { refuseFriend } from '@/actions/friendship';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const user = await getSessionUser(await getSessionCookie());
    if (!user) {
        return NextResponse.json({ error: 'Unidentified User' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const notificationId = Number(body?.notificationId);
    if (!notificationId) {
        return NextResponse.json({ error: 'Missing notification id' }, { status: 400 });
    }

    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });

    if (!notification || notification.recipientId !== user.user_id || !notification.friendshipId) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    await refuseFriend(notification.friendshipId);

    return NextResponse.json({ success: true });
}