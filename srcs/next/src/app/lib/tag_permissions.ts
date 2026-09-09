import { prisma } from './prisma/prisma';

export const OWNER_RANK = Number.MAX_SAFE_INTEGER;

export type TagCapabilities = {
    canManageMembers: boolean;
    canManageRoles: boolean;
    canEditInfo: boolean;
    canDeleteTag: boolean;
    canAddPage: boolean;
    canRevokePage: boolean;
    canManagePageGrants: boolean;
    canReviewRequests: boolean;
    rank: number;
    isOwner: boolean;
};

const EMPTY_CAPS: Omit<TagCapabilities, 'rank' | 'isOwner'> = {
    canManageMembers: false,
    canManageRoles: false,
    canEditInfo: false,
    canDeleteTag: false,
    canAddPage: false,
    canRevokePage: false,
    canManagePageGrants: false,
    canReviewRequests: false,
};

/**
 * Calcule les droits effectifs d'un utilisateur sur un tag :
 * combine TagPermission (accès direct) + TagMember/TagRole (accès via rôle).
 * Les booléens sont fusionnés en OR (un droit accordé par l'une des deux sources suffit).
 * Le "rank" sert uniquement aux comparaisons hiérarchiques (gestion de rôles/membres).
 */
export async function getTagCapabilities(
    tagId: number,
    userToken: string
): Promise<TagCapabilities> {
    const tag = await prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag) {
        return { ...EMPTY_CAPS, rank: -1, isOwner: false };
    }

    if (tag.ownerToken === userToken) {
        return {
            canManageMembers: true,
            canManageRoles: true,
            canEditInfo: true,
            canDeleteTag: true,
            canAddPage: true,
            canRevokePage: true,
            canManagePageGrants: true,
            canReviewRequests: true,
            rank: OWNER_RANK,
            isOwner: true,
        };
    }

    const [direct, membership, organizationMemberships] = await Promise.all([
        prisma.tagPermission.findUnique({
            where: { tagId_userToken: { tagId, userToken } },
        }),
        prisma.tagMember.findUnique({
            where: { tagId_userToken: { tagId, userToken } },
            include: { role: true },
        }),
            prisma.organizationMember.findMany({
                where: { userToken },
                select: { organizationId: true, roleId: true },
            }),
    ]);

        const organizationCapabilities = organizationMemberships.length
            ? await prisma.orgTagCapability.findMany({
                where: {
                    tagId,
                    orgId: { in: organizationMemberships.map((membership) => membership.organizationId) },
                },
                include: { tagRole: true },
            })
            : [];

        const effectiveOrganizationCapabilities = organizationCapabilities.filter((capability) =>
            organizationMemberships.some((membership) =>
                membership.organizationId === capability.orgId && membership.roleId === capability.roleId
            )
        );

        if (!direct && !membership && effectiveOrganizationCapabilities.length === 0) {
        return { ...EMPTY_CAPS, rank: -1, isOwner: false };
    }

    const role = membership?.role;
        const organizationCapability = effectiveOrganizationCapabilities.reduce((result, capability) => ({
            canManageMembers: result.canManageMembers || capability.canManageTagMembers,
            canManageRoles: result.canManageRoles || capability.canManageTagRoles,
            canEditInfo: result.canEditInfo || capability.canEditInfo,
            canDeleteTag: result.canDeleteTag || capability.canDeleteTag,
            canAddPage: result.canAddPage || capability.canAddPage,
            canRevokePage: result.canRevokePage || capability.canRevokePage,
            canManagePageGrants: result.canManagePageGrants || capability.canManagePageGrants,
            canReviewRequests: result.canReviewRequests || capability.canReviewRequests,
            rank: Math.max(result.rank, capability.tagRole?.hierarchyLevel ?? 0),
        }), { ...EMPTY_CAPS, rank: 0 });

    return {
            canManageMembers: !!direct?.canManageMembers || !!role?.canManageMembers || organizationCapability.canManageMembers,
            canManageRoles: !!direct?.canManageRoles || !!role?.canManageRoles || organizationCapability.canManageRoles,
        canEditInfo: !!direct?.canEditInfo || !!role?.canEditInfo || organizationCapability.canEditInfo,
        canDeleteTag: !!direct?.canDeleteTag || !!role?.canDeleteTag || organizationCapability.canDeleteTag,
            canAddPage: !!direct?.canAddPage || !!role?.canAddPage || organizationCapability.canAddPage,
            canRevokePage: !!direct?.canRevokePage || !!role?.canRevokePage || organizationCapability.canRevokePage,
            canManagePageGrants: !!direct?.canManagePageGrants || !!role?.canManagePageGrants || organizationCapability.canManagePageGrants,
            canReviewRequests: !!direct?.canReviewRequests || !!role?.canReviewRequests || organizationCapability.canReviewRequests,
            rank: Math.max(role?.hierarchyLevel ?? 0, organizationCapability.rank),
        isOwner: false,
    };
}

/** Un utilisateur peut gérer (éditer/supprimer) un rôle si son rang est STRICTEMENT supérieur */
export function canManageRoleRank(actorRank: number, targetHierarchyLevel: number): boolean {
    return actorRank > targetHierarchyLevel;
}

/** Un utilisateur peut assigner un rôle si son rang est STRICTEMENT supérieur au rôle assigné */
export function canAssignRoleRank(actorRank: number, roleToAssignLevel: number): boolean {
    return actorRank > roleToAssignLevel;
}

/** Liste tous les tags où l'utilisateur a un accès (owner, membre, ou permission directe) */
export async function getUserTags(userToken: string) {
    const [owned, viaMembership, viaDirect, organizationMemberships] = await Promise.all([
        prisma.tag.findMany({ where: { ownerToken: userToken } }),
        prisma.tag.findMany({
            where: { members: { some: { userToken } } },
        }),
        prisma.tag.findMany({
            where: { permissions: { some: { userToken } } },
        }),
        prisma.organizationMember.findMany({
            where: { userToken },
            select: { organizationId: true, roleId: true },
        }),
    ]);

    const viaOrganization = organizationMemberships.length
        ? await prisma.tag.findMany({
            where: {
                orgTagCapability: {
                    some: {
                        OR: organizationMemberships.map((membership) => ({
                            orgId: membership.organizationId,
                            roleId: membership.roleId,
                        })),
                    },
                },
            },
        })
        : [];

    const map = new Map<number, typeof owned[number]>();
    for (const t of [...owned, ...viaMembership, ...viaDirect, ...viaOrganization]) {
        map.set(t.id, t);
    }
    return Array.from(map.values());
}