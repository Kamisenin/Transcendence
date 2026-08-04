"use server";

import { prisma } from '%/lib/prisma/prisma';
import { getSessionUser, getSessionCookie } from '%/lib/session';
import { intToHex, hexToInt } from "%/lib/hex_utils"
import { getTagCapabilities, canManageRoleRank, canAssignRoleRank } from '%/lib/tag_permissions';
import { revalidatePath } from 'next/cache';
import { redirect } from "next/navigation";

export async function requireUser() {
    const user = await getSessionUser(await getSessionCookie());
    if (!user) redirect("/login");
    return user;
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
    const caps = await getTagCapabilities(tagId, user.user_id);
    if (!caps.canManageRoles) throw new Error("Permission denied");

    if (!caps.isOwner && data.hierarchyLevel >= caps.rank) {
        throw new Error("Cannot create a role higher or equal to your's");
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
    const caps = await getTagCapabilities(tagId, user.user_id);
    if (!caps.canManageRoles) throw new Error("Permission denied");

    const target = await prisma.tagRole.findUnique({ where: { id: roleId } });
    if (!target || target.tagId !== tagId) throw new Error("Couldn't find target role");

    if (!canManageRoleRank(caps.rank, target.hierarchyLevel)) {
        throw new Error("Cannot manage a role higher or equal to your's");
    }

    if (data.hierarchyLevel !== undefined && !caps.isOwner && data.hierarchyLevel >= caps.rank) {
        throw new Error("Cannot set a role's hierarchy higher or equal to your's");
    }

    await prisma.tagRole.update({ where: { id: roleId }, data });
    revalidatePath(`/tags/${tagId}`);
}

export async function deleteTagRole(tagId: number, roleId: number) {
    const user = await requireUser();
    const caps = await getTagCapabilities(tagId, user.user_id);
    if (!caps.canManageRoles) throw new Error("Permission denied");

    const target = await prisma.tagRole.findUnique({ where: { id: roleId } });
    if (!target || target.tagId !== tagId) throw new Error("Couldn't find target role");

    if (!canManageRoleRank(caps.rank, target.hierarchyLevel)) {
        throw new Error("Cannot delete a role higher or equal to your's");
    }

    await prisma.tagRole.delete({ where: { id: roleId } });
    revalidatePath(`/tags/${tagId}`);
}

// ───────────── MEMBERS ─────────────

export async function assignTagRole(tagId: number, targetUserToken: string, roleId: number) {
    const user = await requireUser();
    const caps = await getTagCapabilities(tagId, user.user_id);
    if (!caps.canManageMembers) throw new Error("Permission denied");

    const role = await prisma.tagRole.findUnique({ where: { id: roleId } });
    if (!role || role.tagId !== tagId) throw new Error("Couldn't find target role");

    if (!canAssignRoleRank(caps.rank, role.hierarchyLevel)) {
        throw new Error("Cannot assign a role higher or equal to your's");
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
    const caps = await getTagCapabilities(tagId, user.user_id);
    if (!caps.canManageMembers) throw new Error("Permission denied");

    const membership = await prisma.tagMember.findUnique({
        where: { tagId_userToken: { tagId, userToken: targetUserToken } },
        include: { role: true },
    });
    if (!membership) return;

    if (!canManageRoleRank(caps.rank, membership.role.hierarchyLevel)) {
        throw new Error("Cannot kick a user higher in rank than your's");
    }

    await prisma.tagMember.delete({ where: { tagId_userToken: { tagId, userToken: targetUserToken } } });
    revalidatePath(`/tags/${tagId}`);
}

// ───────────── TAG ADD REQUEST ─────────────

export async function reviewTagPageRequest(requestId: number, accept: boolean) {
    const user = await requireUser();

    const request = await prisma.tagPageRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error("Couldn't find Request");

    const caps = await getTagCapabilities(request.tagId, user.user_id);
    if (!caps.canReviewRequests) throw new Error("Permission denied");

    await prisma.tagPageRequest.update({
        where: { id: requestId },
        data: {
            status: accept ? 'APPROVED' : 'REJECTED',
            reviewedBy: user.user_id,
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
    namespace?: string | "";
}) {
    const user = await requireUser();
    const caps = await getTagCapabilities(tagId, user.user_id);
    if (!caps.canEditInfo) throw new Error("Permission Denied");

    if (data.namespace && data.namespace?.length > 0 && data.namespace.trim()) {
        const trimmed = data.namespace.trim();
        const existing = await prisma.tag.findFirst({
            where: { namespace: trimmed, id: { not: tagId } },
        });
        if (existing) throw new Error("This namespace is already in use by another tag or user");
        data.namespace = trimmed;
    } else {
        data.namespace = "";
    }

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
    const user = await requireUser();
    const name = data.name.trim();
    if (!name) throw new Error("Tag name is required.");

    const existingName = await prisma.tag.findUnique({
        where: { name }
    });
    if (existingName) {
        throw new Error("This tag name is taken.");
    }

    const cleanNamespace = data.namespace?.trim() || null;
    if (cleanNamespace) {
        const check = await checkTagNamespaceAvailability(cleanNamespace);
        if (!check.available) {
            throw new Error(check.message || "Namespace already in use.");
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

export async function addTagMember(tagId: number, targetUserToken: string, roleId: number) {
    const user = await requireUser();
    const caps = await getTagCapabilities(tagId, user.user_id);
    if (!caps.canManageMembers) throw new Error("Permission denied");

    const existing = await prisma.tagMember.findUnique({
        where: { tagId_userToken: { tagId, userToken: targetUserToken } },
    });
    if (existing) throw new Error("This user is already member of the tag");

    const role = await prisma.tagRole.findUnique({ where: { id: roleId } });
    if (!role || role.tagId !== tagId) throw new Error("Couldn't find target role");

    if (!canAssignRoleRank(caps.rank, role.hierarchyLevel)) {
        throw new Error("You cannot assign a role equal or superior of your own role");
    }

    await prisma.tagMember.create({
        data: { tagId, userToken: targetUserToken, roleId },
    });
    revalidatePath(`/tags/${tagId}`);
}