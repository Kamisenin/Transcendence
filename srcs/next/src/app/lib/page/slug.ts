import { prisma } from '%/lib/prisma/prisma';

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export async function syncUserSlugs(pageId: number, title: string, ownerAccountId: string) {
    const titleSlug = title.trim() ? slugify(title) : null;

    await prisma.pageSlug.upsert({
        where: { namespace_slug: { namespace: ownerAccountId, slug: `${pageId}` } },
        create: {
            pageId, namespace: ownerAccountId, slug: `${pageId}`,
            type: 'USER', isCanonical: !titleSlug,
        },
        update: { isCanonical: !titleSlug },
    });

    if (titleSlug) {
        await prisma.pageSlug.upsert({
            where: { namespace_slug: { namespace: ownerAccountId, slug: titleSlug } },
            create: { pageId, namespace: ownerAccountId, slug: titleSlug, type: 'USER', isCanonical: true },
            update: {},
        });
    }
}

export async function setTagSlug(pageId: number, title: string, namespace: string) {
    const titleSlug = title.trim() ? slugify(title) : null;

    await removeTagSlug(pageId);

    if (!titleSlug || !namespace) return;

    await prisma.pageSlug.create({
        data: {
            pageId,
            namespace,
            slug: titleSlug,
            type: 'TAG',
            isCanonical: false,
        },
    });
}

export async function removeTagSlug(pageId: number) {
    await prisma.pageSlug.deleteMany({
        where: { pageId, type: 'TAG' },
    });
}

export async function init_slug(account_id: string, page_id: number) {

    await prisma.pageSlug.create({
        data: {
            pageId: page_id,
            namespace: account_id,
            slug: `${page_id}`,
            type: 'USER',
            isCanonical: true,
        },
    });
}