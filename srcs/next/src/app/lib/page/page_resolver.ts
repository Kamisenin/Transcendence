import { prisma } from '%/lib/prisma/prisma';

type ResolvedPage = {
    page: Awaited<ReturnType<typeof prisma.page.findUnique>>;
    redirectTo: string | null;
};


/*
* This functions takes a namespace and a slug to
* find a page to redirect to. If the address exists
* but is not the canonical address it will redirect
* the user to the canonical address
* */
export async function resolvePage(
    namespace: string,
    slug: string
): Promise<ResolvedPage | null> {

    const pageSlug = await prisma.pageSlug.findUnique({
        where: {
            namespace_slug : {
                namespace: namespace,
                slug: slug
            }
        },
    });

    if (!pageSlug) return null;

    const page = await prisma.page.findUnique({
        where: { pageId: pageSlug.pageId },
    });

    if (!page) return null;

    let redirectTo: string | null = null;

    // Redirection
    if (!pageSlug.isCanonical) {
        const canonicalSlug = await prisma.pageSlug.findFirst({
            where: { pageId: page.pageId, isCanonical: true },
        });

        if (canonicalSlug) {
            redirectTo = `/wiki/${canonicalSlug.namespace}/${canonicalSlug.slug}`;
        }
    }

    return { page, redirectTo };
}