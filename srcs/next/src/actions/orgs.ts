"use server";

import { prisma } from '%/lib/prisma/prisma';
import { getSessionUser, getSessionCookie } from '%/lib/session';
import { Organization, OrganizationMember, OrganizationRole } from '@prisma/client';

export async function getUserOrgs(): Promise<Organization[]> {
  const user = await getSessionUser(await getSessionCookie());
  if (!user) throw new Error("Unidentified user");


  const owned = await prisma.organization.findMany({
    where: { ownerToken: user.user_id },
  });

  const memberOrgIds = await prisma.organizationMember.findMany({
    where: { userToken: user.user_id },
    select: { organizationId: true },
  });

  const memberOrgs = await prisma.organization.findMany({
    where: { id: { in: memberOrgIds.map(m => m.organizationId) } },
  });

  // remove duplicate organizations
  const map = new Map<number, Organization>();
  owned.concat(memberOrgs).forEach(o => map.set(o.id, o));
  return Array.from(map.values());
}

export async function getOrganization(name: string) {
  const org = await prisma.organization.findUnique({
    where: { name },
    include: {
      roles: true,
      members: {
        include: { user: true, role: true }
      },
      owner: true,
      orgTagAccess: {
        include: {
          tag: true,
          minRole: true
        }
      },
      orgPageAccess: {
        include: {
          page: {
            include: {
              owner: true
            }
          },
          minRole: true
        }
      }
    }
  });
  return org;
}

export async function userHasOrgPermission(orgId: number, permissionKey: keyof OrganizationRole): Promise<boolean> {
  const user = await getSessionUser(await getSessionCookie());
  if (!user) return false;

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return false;

  if (org.ownerToken === user.user_id) return true;

  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userToken: { organizationId: orgId, userToken: user.user_id } },
    include: { role: true },
  });

  if (!membership || !membership.role) return false;

  // @ts-ignore dynamic key access: cast to any
  return Boolean((membership.role as any)[permissionKey]);
}

export async function createOrganization(name: string) {
  const user = await getSessionUser(await getSessionCookie());
  if (!user) throw new Error("Unidentified user");
  const org = await prisma.organization.create({
    data: {
      name,
      ownerToken: user.user_id,
      roles: {
        create: [
          {
            roleName: 'Owner',
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

  // create owner membership pointing to the owner role
  const ownerRole = await prisma.organizationRole.findFirst({
    where: { organizationId: org.id, roleName: 'Owner' },
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
  const user = await getSessionUser(await getSessionCookie());
  if (!user) throw new Error("Unidentified user");

  const org = await prisma.organization.findUnique({ where: { id: orgId }});
  if (!org) throw new Error("Organization not found");

  if (org.ownerToken !== user.user_id) {
    const has = await userHasOrgPermission(orgId, "canDeleteOrg");
    if (!has) throw new Error("Forbidden");
  }

  return prisma.organization.delete({ where: { id: orgId }});
}