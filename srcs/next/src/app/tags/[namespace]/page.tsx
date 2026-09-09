import { notFound } from 'next/navigation';
import { prisma } from '%/lib/prisma/prisma';
import { filterPages } from '@/actions/pages';
import { getCurrentUser } from '%/lib/session';
import { userHasTagPermission } from '@/actions/tags';
import TagOverview from '@/components/tags/TagOverview';

type Params = {
    params: Promise<{ namespace: string }>;
};

export default async function TagPage({ params }: Params) {
    const { namespace } = await params;

    const tag = await prisma.tag.findUnique({
            where: { namespace },
            include: {
                owner: { select: { user_id: true, accountId: true, username: true, imgLink: true } }, 
                members: { include : { user : { select: { user_id: true, accountId: true, username: true, imgLink: true } }, role: true }}
            }
    })

    if (!tag) notFound();

    const [tagPages, currentUser] = await Promise.all([
        prisma.tagPage.findMany({
            where: { tagId: tag.id },
            include: {
                page: {
                    include: {
                        slugs: true,
                        owner: { select: { accountId: true, user_id: true } }
                    }
                }
            }
        }),
        getCurrentUser(),
    ]);



    const members = await getMembers(tag);

    const taggedPages = tagPages.map(({ page }) => page);
    const visiblePages = await filterPages(currentUser?.user_id, taggedPages);
    const pageOwners = new Map(taggedPages.map((page) => [page.pageId, page.owner.accountId || page.owner.user_id]));

    const canManage = await userHasTagPermission(tag.id, "canManageMembers", currentUser);

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
                    : null
                }))
            }
            isOwnerOrManager={canManage}
        />
    );
}


async function getMembers(tag : any) {
    const ownerRole = {
        id: 0,
        tagId: tag.id,
        roleName: "Owner",
        hierarchyLevel: 0,
        canManageMembers: true,
        canManageRoles: true,
        canEditInfo: true,
        canDeleteTag: true,
        canAddPage: true,
        canRevokePage: true,
        canManagePageGrants: true,
        canReviewRequests: true,
    };

    const ownerAsMember = {
    tagId: tag.id,
    userToken: tag.owner.user_id,
    roleId: 0,
    user: tag.owner,
    role: ownerRole,
    };

    const members = [ownerAsMember, ...tag.members];
    return (members)
}