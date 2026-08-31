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

    const [direct, membership] = await Promise.all([
        prisma.tagPermission.findUnique({
            where: { tagId_userToken: { tagId, userToken } },
        }),
        prisma.tagMember.findUnique({
            where: { tagId_userToken: { tagId, userToken } },
            include: { role: true },
        }),
    ]);

    if (!direct && !membership) {
        return { ...EMPTY_CAPS, rank: -1, isOwner: false };
    }

    const role = membership?.role;

    return {
        canManageMembers: !!direct?.canManageMembers || !!role?.canManageMembers,
        canManageRoles: !!direct?.canManageRoles || !!role?.canManageRoles,
        canEditInfo: !!direct?.canEditInfo || !!role?.canEditInfo,
        canDeleteTag: !!direct?.canDeleteTag || !!role?.canDeleteTag,
        canAddPage: !!direct?.canAddPage || !!role?.canAddPage,
        canRevokePage: !!direct?.canRevokePage || !!role?.canRevokePage,
        canManagePageGrants: !!direct?.canManagePageGrants || !!role?.canManagePageGrants,
        canReviewRequests: !!direct?.canReviewRequests || !!role?.canReviewRequests,
        rank: role?.hierarchyLevel ?? 0,
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
    const [owned, viaMembership, viaDirect] = await Promise.all([
        prisma.tag.findMany({ where: { ownerToken: userToken } }),
        prisma.tag.findMany({
            where: { members: { some: { userToken } } },
        }),
        prisma.tag.findMany({
            where: { permissions: { some: { userToken } } },
        }),
    ]);

    const map = new Map<number, typeof owned[number]>();
    for (const t of [...owned, ...viaMembership, ...viaDirect]) {
        map.set(t.id, t);
    }
    return Array.from(map.values());
}