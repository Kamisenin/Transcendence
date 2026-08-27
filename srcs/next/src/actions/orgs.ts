"use server";

import { prisma } from "%/lib/prisma/prisma";
import { getSessionUser, getSessionCookie } from "%/lib/session";
import { requireUser } from "@/actions/tags";
import { Organization, OrganizationRole, User } from "@prisma/client";
import { redirect } from "next/navigation";
import { OrgPermissionError } from "%/lib/errors";

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

export type MemberUserOption = {
  user_id: string;
  username: string;
  accountId: string;
  imgLink: string | null;
};

export async function getUserOrgs(): Promise<Organization[]> {
  const user = await requireUser();

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
          tag: true,
          minRole: true,
        },
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
    },
  });
  return org;
}

export async function userHasOrgPermission(
    orgId: number,
    permissionKey: keyof OrganizationRole,
    user: User | null = null
): Promise<boolean> {
  if (!user) user = await getSessionUser(await getSessionCookie());
  if (!user) return false;

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return false;

  if (org.ownerToken === user.user_id) return true;

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userToken: { organizationId: orgId, userToken: user.user_id },
    },
    include: { role: true },
  });

  if (!membership || !membership.role) return false;

  return Boolean((membership.role as any)[permissionKey]);
}

async function resolveUserIdFromIdentifier(identifier: string): Promise<string> {
  const value = identifier.trim();
  if (!value) throw new Error("User identifier is required");

  const byAccountId = await prisma.user.findUnique({
    where: { accountId: value },
    select: { user_id: true },
  });
  if (byAccountId) return byAccountId.user_id;

  throw new Error("User not found. Please select a user from suggestions.");
}

export async function searchUsersForOrgMemberAdd(query: string): Promise<MemberUserOption[]> {
  const user = await requireUser();
  if (!user) return [];

  const q = query.trim();
  if (!q) return [];

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { accountId: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } },
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

  return users;
}

export async function createOrganization(name: string) {
  const user = await requireUser();
  const org = await prisma.organization.create({
    data: {
      name,
      ownerToken: user.user_id,
      roles: {
        create: [
          {
            roleName: "Owner",
            hierarchyLevel: 0,
            canManageMembers: true,
            canManageRoles: true,
            canEditInfo: true,
            canDeleteOrg: true,
            canManageOrgPageGrants: true,
            canManageOrgTagGrants: true,
          },
        ],
      },
    },
  });

  const ownerRole = await prisma.organizationRole.findFirst({
    where: { organizationId: org.id, roleName: "Owner" },
  });

  if (ownerRole) {
    await prisma.organizationMember.create({
      data: { organizationId: org.id, userToken: user.user_id, roleId: ownerRole.id },
    });
  }

  return org;
}

export async function updateOrganization(orgId: number, data: { name?: string }) {
  return prisma.organization.update({ where: { id: orgId }, data });
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

  return prisma.organizationRole.create({
    data: {
      organizationId: orgId,
      roleName: data.roleName,
      hierarchyLevel: data.hierarchyLevel ?? 100,
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