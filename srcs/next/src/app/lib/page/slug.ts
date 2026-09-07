import { prisma } from '%/lib/prisma/prisma';

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export async function syncUserSlugs(pageId: number, titleSlug: string, ownerAccountId: string) {
    await prisma.pageSlug.upsert({
        where: { namespace_slug: { namespace: ownerAccountId, slug: `${pageId}` } },
        create: { pageId, namespace: ownerAccountId, slug: `${pageId}`, type: "USER", isCanonical: false },
        update: {}
    });

    if (titleSlug === `${pageId}`) return;

    const userTitleSlug = await prisma.pageSlug.findFirst({
        where: { pageId, type: "USER", slug: { not: `${pageId}` } }
    });

    if (userTitleSlug) {
        if (userTitleSlug.slug === titleSlug) return;

        await prisma.pageSlug.deleteMany({
            where: { namespace: ownerAccountId, slug: titleSlug }
        });

        await prisma.pageSlug.update({
            where: { id: userTitleSlug.id },
            data: { slug: titleSlug, namespace: ownerAccountId }
        });
    } else {
        await prisma.pageSlug.upsert({
            where: { namespace_slug: { namespace: ownerAccountId, slug: titleSlug } },
            update: { pageId, type: "USER" },
            create: { pageId, namespace: ownerAccountId, slug: titleSlug, type: "USER", isCanonical: true }
        });
    }
}

export async function setTagSlug(pageId: number, titleSlug: string | null, namespace: string) {

    await removeTagSlug(pageId, titleSlug || "", false);

    if (!titleSlug || !namespace) return;

    await prisma.pageSlug.upsert({
        where: {
            namespace_slug: {
                namespace,
                slug: titleSlug
            }
        },
        update: {
            pageId,
            type: 'TAG',
            isCanonical: true
        },
        create: {
            pageId,
            namespace,
            slug: titleSlug,
            type: 'TAG',
            isCanonical: true
        }
    });

    await prisma.pageSlug.updateMany({
        where: { pageId, type: 'USER', isCanonical: true },
        data: { isCanonical: false }
    });
}

export async function removeTagSlug(pageId: number, title: string | null, restoreUserCanonical = true) {
    await prisma.pageSlug.deleteMany({
        where: { pageId, type: 'TAG' }
    });

    if (restoreUserCanonical) {
        if (title) {
            await prisma.pageSlug.updateMany({
                where: { pageId, type: "USER", slug: title },
                data: { isCanonical: true }
            });
        } else {
            await prisma.pageSlug.updateMany({
                where: { pageId, type: "USER", slug: '' + pageId },
                data: { isCanonical: true }
            });
        }
    }
}

export async function init_slug(account_id: string, page_id: number) {
    await prisma.pageSlug.create({
        data: {
            pageId: page_id,
            namespace: account_id,
            slug: `${page_id}`,
            type: 'USER',
            isCanonical: true
        },
    });
}