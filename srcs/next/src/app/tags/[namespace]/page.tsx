import { notFound } from 'next/navigation';
import { prisma } from '%/lib/prisma/prisma';
import { filterPages } from '@/actions/pages';
import { getCurrentUser } from '%/lib/session';
import TagOverview from '@/components/tags/TagOverview';

type Params = {
    params: Promise<{ namespace: string }>;
};

export default async function TagPage({ params }: Params) {
    const { namespace } = await params;

    const tag = await prisma.tag.findUnique({ where: { namespace } });
    if (!tag) notFound();

    const [members, tagPages, currentUser] = await Promise.all([
        prisma.tagMember.findMany({
            where: { tagId: tag.id },
            include: { user: { select: { user_id: true, accountId: true, username: true, imgLink: true } }, role: true },
        }),
        prisma.tagPage.findMany({
            where: { tagId: tag.id },
            include: {
                page: {
                    include: {
                        slugs: true,
                        owner: { select: { accountId: true, user_id: true } },
                    },
                },
            },
        }),
        getCurrentUser(),
    ]);

    const taggedPages = tagPages.map(({ page }) => page);
    const visiblePages = await filterPages(currentUser?.user_id, taggedPages);
    const pageOwners = new Map(taggedPages.map((page) => [page.pageId, page.owner.accountId || page.owner.user_id]));

    return (
        <TagOverview
            tag={{
                name: tag.name,
                description: tag.description,
                color: tag.color,
                namespace: tag.namespace,
            }}
            members={members}
            pages={visiblePages.map((page) => ({
                pageId: page.pageId,
                title: page.title,
                ownerAccount: pageOwners.get(page.pageId),
                canonicalSlug: page.namespace && page.slug
                    ? { namespace: page.namespace, slug: page.slug }
                    : null,
            }))}/>
    );
}