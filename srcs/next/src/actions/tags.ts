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
import { User } from "@prisma/client";
import { notifyTagPageRequest } from '@/actions/notifications';

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

export type TagWithPending = {
    id: number;
    name: string;
    namespace: string;
    color: number | null;
    pending: boolean;
};

export async function getTagPageState(tagId: string, pageId: number) : Promise<TagWithPending | null> {
    const id = parseInt(tagId, 10);

    if (isNaN(id))
        return (null);

    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) return null;

    const pendingRequest = await prisma.tagPageRequest.findFirst({
        where: {
            tagId : id,
            pageId,
            status: 'PENDING'
        }
    }); 

    console.log('Pending request:', pendingRequest);
    return {
        id: tag.id,
        name: tag.name,
        namespace: tag.namespace,
        color: tag.color,
        pending: Boolean(pendingRequest)
    };
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

    await prisma.notification.deleteMany({
        where: { tagPageRequestId: requestId },
    })

    if (accept) {
        await prisma.tagPage.upsert({
            where: { tagId_pageId: { tagId: request.tagId, pageId: request.pageId } },
            create: { tagId: request.tagId, pageId: request.pageId },
            update: {},
        });
    }

    revalidatePath(`/tags/${request.tagId}`);
}

export async function requestTagPageAccess(tagId: number, pageId: number) {
    const user = await requireUser();
    const [tag, page, existing, pending] = await Promise.all([
        prisma.tag.findUnique({ where: { id: tagId }, select: { id: true } }),
        prisma.page.findUnique({
            where: { pageId },
            select: {
                pageId: true,
                ownerId: true,
                permissions: { where: { userToken: user.user_id }, select: { permissions: true } },
            },
        }),
        prisma.tagPage.findUnique({ where: { tagId_pageId: { tagId, pageId } } }),
        prisma.tagPageRequest.findFirst({ where: { tagId, pageId, status: "PENDING" } }),
    ]);
    if (!tag || !page) throw new Error("Tag or page not found");
    const canEdit = page.ownerId === user.user_id || page.permissions.some(({ permissions }) => permissions !== "READ");
    if (!canEdit) throw new Error("Forbidden");
    if (existing || pending) return pending ?? existing;

    const created = await prisma.tagPageRequest.create({
        data: { tagId, pageId, requestedBy: user.user_id },
    });

    await notifyTagPageRequest(created.id, tagId, user.user_id);

    return created;
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

    const taggedPages = await prisma.tagPage.findMany({
        where: { tagId },
        select: {
            pageId: true,
            page: {
                select: {
                    content: true,
                    owner: { select: { accountId: true } },
                },
            },
        },
    });

    await prisma.$transaction(async (tx) => {
        for (const { pageId, page } of taggedPages) {
            const content = page.content as {
                blocks?: Array<{
                    infoboxData?: {
                        tags?: Array<{ id: number | string }>;
                    };
                }>;
            } | null;
            const blocks = content?.blocks;

            if (blocks) {
                await tx.page.update({
                    where: { pageId },
                    data: {
                        content: {
                            ...content,
                            blocks: blocks.map((block) => block.infoboxData?.tags
                                ? {
                                    ...block,
                                    infoboxData: {
                                        ...block.infoboxData,
                                        tags: block.infoboxData.tags.filter((tag) => Number(tag.id) !== tagId),
                                    },
                                }
                                : block),
                        },
                    },
                });
            }

            await tx.pageSlug.deleteMany({
                where: { pageId, type: 'TAG' },
            });

            await tx.pageSlug.updateMany({
                where: { pageId, type: 'USER' },
                data: {
                    isCanonical: false,
                },
            });

            await tx.pageSlug.upsert({
                where: {
                    namespace_slug: {
                        namespace: page.owner.accountId,
                        slug: `${pageId}`,
                    },
                },
                update: { pageId, type: 'USER', isCanonical: true },
                create: {
                    pageId,
                    namespace: page.owner.accountId,
                    slug: `${pageId}`,
                    type: 'USER',
                    isCanonical: true,
                },
            });
        }

        await tx.orgTagCapability.deleteMany({ where: { tagId } });
        await tx.orgTagAccess.deleteMany({ where: { tagId } });
        await tx.orgTagRequest.deleteMany({ where: { tagId } });
        await tx.tagPageCapability.deleteMany({ where: { tagId } });
        await tx.tagPageAccess.deleteMany({ where: { tagId } });
        await tx.tagPageRequest.deleteMany({ where: { tagId } });
        await tx.tagPage.deleteMany({ where: { tagId } });
        await tx.pageReaction.deleteMany({
            where: {
                type: 'FAVORITE',
                page: { tagPages: { none: {} } },
            },
        });
        await tx.tag.delete({ where: { id: tagId } });
    });

    revalidatePath('/wiki/[namespace]/[slug]', 'page');
    revalidatePath(`/tags/${tag.namespace}`);
    redirect("/");
}

type TagManagePermissionKey =
  | "canManageMembers"
  | "canManageRoles"
  | "canEditInfo"
  | "canDeleteTag"
  | "canAddPage"
  | "canRevokePage"
  | "canManagePageGrants"
  | "canReviewRequests";

export async function userHasTagPermission(
  tagId: number,
  permissionKey: TagManagePermissionKey,
  user: User | null = null,
): Promise<boolean> {
  if (!user) user = await getSessionUser(await getSessionCookie());
  if (!user) return false;

  const userId = user.user_id;

  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
    include: {
      members: {
        where: { userToken: userId },
        include: { role: true },
      },
    },
  });

  if (!tag) return false;

  if (tag.ownerToken === userId) return true;

  const directMembership = tag.members[0];
  if (directMembership?.role) {
    const directPermission = directMembership.role[permissionKey];
    if (typeof directPermission === "boolean" && directPermission) {
      return true;
    }
  }

  const orgCapabilities = await prisma.orgTagCapability.findMany({
    where: { tagId },
    include: {
      role: true,
      organization: {
        include: {
          members: {
            where: { userToken: userId },
            include: { role: true },
          },
        },
      },
    },
  });

  for (const capability of orgCapabilities) {
    const capPermission = capability[permissionKey as keyof typeof capability];
    const isCapAllowed = typeof capPermission === "boolean" ? capPermission : true;

    if (!isCapAllowed) continue;

    const orgMembership = capability.organization.members[0];
    if (!orgMembership?.role) continue;

    if (capability.organization.ownerToken === userId) return true;

    const userRole = orgMembership.role;
    const requiredRole = capability.role;

    if (userRole.hierarchyLevel <= requiredRole.hierarchyLevel) {
      return true;
    }
  }

  return false;
}

export async function removeTagFromPageAction(tagId: number, pageId: number) {
    await prisma.$transaction([
      prisma.tagPage.deleteMany({ where: { tagId, pageId }}),

      prisma.tagPageAccess.deleteMany({ where: { tagId, pageId }}),

      prisma.tagPageCapability.deleteMany({ where: { tagId, pageId } }),

      prisma.tagPageRequest.deleteMany({ where: { tagId, pageId } })
    ]);

    revalidatePath(`/pages/${pageId}`);
}