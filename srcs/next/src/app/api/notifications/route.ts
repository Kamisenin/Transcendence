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
            tagPageRequest: {
                select: {
                    id: true,
                    status: true,
                    tag: { select: { name: true, namespace: true } },
                    page: {
                        select: {
                            pageId: true,
                            title: true,
                            slugs: { where: { isCanonical: true }, select: { namespace: true, slug: true } },
                        },
                    },
                },
            },
            orgTagRequest: {
                select: {
                    id: true,
                    status: true,
                    organization: { select: { name: true } },
                    tag: { select: { name: true, namespace: true } },
                },
            },
            orgPageRequest: {
                select: {
                    id: true,
                    status: true,
                    organization: { select: { name: true } },
                    page: {
                        select: {
                            pageId: true,
                            title: true,
                            slugs: { where: { isCanonical: true }, select: { namespace: true, slug: true } },
                        },
                    },
                },
            },
        },
    });

    const result = notifications.map((n: typeof notifications[number]) => ({
        id: n.id,
        type: n.type,
        read: n.read,
        createdAt: n.createdAt,
        actor: n.actor
            ? { username: n.actor.username, imgLink: n.actor.imgLink, accountId: n.actor.accountId }
            : null,
        page: n.page
            ? { pageId: n.page.pageId, title: n.page.title, canonicalSlug: n.page.slugs[0] || null }
            : null,
        tagPageRequest: n.tagPageRequest
            ? {
                id: n.tagPageRequest.id,
                status: n.tagPageRequest.status,
                tagName: n.tagPageRequest.tag.name,
                tagNamespace: n.tagPageRequest.tag.namespace,
                pageTitle: n.tagPageRequest.page.title,
                pageHref: n.tagPageRequest.page.slugs[0]
                    ? `/wiki/${n.tagPageRequest.page.slugs[0].namespace}/${n.tagPageRequest.page.slugs[0].slug}`
                    : `/pages/${n.tagPageRequest.page.pageId}`,
            }
            : null,
        orgTagRequest: n.orgTagRequest
            ? {
                id: n.orgTagRequest.id,
                status: n.orgTagRequest.status,
                orgName: n.orgTagRequest.organization.name,
                tagName: n.orgTagRequest.tag.name,
                tagNamespace: n.orgTagRequest.tag.namespace,
            }
            : null,
        orgPageRequest: n.orgPageRequest
            ? {
                id: n.orgPageRequest.id,
                status: n.orgPageRequest.status,
                orgName: n.orgPageRequest.organization.name,
                pageTitle: n.orgPageRequest.page.title,
                pageHref: n.orgPageRequest.page.slugs[0]
                    ? `/wiki/${n.orgPageRequest.page.slugs[0].namespace}/${n.orgPageRequest.page.slugs[0].slug}`
                    : `/pages/${n.orgPageRequest.page.pageId}`,
            }
            : null,
    }));

    return NextResponse.json({ notifications: result });
}