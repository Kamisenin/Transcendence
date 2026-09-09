import { notFound } from 'next/navigation';
import { prisma } from  '%/lib/prisma/prisma';
import { requireUser } from '@/actions/tags';
import { getTagCapabilities } from '%/lib/tag_permissions';
import { getTagOrganizationMappings } from '@/actions/tags';
import TagManagement from '@/components/tags/TagManagement';

type Params = {
    params: Promise<{ namespace: string }>;
};

export default async function TagManagementPage({ params }: Params) {
    const { namespace } = await params;
    const user = await requireUser();

    const tag = await prisma.tag.findUnique({ where: { namespace } });
    if (!tag) notFound();

    const capabilities = await getTagCapabilities(tag.id, user.user_id);
    if (capabilities.rank === -1 && !capabilities.isOwner) {
        notFound();
    }

    const [roles, members, pendingRequests, organizationMappings, organizationLink] = await Promise.all([
        prisma.tagRole.findMany({ where: { tagId: tag.id }, orderBy: { hierarchyLevel: 'desc' } }),
        prisma.tagMember.findMany({
            where: { tagId: tag.id },
            include: { user: { select: { user_id: true, accountId: true, username: true, imgLink: true } }, role: true },
        }),
        capabilities.canReviewRequests
            ? prisma.tagPageRequest.findMany({
                where: { tagId: tag.id, status: 'PENDING' },
                include: {
                    page: {
                        select: {
                            pageId: true,
                            title: true,
                            owner: { select: { accountId: true } },
                            slugs: { where: { isCanonical: true }, select: { namespace: true, slug: true } },
                        },
                    },
                    requester: { select: { user_id: true, username: true } },
                },
            })
            : Promise.resolve([]),
        getTagOrganizationMappings(tag.id),
        prisma.organization.findFirst({
            where: {
                OR: [
                    { orgTagAccess: { some: { tagId: tag.id } } },
                    { orgTagCapability: { some: { tagId: tag.id } } },
                ],
            },
            select: { id: true },
        }),
    ]);

    return (
        <TagManagement
            tag={tag}
            capabilities={capabilities}
            roles={roles}
            members={members}
            pendingRequests={pendingRequests}
            currentUserToken={user.user_id}
            organizationMappings={organizationMappings}
            organizationLinked={organizationLink !== null}
        />
    );
}