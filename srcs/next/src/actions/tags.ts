"use server";

import { prisma } from '%/lib/prisma/prisma';
import { getSessionUser, getSessionCookie } from '%/lib/session';
import { intToHex, hexToInt } from "%/lib/hex_utils";
import { slugify } from "%/lib/page/slug";
import { getTagCapabilities, canManageRoleRank, canAssignRoleRank } from '%/lib/tag_permissions';
import { revalidatePath } from 'next/cache';
import { redirect } from "next/navigation";
import { TagPermissionError } from '%/lib/errors';
import { userHasOrgPermission } from '@/actions/orgs';

const MAX_ROLE_NAME_LENGTH = 20;
const MAX_HIERARCHY_LEVEL = 200;
const ROLE_NAME_PATTERN = /^[A-Za-z0-9 _-]+$/;
const TAG_NAME_PATTERN = /^[A-Za-z0-9 _-]+$/;

function validateTagRole(data: { roleName?: string; hierarchyLevel?: number }) {
    if (data.roleName !== undefined) {
        const roleName = data.roleName.trim();
        if (!roleName) throw new Error('ROLE_NAME_REQUIRED');
        if (roleName.length > MAX_ROLE_NAME_LENGTH) throw new Error('ROLE_NAME_TOO_LONG');
        if (!ROLE_NAME_PATTERN.test(roleName)) {
            throw new Error('ROLE_NAME_INVALID');
        }
    }
    if (data.hierarchyLevel !== undefined && (!Number.isInteger(data.hierarchyLevel) || data.hierarchyLevel < 0 || data.hierarchyLevel > MAX_HIERARCHY_LEVEL)) {
        throw new Error('HIERARCHY_LEVEL_INVALID');
    }
}

export async function requireUser() {
    const user = await getSessionUser(await getSessionCookie());
    if (!user) redirect("/login");
    return user;
}

export async function createTag(data: FormData) {
    const user = await requireUser();

    const rawName = String(data.get('name') ?? '').trim();
    const rawDescription = String(data.get('description') ?? '').trim();
    const rawColor = String(data.get('color') ?? '#3b82f6').trim();
    const rawNamespace = String(data.get('namespace') ?? '').trim();

    if (!rawName) throw new Error('TAG_NAME_REQUIRED');
    if (rawName.length > 50 || !TAG_NAME_PATTERN.test(rawName)) throw new Error('TAG_NAME_INVALID');

    const name = slugify(rawName);
    if (!name) throw new Error('Invalid tag name.');

    const namespace = rawNamespace ? slugify(rawNamespace) : null;
    if (rawNamespace && !namespace) throw new Error('Invalid namespace.');

    const hex = rawColor.startsWith('#') ? rawColor.slice(1) : rawColor;
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
        throw new Error('Invalid color format. Expected #RRGGBB.');
    }
    const color = parseInt(hex, 16);
    const description = rawDescription || null;

    revalidatePath('/tags');
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

    validateTagRole(data);

    if (!caps.isOwner && data.hierarchyLevel >= caps.rank) {
        throw new Error("Cannot create a role higher or equal to your's");
    }

    await prisma.tagRole.create({ data: { tagId, ...data } });
    revalidatePath(`/tags/${tagId}`);
}

export async function getTagOrganizationMappings(tagId: number) {
    const user = await requireUser();
    const capabilities = await getTagCapabilities(tagId, user.user_id);

    const [tag, organizations] = await Promise.all([
        prisma.tag.findUnique({ where: { id: tagId }, include: { roles: true } }),
        prisma.organization.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { orgTagAccess: { some: { tagId } } },
                            { orgTagCapability: { some: { tagId } } },
                        ],
                    },
                    ...(capabilities.canManageRoles ? [] : [{
                        OR: [
                            { ownerToken: user.user_id },
                            {
                                members: {
                                    some: {
                                        userToken: user.user_id,
                                        role: { canManageOrgTagGrants: true },
                                    },
                                },
                            },
                        ],
                    }]),
                ],
            },
            orderBy: { name: "asc" },
            include: {
                roles: { orderBy: { hierarchyLevel: "asc" } },
                orgTagCapability: { where: { tagId }, include: { role: true, tagRole: true } },
            },
        }),
    ]);
    if (!tag) throw new Error("Tag not found");
    return { tagRoles: tag.roles, organizations };
}

export async function setTagOrganizationRole(
    tagId: number,
    orgId: number,
    organizationRoleId: number,
    tagRoleId: number,
) {
    const user = await requireUser();
    const capabilities = await getTagCapabilities(tagId, user.user_id);
    const canManageOrganizationGrants = await userHasOrgPermission(orgId, "canManageOrgTagGrants", user);
    if (!capabilities.canManageRoles && !canManageOrganizationGrants) throw new Error("Permission denied");

    const [organizationRole, tagRole, access] = await Promise.all([
        prisma.organizationRole.findUnique({ where: { id: organizationRoleId } }),
        prisma.tagRole.findUnique({ where: { id: tagRoleId } }),
        prisma.orgTagAccess.findUnique({ where: { orgId_tagId: { orgId, tagId } } }),
    ]);
    if (!organizationRole || organizationRole.organizationId !== orgId) throw new Error("Invalid organization role");
    if (!tagRole || tagRole.tagId !== tagId) throw new Error("Invalid tag role");
    if (!access && !(await prisma.orgTagCapability.findFirst({ where: { orgId, tagId } }))) {
        throw new Error("The organization does not manage this tag");
    }

    return prisma.orgTagCapability.upsert({
        where: { orgId_tagId_roleId: { orgId, tagId, roleId: organizationRoleId } },
        update: {
            tagRoleId,
            canManageTagMembers: tagRole.canManageMembers,
            canManageTagRoles: tagRole.canManageRoles,
            canEditInfo: tagRole.canEditInfo,
            canDeleteTag: tagRole.canDeleteTag,
            canAddPage: tagRole.canAddPage,
            canRevokePage: tagRole.canRevokePage,
            canManagePageGrants: tagRole.canManagePageGrants,
            canReviewRequests: tagRole.canReviewRequests,
        },
        create: {
            orgId, tagId, roleId: organizationRoleId, tagRoleId,
            canManageTagMembers: tagRole.canManageMembers,
            canManageTagRoles: tagRole.canManageRoles,
            canEditInfo: tagRole.canEditInfo,
            canDeleteTag: tagRole.canDeleteTag,
            canAddPage: tagRole.canAddPage,
            canRevokePage: tagRole.canRevokePage,
            canManagePageGrants: tagRole.canManagePageGrants,
            canReviewRequests: tagRole.canReviewRequests,
        },
        include: { role: true, tagRole: true },
    });
}

export async function removeTagOrganizationRole(tagId: number, orgId: number, organizationRoleId: number) {
    const user = await requireUser();
    const capabilities = await getTagCapabilities(tagId, user.user_id);
    const canManageOrganizationGrants = await userHasOrgPermission(orgId, "canManageOrgTagGrants", user);
    if (!capabilities.canManageRoles && !canManageOrganizationGrants) throw new Error("Permission denied");
    await prisma.orgTagCapability.deleteMany({ where: { tagId, orgId, roleId: organizationRoleId } });
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

    validateTagRole(data);

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
    namespace: string;
}) {
    const user = await requireUser();
    const caps = await getTagCapabilities(tagId, user.user_id);
    if (!caps.canEditInfo) throw new Error("Permission Denied");

    if (data.name !== undefined) {
        const name = data.name.trim();
        if (!name || name.length > 50 || !TAG_NAME_PATTERN.test(name)) {
            throw new Error("Tag name must be 50 characters or fewer and may only contain letters, numbers, spaces, hyphens, and underscores.");
        }
        data.name = name;
    }

    const cleanNamespace = slugify(data.namespace.trim());
    if (!cleanNamespace) {
        throw new Error("Tag namespace is required.");
    }

    const existingUser = await prisma.user.findUnique({ where: { accountId: cleanNamespace } });
    if (existingUser) throw new Error("This namespace is already in use by another tag or user");

    const existingTag = await prisma.tag.findFirst({
        where: { namespace: cleanNamespace, id: { not: tagId } },
    });
    if (existingTag) throw new Error("This namespace is already in use by another tag or user");

    data.namespace = cleanNamespace;

    await prisma.tag.update({ where: { id: tagId }, data });
    revalidatePath(`/tags/${tagId}`);
}


export async function checkTagNamespaceAvailability(namespace: string): Promise<{ available: boolean; message?: string }> {
    const cleanNamespace = slugify(namespace.trim());
    if (!cleanNamespace) return { available: false, message: "TAG_NAMESPACE_REQUIRED" };

    const existingUser = await prisma.user.findUnique({
        where: { accountId: cleanNamespace }
    });

    if (existingUser) {
        return { available: false, message: "TAG_NAMESPACE_TAKEN" };
    }

    const existingTag = await prisma.tag.findUnique({
        where: { namespace: cleanNamespace }
    });

    if (existingTag) {
        return { available: false, message: "TAG_NAMESPACE_TAKEN" };
    }

    return { available: true };
}

export async function checkTagNameAvailability(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return { available: null as boolean | null };

    const taken = await tagNameExists(trimmed);
    return { available: !taken, message: taken ? "TAG_NAME_TAKEN" : undefined };
}

async function tagNameExists(name: string): Promise<boolean> {
    return (await prisma.tag.findUnique({
        where: { name }
    }) ? true : false)
}

export async function createTagAction(data: { name: string; namespace?: string; colorHex?: string }) {
    const user = await requireUser();
    const name = data.name.trim();
    if (!name) throw new Error("TAG_NAME_REQUIRED");
    if (name.length > 50 || !TAG_NAME_PATTERN.test(name)) throw new Error("TAG_NAME_INVALID");

    if (await tagNameExists(name)) {
        throw new Error("TAG_NAME_TAKEN");
    }

    const rawNamespace = data.namespace?.trim() ?? "";
    const cleanNamespace = slugify(rawNamespace);
    if (!cleanNamespace) {
        throw new Error("TAG_NAMESPACE_REQUIRED");
    }

    const check = await checkTagNamespaceAvailability(cleanNamespace);
    if (!check.available) {
        throw new Error("TAG_NAMESPACE_TAKEN");
    }

    const colorInt = data.colorHex ? hexToInt(data.colorHex) : hexToInt("#3b82f6");

    const newTag = await prisma.tag.create({
        data: {
            name,
            namespace: cleanNamespace,
            color: colorInt,
            owner: { connect: { user_id: user.user_id } },
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

export async function deleteTag(tagId: number): Promise<void> {

    const user = await requireUser();
    const userToken = user.user_id;
    const tag = await prisma.tag.findUnique({
        where: { id: tagId },
        include: {
            permissions: { where: { userToken } },
            members: {
                where: { userToken },
                include: { role: true },
            },
        },
    });

    if (!tag)
        redirect("/");

    const isOwner = tag.ownerToken === userToken;
    const hasDirectPermission = tag.permissions.some((p) => p.canDeleteTag);
    const hasRolePermission = tag.members.some((m) => m.role.canDeleteTag);

    if (!isOwner && !hasDirectPermission && !hasRolePermission)
        throw new TagPermissionError("Forbidden");

    await prisma.tag.delete({ where: { id: tagId } });
    redirect("/");
}