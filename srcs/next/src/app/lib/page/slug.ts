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

    // Si le titre slugifié est le même que l'ID (ex: titre "2"), pas besoin de second slug
    if (titleSlug === `${pageId}`) return;

    // 2. On cherche s'il existe déjà un slug textuel USER pour cette page
    const userTitleSlug = await prisma.pageSlug.findFirst({
        where: { pageId, type: "USER", slug: { not: `${pageId}` } }
    });

    if (userTitleSlug) {
        // S'il existe déjà avec le bon slug, on ne fait rien
        if (userTitleSlug.slug === titleSlug) return;

        // Sinon, on met à jour en nettoyant les éventuels doublons sur cette même page
        await prisma.pageSlug.deleteMany({
            where: { namespace: ownerAccountId, slug: titleSlug }
        });

        await prisma.pageSlug.update({
            where: { id: userTitleSlug.id },
            data: { slug: titleSlug, namespace: ownerAccountId }
        });
    } else {
        // Crée ou met à jour de façon sécurisée (upsert)
        await prisma.pageSlug.upsert({
            where: { namespace_slug: { namespace: ownerAccountId, slug: titleSlug } },
            update: { pageId, type: "USER" },
            create: { pageId, namespace: ownerAccountId, slug: titleSlug, type: "USER", isCanonical: true }
        });
    }
}

export async function setTagSlug(pageId: number, titleSlug: string | null, namespace: string) {
    console.log("call setTagSlugs");
    
    // Nettoyage des anciens slugs de type TAG pour cette page
    await removeTagSlug(pageId, titleSlug || "", false);

    if (!titleSlug || !namespace) return;

    // Upsert sécurisé
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

    // Rend les slugs USER non-canoniques si le TAG devient le canonique
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