"use server";

import { prisma } from "%/lib/prisma/prisma";
import { getSessionUser, getSessionCookie } from "%/lib/session";
import { requireUser } from "@/actions/tags";
import { Organization, OrganizationRole, User } from "@prisma/client";
import { PermissionLevel } from "@prisma/client";
import { redirect } from "next/navigation";
import { OrgPermissionError } from "%/lib/errors";
import { revalidatePath } from "next/cache";

type RolePermissionsInput = {
  roleName?: string;
  hierarchyLevel?: number;
  canManageMembers?: boolean;
  canManageRoles?: boolean;
  canEditInfo?: boolean;
  canDeleteOrg?: boolean;
  canManageOrgPageGrants?: boolean;
  canManageOrgTagGrants?: boolean;
};

const MAX_NAME_LENGTH = 20;
const ROLE_NAME_PATTERN = /^[A-Za-z0-9 _-]+$/;
const ORGANIZATION_NAME_PATTERN = /^[A-Za-z0-9_-]+$/;

function validateOrganizationName(name: string) {
  if (!name) throw new Error("ORGANIZATION_NAME_REQUIRED");
  if (name.length > MAX_NAME_LENGTH) throw new Error("ORGANIZATION_NAME_TOO_LONG");
  if (!ORGANIZATION_NAME_PATTERN.test(name)) {
    throw new Error("ORGANIZATION_NAME_INVALID");
  }
}

function validateRole(data: { roleName?: string; hierarchyLevel?: number }) {
  if (data.roleName !== undefined) {
    if (!data.roleName.trim()) throw new Error("ROLE_NAME_REQUIRED");
    if (data.roleName.length > MAX_NAME_LENGTH) throw new Error("ROLE_NAME_TOO_LONG");
    if (!ROLE_NAME_PATTERN.test(data.roleName.trim())) {
      throw new Error("ROLE_NAME_INVALID");
    }
  }
  if (data.hierarchyLevel !== undefined && (!Number.isInteger(data.hierarchyLevel) || data.hierarchyLevel < 0 || data.hierarchyLevel > 200)) {
    throw new Error("HIERARCHY_LEVEL_INVALID");
  }
}

export type MemberUserOption = {
  user_id: string;
  username: string;
  accountId: string;
  imgLink: string | null;
};

export async function getUserOrgs(user : User | null = null): Promise<Organization[]> {
  if (!user)
    user = await requireUser();

  const owned = await prisma.organization.findMany({
    where: { ownerToken: user.user_id },
  });

  const memberOrgIds = await prisma.organizationMember.findMany({
    where: { userToken: user.user_id },
    select: { organizationId: true },
  });

  const memberOrgs = await prisma.organization.findMany({
    where: { id: { in: memberOrgIds.map((m) => m.organizationId) } },
  });

  const map = new Map<number, Organization>();
  owned.concat(memberOrgs).forEach((o) => map.set(o.id, o));
  return Array.from(map.values());
}

export async function createOrganization(name: string) {
  const user = await requireUser();
  const normalizedName = name.trim();
  validateOrganizationName(normalizedName);

  return prisma.$transaction(async (transaction) => {
    const organization = await transaction.organization.create({
      data: { ownerToken: user.user_id, name: normalizedName },
    });
    const ownerRole = await transaction.organizationRole.create({
      data: {
        organizationId: organization.id,
        roleName: "Owner",
        hierarchyLevel: 200,
        canManageMembers: true,
        canManageRoles: true,
        canEditInfo: true,
        canDeleteOrg: true,
        canManageOrgPageGrants: true,
        canManageOrgTagGrants: true,
      },
    });
    await transaction.organizationMember.create({
      data: {
        organizationId: organization.id,
        userToken: user.user_id,
        roleId: ownerRole.id,
      },
    });
    return organization;
  });
}

export async function getOrganization(name: string) {
  const org = await prisma.organization.findUnique({
    where: { name },
    include: {
      roles: true,
      members: {
        include: { user: true, role: true },
      },
      owner: true,
      orgTagAccess: {
        include: {
          tag: { include: { roles: true } },
          minRole: true,
        },
      },
      orgTagCapability: {
        include: {
          tag: { include: { roles: true } },
          role: true,
          tagRole: true,
        },
      },
      orgTagRequests: {
        where: { status: "PENDING" },
        include: { tag: true, minRole: true, tagRole: true, requester: { select: { accountId: true, username: true } } },
      },
      orgPageAccess: {
        include: {
          page: {
            include: {
              owner: true,
            },
          },
          minRole: true,
        },
      },
      orgPageRequests: {
        where: { status: "PENDING" },
        include: { page: true, minRole: true, requester: { select: { accountId: true, username: true } } },
      },
    },
  });
  return org;
}

export async function userHasOrgPermission(
    orgId: number,
    permissionKey: keyof OrganizationRole,
    user: User | null = null,
): Promise<boolean> {
  if (!user) user = await getSessionUser(await getSessionCookie());
  if (!user) return false;

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return false;
  if (org.ownerToken === user.user_id) return true;

  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userToken: { organizationId: orgId, userToken: user.user_id } },
    include: { role: true },
  });
  if (!membership?.role) return false;

  const permission = membership.role[permissionKey];
  return typeof permission === "boolean" && permission;
}

export async function deleteOrganization(orgId: number) {
  const user = await requireUser();
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) redirect("/");

  if (org.ownerToken !== user.user_id) {
    const has = await userHasOrgPermission(orgId, "canDeleteOrg", user);
    if (!has) throw new OrgPermissionError("Forbidden");
  }

  await prisma.organization.delete({ where: { id: orgId } });
  redirect("/");
}

export async function createOrganizationRole(
    orgId: number,
    data: Required<Pick<RolePermissionsInput, "roleName">> & Omit<RolePermissionsInput, "roleName">
) {
  const user = await requireUser();
  const can = await userHasOrgPermission(orgId, "canManageRoles", user);
  if (!can) throw new OrgPermissionError("Forbidden");
  
  const hierarchyLevel = data.hierarchyLevel ?? 200;
  validateRole({ roleName: data.roleName, hierarchyLevel });
  return prisma.organizationRole.create({
    data: {
      organizationId: orgId,
      roleName: data.roleName,
      hierarchyLevel: hierarchyLevel,
      canManageMembers: !!data.canManageMembers,
      canManageRoles: !!data.canManageRoles,
      canEditInfo: !!data.canEditInfo,
      canDeleteOrg: !!data.canDeleteOrg,
      canManageOrgPageGrants: !!data.canManageOrgPageGrants,
      canManageOrgTagGrants: !!data.canManageOrgTagGrants,
    },
  });
}

export async function updateOrganizationRole(roleId: number, data: RolePermissionsInput) {
  const user = await requireUser();

  const role = await prisma.organizationRole.findUnique({ where: { id: roleId } });
  if (!role) throw new Error("Role not found");

  const can = await userHasOrgPermission(role.organizationId, "canManageRoles", user);
  if (!can) throw new OrgPermissionError("Forbidden");

  if (role.roleName === "Owner") {
    if (data.roleName !== undefined && data.roleName !== "Owner") {
      throw new OrgPermissionError("Owner role cannot be renamed");
    }
    if (
        data.canManageMembers === false ||
        data.canManageRoles === false ||
        data.canEditInfo === false ||
        data.canDeleteOrg === false ||
        data.canManageOrgPageGrants === false ||
        data.canManageOrgTagGrants === false
    ) {
      throw new OrgPermissionError("Owner role permissions cannot be reduced");
    }
  }

  validateRole(data);

  return prisma.organizationRole.update({
    where: { id: roleId },
    data: {
      ...(data.roleName !== undefined ? { roleName: data.roleName } : {}),
      ...(data.hierarchyLevel !== undefined ? { hierarchyLevel: data.hierarchyLevel } : {}),
      ...(data.canManageMembers !== undefined ? { canManageMembers: data.canManageMembers } : {}),
      ...(data.canManageRoles !== undefined ? { canManageRoles: data.canManageRoles } : {}),
      ...(data.canEditInfo !== undefined ? { canEditInfo: data.canEditInfo } : {}),
      ...(data.canDeleteOrg !== undefined ? { canDeleteOrg: data.canDeleteOrg } : {}),
      ...(data.canManageOrgPageGrants !== undefined
          ? { canManageOrgPageGrants: data.canManageOrgPageGrants }
          : {}),
      ...(data.canManageOrgTagGrants !== undefined
          ? { canManageOrgTagGrants: data.canManageOrgTagGrants }
          : {}),
    },
  });
}

export async function deleteOrganizationRole(roleId: number) {
  const user = await requireUser();

  const role = await prisma.organizationRole.findUnique({
    where: { id: roleId },
    include: {
      members: { select: { userToken: true } },
    },
  });
  if (!role) throw new Error("Role not found");

  const can = await userHasOrgPermission(role.organizationId, "canManageRoles", user);
  if (!can) throw new OrgPermissionError("Forbidden");

  if (role.roleName === "Owner") {
    throw new OrgPermissionError("Owner role cannot be deleted");
  }

  if (role.members.length > 0) {
    throw new OrgPermissionError("Cannot delete a role that is assigned to members");
  }

  return prisma.organizationRole.delete({ where: { id: roleId } });
}

async function resolveUserIdFromIdentifier(identifier: string): Promise<string> {
  const value = identifier.trim();
  if (!value) throw new Error("User identifier is required");

  const user = await prisma.user.findUnique({
    where: { accountId: value },
    select: { user_id: true },
  });
  if (!user) throw new Error("User not found. Please select a user from suggestions.");
  return user.user_id;
}

async function grantOrganizationTagRole(
  orgId: number,
  tagId: number,
  organizationRoleId: number,
  tagRole: {
    id: number;
    canManageMembers: boolean;
    canManageRoles: boolean;
    canEditInfo: boolean;
    canDeleteTag: boolean;
    canAddPage: boolean;
    canRevokePage: boolean;
    canManagePageGrants: boolean;
    canReviewRequests: boolean;
  },
) {
  return prisma.orgTagCapability.upsert({
    where: { orgId_tagId_roleId: { orgId, tagId, roleId: organizationRoleId } },
    update: {
      tagRoleId: tagRole.id,
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
      orgId,
      tagId,
      roleId: organizationRoleId,
      tagRoleId: tagRole.id,
      canManageTagMembers: tagRole.canManageMembers,
      canManageTagRoles: tagRole.canManageRoles,
      canEditInfo: tagRole.canEditInfo,
      canDeleteTag: tagRole.canDeleteTag,
      canAddPage: tagRole.canAddPage,
      canRevokePage: tagRole.canRevokePage,
      canManagePageGrants: tagRole.canManagePageGrants,
      canReviewRequests: tagRole.canReviewRequests,
    },
  });
}

export async function searchUsersForOrgMemberAdd(query: string): Promise<MemberUserOption[]> {
  await requireUser();
  const value = query.trim();
  if (!value) return [];

  return prisma.user.findMany({
    where: {
      OR: [
        { accountId: { contains: value, mode: "insensitive" } },
        { username: { contains: value, mode: "insensitive" } },
      ],
    },
    select: {
      user_id: true,
      username: true,
      accountId: true,
      imgLink: true,
    },
    orderBy: { accountId: "asc" },
    take: 20,
  });
}

export async function addOrganizationMember(orgId: number, userIdentifier: string, roleId: number) {
  const user = await requireUser();
  const can = await userHasOrgPermission(orgId, "canManageMembers", user);
  if (!can) throw new OrgPermissionError("Forbidden");

  const role = await prisma.organizationRole.findUnique({ where: { id: roleId } });
  if (!role || role.organizationId !== orgId) throw new Error("Invalid role");

  const targetUserId = await resolveUserIdFromIdentifier(userIdentifier);

  return prisma.organizationMember.upsert({
    where: {
      organizationId_userToken: { organizationId: orgId, userToken: targetUserId },
    },
    update: { roleId },
    create: { organizationId: orgId, userToken: targetUserId, roleId },
    include: { user: true, role: true },
  });
}

export async function addOrganizationMembers(
    orgId: number,
    entries: Array<{ accountId: string; roleId: number }>
) {
  const user = await requireUser();
  const can = await userHasOrgPermission(orgId, "canManageMembers", user);
  if (!can) throw new OrgPermissionError("Forbidden");

  if (!entries.length) return [];

  const roleIds = [...new Set(entries.map((e) => e.roleId))];
  const validRoles = await prisma.organizationRole.findMany({
    where: { organizationId: orgId, id: { in: roleIds } },
    select: { id: true },
  });
  const validRoleIdSet = new Set(validRoles.map((r) => r.id));

  for (const entry of entries) {
    if (!validRoleIdSet.has(entry.roleId)) throw new Error("Invalid role");
  }

  await prisma.$transaction(
      entries.map((entry) =>
          prisma.organizationMember.upsert({
            where: {
              organizationId_userToken: {
                organizationId: orgId,
                userToken: "__placeholder__",
              },
            },
            update: {},
            create: {
              organizationId: orgId,
              userToken: "__placeholder__",
              roleId: entry.roleId,
            },
          })
      )
  ).catch(async () => {
    for (const entry of entries) {
      const userId = await resolveUserIdFromIdentifier(entry.accountId);
      await prisma.organizationMember.upsert({
        where: {
          organizationId_userToken: { organizationId: orgId, userToken: userId },
        },
        update: { roleId: entry.roleId },
        create: { organizationId: orgId, userToken: userId, roleId: entry.roleId },
      });
    }
  });

  const userIds: string[] = [];
  for (const entry of entries) {
    const userId = await resolveUserIdFromIdentifier(entry.accountId);
    userIds.push(userId);
  }

  return prisma.organizationMember.findMany({
    where: {
      organizationId: orgId,
      userToken: { in: userIds },
    },
    include: { user: true, role: true },
  });
}

export async function removeOrganizationMember(orgId: number, userToken: string) {
  const user = await requireUser();
  const can = await userHasOrgPermission(orgId, "canManageMembers", user);
  if (!can) throw new OrgPermissionError("Forbidden");

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new Error("Organization not found");

  if (org.ownerToken === userToken) {
    throw new OrgPermissionError("Cannot remove owner from organization");
  }

  return prisma.organizationMember.delete({
    where: { organizationId_userToken: { organizationId: orgId, userToken } },
  });
}

export async function updateOrganizationMemberRole(orgId: number, userToken: string, roleId: number) {
  const user = await requireUser();
  const can = await userHasOrgPermission(orgId, "canManageMembers", user);
  if (!can) throw new OrgPermissionError("Forbidden");

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new Error("Organization not found");

  if (org.ownerToken === userToken) {
    throw new OrgPermissionError("Owner role assignment cannot be changed");
  }

  const role = await prisma.organizationRole.findUnique({ where: { id: roleId } });
  if (!role || role.organizationId !== orgId) throw new Error("Invalid role");

  return prisma.organizationMember.update({
    where: { organizationId_userToken: { organizationId: orgId, userToken } },
    data: { roleId },
  });
}

export async function requestOrganizationTagAccess(
  orgId: number,
  tagId: number,
  orgRoleId: number,
  tagRoleId: number,
) {
  const user = await requireUser();
  const [tag, organizationRole, tagRole, pending] = await Promise.all([
    prisma.tag.findUnique({ where: { id: tagId }, select: { id: true } }),
    prisma.organizationRole.findUnique({ where: { id: orgRoleId } }),
    prisma.tagRole.findUnique({ where: { id: tagRoleId } }),
    prisma.orgTagRequest.findFirst({
      where: { orgId, tagId, status: "PENDING" },
      select: { id: true },
    }),
  ]);
  if (!tag) throw new Error("Tag not found");
  if (!organizationRole || organizationRole.organizationId !== orgId) throw new Error("Invalid organization role");
  if (!tagRole || tagRole.tagId !== tagId) throw new Error("Invalid tag role");

  const [otherAccess, otherCapability, otherRequest] = await Promise.all([
    prisma.orgTagAccess.findFirst({ where: { tagId, orgId: { not: orgId } }, select: { orgId: true } }),
    prisma.orgTagCapability.findFirst({ where: { tagId, orgId: { not: orgId } }, select: { orgId: true } }),
    prisma.orgTagRequest.findFirst({ where: { tagId, orgId: { not: orgId }, status: "PENDING" }, select: { orgId: true } }),
  ]);
  if (otherAccess || otherCapability || otherRequest) {
    throw new Error("This tag is already assigned to another organization");
  }

  const canManageTagGrants = await userHasOrgPermission(orgId, "canManageOrgTagGrants", user);
  if (canManageTagGrants) {
    if (pending) {
      await prisma.orgTagRequest.update({
        where: { id: pending.id },
        data: { status: "APPROVED", reviewedBy: user.user_id },
      });
    }
    await prisma.orgTagAccess.upsert({
      where: { orgId_tagId: { orgId, tagId } },
      update: { minRoleId: orgRoleId, permissions: "READ" },
      create: { orgId, tagId, minRoleId: orgRoleId, permissions: "READ" },
    });
    await grantOrganizationTagRole(orgId, tagId, orgRoleId, tagRole);
    revalidatePath(`/tags/${tagId}/manage`);
    revalidatePath("/orgs");
    return { requested: false as const, accepted: true as const };
  }

  if (pending) throw new Error("A request for this tag is already pending");

  await prisma.orgTagRequest.create({
    data: { orgId, tagId, minRoleId: orgRoleId, tagRoleId, requestedBy: user.user_id },
  });
  return { requested: true as const, accepted: false as const };
}

export async function getOrganizationsForTagRequest(tagId: number) {
  const user = await requireUser();
  const [organizations, tagRoles] = await Promise.all([
    prisma.organization.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      roles: {
        orderBy: { hierarchyLevel: "asc" },
        select: { id: true, roleName: true, hierarchyLevel: true },
      },
    },
    }),
    prisma.tagRole.findMany({
      where: { tagId },
      orderBy: { hierarchyLevel: "asc" },
      select: { id: true, roleName: true, hierarchyLevel: true },
    }),
  ]);

  return {
    organizations: await Promise.all(
      organizations.map(async (organization) => ({
      ...organization,
      canManageTagGrants: await userHasOrgPermission(organization.id, "canManageOrgTagGrants", user),
      })),
    ),
    tagRoles,
  };
}

export async function requestOrganizationPageAccess(
  orgId: number,
  pageId: number,
  minRoleId: number,
  permissions: PermissionLevel,
) {
  const user = await requireUser();
  const role = await prisma.organizationRole.findUnique({ where: { id: minRoleId } });
  if (!role || role.organizationId !== orgId) throw new Error("Invalid organization role");

  return prisma.orgPageRequest.create({
    data: { orgId, pageId, minRoleId, permissions, requestedBy: user.user_id },
  });
}

export async function reviewOrganizationTagRequest(requestId: number, accept: boolean) {
  const user = await requireUser();
  const request = await prisma.orgTagRequest.findUnique({ where: { id: requestId }, include: { tagRole: true } });
  if (!request) throw new Error("Request not found");
  if (!(await userHasOrgPermission(request.orgId, "canManageOrgTagGrants", user))) {
    throw new OrgPermissionError("Forbidden");
  }

  if (accept) {
    const [otherAccess, otherCapability] = await Promise.all([
      prisma.orgTagAccess.findFirst({ where: { tagId: request.tagId, orgId: { not: request.orgId } }, select: { orgId: true } }),
      prisma.orgTagCapability.findFirst({ where: { tagId: request.tagId, orgId: { not: request.orgId } }, select: { orgId: true } }),
    ]);
    if (otherAccess || otherCapability) {
      throw new Error("This tag is already assigned to another organization");
    }
  }

  await prisma.orgTagRequest.update({
    where: { id: requestId },
    data: { status: accept ? "APPROVED" : "REJECTED", reviewedBy: user.user_id },
  });
  if (accept) {
    await prisma.orgTagAccess.upsert({
      where: { orgId_tagId: { orgId: request.orgId, tagId: request.tagId } },
      update: { minRoleId: request.minRoleId, permissions: "READ" },
      create: { orgId: request.orgId, tagId: request.tagId, minRoleId: request.minRoleId, permissions: "READ" },
    });
    if (request.tagRole) {
      await grantOrganizationTagRole(request.orgId, request.tagId, request.minRoleId, request.tagRole);
    }
  }
  revalidatePath("/orgs");
}

export async function reviewOrganizationPageRequest(requestId: number, accept: boolean) {
  const user = await requireUser();
  const request = await prisma.orgPageRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Request not found");
  if (!(await userHasOrgPermission(request.orgId, "canManageOrgPageGrants", user))) {
    throw new OrgPermissionError("Forbidden");
  }

  await prisma.orgPageRequest.update({
    where: { id: requestId },
    data: { status: accept ? "APPROVED" : "REJECTED", reviewedBy: user.user_id },
  });
  if (accept) {
    await prisma.orgPageAccess.upsert({
      where: { orgId_pageId: { orgId: request.orgId, pageId: request.pageId } },
      update: { minRoleId: request.minRoleId, permissions: request.permissions },
      create: { orgId: request.orgId, pageId: request.pageId, minRoleId: request.minRoleId, permissions: request.permissions },
    });
  }
  revalidatePath("/orgs");
}