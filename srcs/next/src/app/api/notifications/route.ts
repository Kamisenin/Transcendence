import { prisma } from '%/lib/prisma/prisma';
import { getSessionUser, getSessionCookie } from '%/lib/session';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const user = await getSessionUser(await getSessionCookie());
    if (!user) {
        return NextResponse.json({ error: 'Unidentified User' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);

    const notifications = await prisma.notification.findMany({
        where: { recipientId: user.user_id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
            actor: { select: { username: true, imgLink: true, accountId: true } },
            page: {
                select: {
                    pageId: true,
                    title: true,
                    slugs: { where: { isCanonical: true }, select: { namespace: true, slug: true } },
                },
            },
        },
    });

    const result = notifications.map((n: typeof notifications[number]) => ({
        id: n.id,
        type: n.type,
        read: n.read,
        createdAt: n.createdAt,
        actor: n.actor ? { username: n.actor.username, imgLink: n.actor.imgLink } : null,
        page: n.page
            ? {
                pageId: n.page.pageId,
                title: n.page.title,
                canonicalSlug: n.page.slugs[0] || null,
            }
            : null,
    }));

    return NextResponse.json({ notifications: result });
}