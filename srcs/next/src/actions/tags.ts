"use server";

import { prisma } from '%/lib/prisma/prisma';
import { getSessionUser, getSessionCookie } from '%/lib/session';
import { intToHex, hexToInt } from "%/lib/hex_utils"
import { getTagCapabilities, canManageRoleRank, canAssignRoleRank } from '%/lib/tag_permissions';
import { revalidatePath } from 'next/cache';

async function requireUser() {
    const session = await getSession();
    if (!session) throw new Error("Non authentifié");
    return session.user;
}

// ───────────── ROLES ─────────────

export async function createTagRole(tagId: number, data: {
    roleName: string;
    hierarchyLevel: number;
    canManageMembers: boolean;
    canManageRoles: boolean;
    canEditInfo: boolean;
    canDeleteTag: boolean;
    canAddPage: boolean;
    canRevokePage: boolean;
    canManagePageGrants: boolean;
    canReviewRequests: boolean;
}) {
    const user = await requireUser();
    const caps = await getTagCapabilities(tagId, user.token);
    if (!caps.canManageRoles) throw new Error("Permission refusée");

    // Le rôle créé ne peut pas dépasser (ou égaler) le rang de son créateur, sauf pour l'owner
    if (!caps.isOwner && data.hierarchyLevel >= caps.rank) {
        throw new Error("Tu ne peux pas créer un rôle égal ou supérieur à ton rang");
    }

    await prisma.tagRole.create({ data: { tagId, ...data } });
    revalidatePath(`/tags/${tagId}`);
}

export async function updateTagRole(tagId: number, roleId: number, data: Partial<{
    roleName: string;
    hierarchyLevel: number;
    canManageMembers: boolean;
    canManageRoles: boolean;
    canEditInfo: boolean;
    canDeleteTag: boolean;
    canAddPage: boolean;
    canRevokePage: boolean;
    canManagePageGrants: boolean;
    canReviewRequests: boolean;
}>) {
    const user = await requireUser();
    const caps = await getTagCapabilities(tagId, user.token);
    if (!caps.canManageRoles) throw new Error("Permission refusée");

    const target = await prisma.tagRole.findUnique({ where: { id: roleId } });
    if (!target || target.tagId !== tagId) throw new Error("Rôle introuvable");

    if (!canManageRoleRank(caps.rank, target.hierarchyLevel)) {
        throw new Error("Tu ne peux pas gérer un rôle de rang égal ou supérieur au tien");
    }

    if (data.hierarchyLevel !== undefined && !caps.isOwner && data.hierarchyLevel >= caps.rank) {
        throw new Error("Tu ne peux pas fixer ce rôle à ton rang ou au-dessus");
    }

    await prisma.tagRole.update({ where: { id: roleId }, data });
    revalidatePath(`/tags/${tagId}`);
}

export async function deleteTagRole(tagId: number, roleId: number) {
    const user = await requireUser();
    const caps = await getTagCapabilities(tagId, user.token);
    if (!caps.canManageRoles) throw new Error("Permission refusée");

    const target = await prisma.tagRole.findUnique({ where: { id: roleId } });
    if (!target || target.tagId !== tagId) throw new Error("Rôle introuvable");

    if (!canManageRoleRank(caps.rank, target.hierarchyLevel)) {
        throw new Error("Tu ne peux pas supprimer un rôle de rang égal ou supérieur au tien");
    }

    await prisma.tagRole.delete({ where: { id: roleId } });
    revalidatePath(`/tags/${tagId}`);
}

// ───────────── MEMBERS ─────────────

export async function assignTagRole(tagId: number, targetUserToken: string, roleId: number) {
    const user = await requireUser();
    const caps = await getTagCapabilities(tagId, user.token);
    if (!caps.canManageMembers) throw new Error("Permission refusée");

    const role = await prisma.tagRole.findUnique({ where: { id: roleId } });
    if (!role || role.tagId !== tagId) throw new Error("Rôle introuvable");

    if (!canAssignRoleRank(caps.rank, role.hierarchyLevel)) {
        throw new Error("Tu ne peux pas assigner un rôle égal ou supérieur à ton rang");
    }

    await prisma.tagMember.upsert({
        where: { tagId_userToken: { tagId, userToken: targetUserToken } },
        create: { tagId, userToken: targetUserToken, roleId },
        update: { roleId },
    });
    revalidatePath(`/tags/${tagId}`);
}

export async function removeTagMember(tagId: number, targetUserToken: string) {
    const user = await requireUser();
    const caps = await getTagCapabilities(tagId, user.token);
    if (!caps.canManageMembers) throw new Error("Permission refusée");

    const membership = await prisma.tagMember.findUnique({
        where: { tagId_userToken: { tagId, userToken: targetUserToken } },
        include: { role: true },
    });
    if (!membership) return;

    if (!canManageRoleRank(caps.rank, membership.role.hierarchyLevel)) {
        throw new Error("Tu ne peux pas retirer un membre de rang égal ou supérieur au tien");
    }

    await prisma.tagMember.delete({ where: { tagId_userToken: { tagId, userToken: targetUserToken } } });
    revalidatePath(`/tags/${tagId}`);
}

// ───────────── TAG ADD REQUEST ─────────────

export async function reviewTagPageRequest(requestId: number, accept: boolean) {
    const user = await requireUser();

    const request = await prisma.tagPageRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error("Demande introuvable");

    const caps = await getTagCapabilities(request.tagId, user.token);
    if (!caps.canReviewRequests) throw new Error("Permission refusée");

    await prisma.tagPageRequest.update({
        where: { id: requestId },
        data: {
            status: accept ? 'ACCEPTEE' : 'REFUSEE',
            reviewedBy: user.token,
        },
    });

    if (accept) {
        await prisma.tagPage.upsert({
            where: { tagId_pageId: { tagId: request.tagId, pageId: request.pageId } },
            create: { tagId: request.tagId, pageId: request.pageId },
            update: {},
        });
    }

    revalidatePath(`/tags/${request.tagId}`);
}

// ───────────── TAG INFOS ─────────────

export async function updateTagInfo(tagId: number, data: {
    name?: string;
    description?: string;
    color?: number;
}) {
    const user = await requireUser();
    const caps = await getTagCapabilities(tagId, user.token);
    if (!caps.canEditInfo) throw new Error("Permission refusée");

    await prisma.tag.update({ where: { id: tagId }, data });
    revalidatePath(`/tags/${tagId}`);
}


export async function checkTagNamespaceAvailability(namespace: string): Promise<{ available: boolean; message?: string }> {
    const cleanNamespace = namespace.trim();
    if (!cleanNamespace) return { available: true };

    const existingUser = await prisma.user.findFirst({
        where: { accountId: cleanNamespace }
    });

    if (existingUser) {
        return { available: false, message: "This namespace is already used." };
    }

    const existingTag = await prisma.tag.findFirst({
        where: { namespace: cleanNamespace }
    });

    if (existingTag) {
        return { available: false, message: "This namespace is already used." };
    }

    return { available: true };
}

export async function createTagAction(data: { name: string; namespace?: string; colorHex?: string }) {
    const user = await getSessionUser(await getSessionCookie());
    if (!user) throw new Error("Utilisateur non identifié");

    const name = data.name.trim();
    if (!name) throw new Error("Le nom du tag est obligatoire.");

    const existingName = await prisma.tag.findUnique({
        where: { name }
    });
    if (existingName) {
        throw new Error("Un tag avec ce nom existe déjà.");
    }

    const cleanNamespace = data.namespace?.trim() || null;
    if (cleanNamespace) {
        const check = await checkTagNamespaceAvailability(cleanNamespace);
        if (!check.available) {
            throw new Error(check.message || "Namespace indisponible.");
        }
    }

    const colorInt = data.colorHex ? hexToInt(data.colorHex) : hexToInt("#3b82f6");

    const newTag = await prisma.tag.create({
        data: {
            name,
            namespace: cleanNamespace,
            color: colorInt,
            ownerToken: user.user_id,
        }
    });

    return {
        id: newTag.id.toString(),
        name: newTag.name,
        namespace: newTag.namespace,
        color: intToHex(newTag.color)
    };
}

export async function getTagsAction(query?: string) {
    const search = query?.trim();

    const tags = await prisma.tag.findMany({
        where: search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { namespace: { contains: search, mode: 'insensitive' } },
                ],
            }
            : undefined,
        orderBy: { name: 'asc' },
        take: 30, //limit for the autocomplete
    });

    return tags.map((t) => ({
        id: t.id.toString(),
        name: t.name,
        namespace: t.namespace,
        color: intToHex(t.color),
    }));
}

