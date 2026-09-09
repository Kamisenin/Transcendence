"use server";

import { prisma } from '%/lib/prisma/prisma';
import { getSessionUser, getSessionCookie } from '%/lib/session';
import { requireUser } from '@/actions/tags'
import { redirect } from "next/navigation";
import { PermissionLevel } from "@prisma/client"
import { init_slug, syncUserSlugs, slugify, removeTagSlug, setTagSlug } from "%/lib/page/slug";
import { Page } from '@prisma/client';
import { type InfoboxData } from "@/components/page/Infobox"
import { notifyPageEdit } from "%/lib/notifications";
import { getUserById } from '@/app/lib/prisma/prisma-utils';
import { PageData } from '@/components/ForumCard';
import { PagePermissionError } from "%/lib/errors";
import { revalidatePath } from "next/cache";
import { getTagCapabilities } from '%/lib/tag_permissions';
import { userHasOrgPermission } from '@/actions/orgs';
import { requestTagPageAccess } from '@/actions/tags';

function findPreviewImageFromContent(content: any): string | null {
    try {
        if (!content) return null;
        const blocks = content?.blocks || [];
        for (const b of blocks) {
            if (!b) continue;
            if (b.type === 'image' && b.data) {
                if (b.data.file && (b.data.file.url || b.data.file.src)) return b.data.file.url || b.data.file.src;
                if (b.data.url) return b.data.url;
                if (b.data.src) return b.data.src;
            }
            if (b.data && (b.data.image || b.data.img || b.data.thumb)) {
                const candidate = b.data.image?.url || b.data.image?.src || b.data.img?.url || b.data.thumb?.url;
                if (candidate) return candidate;
            }
        }
        const json = JSON.stringify(content);
        const match = json.match(/https?:\/\/[^"\s>]+?\.(png|jpg|jpeg|webp|gif)/i);
        if (match) return match[0];
        return null;
    } catch {
        return null;
    }
}

export async function getOwnedPages() {
    const user = await requireUser();

    const pages = await prisma.page.findMany({
        where: { ownerId: user.user_id },
        orderBy: { lastModified: 'desc' },
        include: {
            slugs: true,
            owner: { select: { accountId: true, user_id: true } },
        },
        take: 200,
    });

    return pages.map(p => {
        const canonical = (p.slugs || []).find((s: any) => s.isCanonical);
        const preview = findPreviewImageFromContent(p.content) || null;
        return {
            pageId: p.pageId,
            title: p.title,
            preview,
            ownerAccount: p.owner?.accountId || p.owner?.user_id,
            canonicalSlug: canonical ? { namespace: canonical.namespace, slug: canonical.slug } : null,
            lastModified: p.lastModified,
        };
    });
}

const EDIT_LEVELS: PermissionLevel[] = [PermissionLevel.WRITE, PermissionLevel.ADMIN];

const pageInclude = {
    slugs: true,
    tagPages: { include: { tag: true } },
} as const;

export async function getEditablePages(user_id : string) {
    
    const user = await getUserById(user_id);
    if (!user)
        throw new Error("can't find user");

    const ownedPages = await prisma.page.findMany({
        where: { ownerId: user.user_id },
        include : pageInclude,
        take: 200,
    });

    const directPages = await prisma.page.findMany({
        where: {
            permissions: {
                some: {
                    userToken: user_id,
                    permissions: { in: EDIT_LEVELS },
                },
            },
        },
        include : pageInclude,
        take: 200,
    });

    const tagMemberships = await prisma.tagMember.findMany({
        where: { userToken: user_id },
        include: { role: true },
    });

    let tagEditablePages: any[] = [];
    if (tagMemberships.length) {
        const tagPageAccess = await prisma.tagPageAccess.findMany({
            where: {
                tagId: { in: tagMemberships.map(m => m.tagId) },
                permissions: { in: EDIT_LEVELS },
            },
            include: { page: { include : pageInclude }, minRole: true },
            take: 500,
        });

        tagEditablePages = tagPageAccess
            .filter(access => {
                const membership = tagMemberships.find(m => m.tagId === access.tagId);
                if (!membership || !membership.role || !access.minRole) return false;
                return membership.role.hierarchyLevel <= access.minRole.hierarchyLevel;
            })
            .map(access => access.page)
            .filter(Boolean);
    }

    const orgMemberships = await prisma.organizationMember.findMany({
        where: { userToken: user_id },
        include: { role: true },
    });

    let orgEditablePages: any[] = [];
    if (orgMemberships.length) {
        const orgPageAccess = await prisma.orgPageAccess.findMany({
            where: {
                orgId: { in: orgMemberships.map(m => m.organizationId) },
                permissions: { in: EDIT_LEVELS },
            },
            include: { page: { include : pageInclude }, minRole: true },
            take: 500,
        });

        orgEditablePages = orgPageAccess
            .filter(access => {
                const membership = orgMemberships.find(m => m.organizationId === access.orgId);
                if (!membership || !membership.role || !access.minRole) return false;
                return membership.role.hierarchyLevel <= access.minRole.hierarchyLevel;
            })
            .map(access => access.page)
            .filter(Boolean);
    }

    const pagesMap = new Map<number, typeof ownedPages[number]>();
    for (const p of ownedPages) pagesMap.set(p.pageId, p);
    for (const p of directPages) pagesMap.set(p.pageId, p);
    for (const p of tagEditablePages) pagesMap.set(p.pageId, p);
    for (const p of orgEditablePages) pagesMap.set(p.pageId, p);

    return Array.from(pagesMap.values());
}

function mapPageToPageData(p: any): PageData {
    const canonical = (p.slugs || []).find((s: any) => s.isCanonical);

    return {
        pageId: p.pageId,
        title: p.title,
        description: p.description,
        img: p.img,
        slug: canonical?.slug ?? "",
        namespace: canonical?.namespace ?? "",
        tags: (p.tagPages || []).map((tp: any) => ({
            id: tp.tag.id,
            name: tp.tag.name,
        })),
    };
}

export async function getAccessiblePages() {
    const user = await requireUser();

    const user_id = user.accountId;
    const directPages = await prisma.page.findMany({
        where: {
            permissions: { some: { userToken: user_id } },
        },
        include: {
            slugs: true,
            owner: { select: { accountId: true, user_id: true } },
        },
        take: 200,
    });

    const tagMemberships = await prisma.tagMember.findMany({
        where: { userToken: user_id },
        select: { tagId: true },
    });
    const tagPagePages = tagMemberships.length
        ? await prisma.tagPage.findMany({
            where: { tagId: { in: tagMemberships.map(m => m.tagId) } },
            include: { page: { include: { slugs: true, owner: { select: { accountId: true, user_id: true } } } } },
            take: 500,
        })
        : [];

    const memberships = await prisma.organizationMember.findMany({
        where: { userToken: user_id },
        include: { role: true },
    });
    const orgIds = memberships.map(m => m.organizationId);
    let orgAccessiblePages: any[] = [];
    if (orgIds.length) {
        const orgPageAccess = await prisma.orgPageAccess.findMany({
            where: { orgId: { in: orgIds } },
            include: {
                page: { include: { slugs: true, owner: { select: { accountId: true, user_id: true } } } },
                minRole: true,
            },
            take: 500,
        });

        const accessAllowed = orgPageAccess.filter(ap => {
            const membership = memberships.find(m => m.organizationId === ap.orgId);
            if (!membership || !membership.role || !ap.minRole) return false;
            return membership.role.hierarchyLevel <= ap.minRole.hierarchyLevel;
        });

        orgAccessiblePages = accessAllowed.map(a => a.page);
    }

    const itemsMap = new Map<number, any>();
    for (const p of directPages) itemsMap.set(p.pageId, p);
    for (const tp of tagPagePages) if (tp.page) itemsMap.set(tp.page.pageId, tp.page);
    for (const p of orgAccessiblePages) if (p) itemsMap.set(p.pageId, p);

    const results = Array.from(itemsMap.values()).map((p: any) => {
        const canonical = (p.slugs || []).find((s: any) => s.isCanonical);
        const preview = findPreviewImageFromContent(p.content) || null;
        return {
            pageId: p.pageId,
            title: p.title,
            preview,
            ownerAccount: p.owner?.accountId || p.owner?.user_id,
            canonicalSlug: canonical ? { namespace: canonical.namespace, slug: canonical.slug } : null,
        };
    });
    return results;
}

export async function filterPages(user_id : string | undefined, pages : Page[] )
{
    
    const publicPages = pages.filter(page => page.public);
    if (!user_id)
        return (publicPages.map(mapPageToPageData));
    
    const privatePages = pages.filter(page => !page.public);

    const permissions = await Promise.all(
        privatePages.map(page => canViewPage(page.pageId, user_id))
    );

    const accessiblePrivatePages = privatePages.filter((_, index) => permissions[index]);

    const result = [...publicPages, ...accessiblePrivatePages];
    return result.map(mapPageToPageData);
}

export async function savePage(
    pageId: number,
    title: string,
    content: any,
    infobox: InfoboxData,
    visibility: boolean,
    canonicalNamespace?: string | null
) {
    const user = await requireUser();

    const titleSlug = title.trim() ? slugify(title) : null;

    if (!titleSlug) {
        return {
            success: false,
            error: "The title cannot be empty."
        };
    }

    const tagNamespace = canonicalNamespace?.trim() || null;

    const targetNamespaces = [user.accountId, ...(tagNamespace ? [tagNamespace] : [])];
    const conflict = await prisma.pageSlug.findFirst({
        where: {
            slug: titleSlug,
            namespace: {
                in: targetNamespaces
            },
            pageId: {
                not: pageId
            }
        }
    });

    if (conflict) {
        return {
            success: false,
            error: `The title "${title}" is already used in this namespace "${conflict.namespace}".`
        };
    }

    await prisma.page.update({
        where: { pageId },
        data: { title, content, public: visibility, description: infobox.description, img: infobox.imageUrl, lastEditedById: user.user_id }
    });

    const tagIds = Array.from(
        new Set(
            (infobox.tags ?? [])
                .map(tag => Number(tag.id))
                .filter(tagId => Number.isInteger(tagId))
        )
    );

    await prisma.tagPage.deleteMany({
        where: {
            pageId,
            ...(tagIds.length > 0
                ? {
                    tagId: {
                        notIn: tagIds
                    }
                }
                : {})
        }
    });

    await prisma.pageReaction.deleteMany({
        where: {
            pageId,
            type: 'FAVORITE',
            page: { tagPages: { none: {} } },
        },
    });

    await prisma.tagPageRequest.deleteMany({
        where: {
            pageId,
            status: 'PENDING',
            ...(tagIds.length > 0 ? { tagId: { notIn: tagIds } } : {}),
        },
    });

    const existingTagPages = await prisma.tagPage.findMany({
        where: { pageId, tagId: { in: tagIds } },
        select: { tagId: true },
    });
    const existingTagIds = new Set(existingTagPages.map(({ tagId }) => tagId));

    for (const tagId of tagIds) {
        if (!existingTagIds.has(tagId)) {
            await requestTagPageAccess(tagId, pageId);
        }
    }

    await syncUserSlugs(
        pageId,
        titleSlug,
        user.accountId
    );

    if (tagNamespace) {

        await setTagSlug(
            pageId,
            titleSlug,
            tagNamespace
        );

    } else {

        await removeTagSlug(
            pageId,
            titleSlug
        );
    }

    await notifyPageEdit(pageId, user.user_id);

    return {
        success: true
    };
}



export async function createPage() {
    const user = await requireUser();

    const page = await prisma.page.create({
        data: {
            title : crypto.randomUUID(),
            ownerId: user.user_id,
            content: { blocks: [] },
        },
    });

    await init_slug(user.accountId, page.pageId);
    redirect(`/wiki/${user.accountId}/${page.pageId}/edit`);
}

export async function checkTitleAvailability(pageId: number, title: string): Promise<{ available: boolean; slug: string }> {
    const user = await getSessionUser(await getSessionCookie());
    if (!user) return { available: false, slug: '' };

    const titleSlug = slugify(title);
    if (!titleSlug) return { available: true, slug: '' };

    const existing = await prisma.pageSlug.findFirst({
        where: {
            namespace: user.accountId,
            slug: titleSlug,
            NOT: { pageId: pageId }
        }
    });

    return {
        available: !existing,
        slug: titleSlug
    };
}

async function hasPageAccess(
    userToken: string,
    pageId: number,
    levels: PermissionLevel[]
): Promise<boolean> {

    const result = await prisma.$queryRaw<{ has_access: boolean }[]>`
        WITH page_owner AS (
            SELECT 1 AS ok
            FROM pages
            WHERE page_id = ${pageId} AND owner_id = ${userToken}
        ),

        direct_access AS (
            SELECT 1 AS ok
            FROM page_permissions
            WHERE page_id = ${pageId}
              AND user_token = ${userToken}
              AND permissions = ANY(${levels}::"PermissionLevel"[])
        ),

        tag_owner_access AS (
            SELECT 1 AS ok
            FROM tag_page_access tpa
            JOIN tags t ON t.id = tpa.tag_id
            WHERE tpa.page_id = ${pageId}
              AND tpa.permissions = ANY(${levels}::"PermissionLevel"[])
              AND t.owner_token = ${userToken}
        ),

        tag_member_access AS (
            SELECT 1 AS ok
            FROM tag_page_access tpa
            JOIN tag_members tm ON tm.tag_id = tpa.tag_id AND tm.user_token = ${userToken}
            JOIN tag_roles member_role ON member_role.id = tm.role_id
            JOIN tag_roles min_role ON min_role.id = tpa.min_role_id
            WHERE tpa.page_id = ${pageId}
              AND tpa.permissions = ANY(${levels}::"PermissionLevel"[])
              AND member_role.hierarchy_level >= min_role.hierarchy_level
        ),

        org_owner_access AS (
            SELECT 1 AS ok
            FROM org_page_access opa
            JOIN organizations o ON o.id = opa.org_id
            WHERE opa.page_id = ${pageId}
              AND opa.permissions = ANY(${levels}::"PermissionLevel"[])
              AND o.owner_token = ${userToken}
        ),

        org_member_access AS (
            SELECT 1 AS ok
            FROM org_page_access opa
            JOIN organization_members om ON om.organization_id = opa.org_id AND om.user_token = ${userToken}
            JOIN organization_roles member_role ON member_role.id = om.role_id
            JOIN organization_roles min_role ON min_role.id = opa.min_role_id
            WHERE opa.page_id = ${pageId}
              AND opa.permissions = ANY(${levels}::"PermissionLevel"[])
              AND member_role.hierarchy_level >= min_role.hierarchy_level
        ),

        org_tag_chain_access AS (
            SELECT 1 AS ok
            FROM tag_page_access tpa
            JOIN org_tag_access ota ON ota.tag_id = tpa.tag_id
            JOIN organization_members om ON om.organization_id = ota.org_id AND om.user_token = ${userToken}
            JOIN organization_roles member_role ON member_role.id = om.role_id
            JOIN organization_roles min_role ON min_role.id = ota.min_role_id
            WHERE tpa.page_id = ${pageId}
              AND tpa.permissions = ANY(${levels}::"PermissionLevel"[])
              AND ota.permissions = ANY(${levels}::"PermissionLevel"[])
              AND member_role.hierarchy_level >= min_role.hierarchy_level
                ),

                tag_request_reviewer_access AS (
                        SELECT 1 AS ok
                        FROM tag_page_requests tpr
                        JOIN tags t ON t.id = tpr.tag_id
                        WHERE tpr.page_id = ${pageId}
                            AND tpr.status = 'PENDING'
                            AND (
                                t.owner_token = ${userToken}
                                OR EXISTS (
                                        SELECT 1
                                        FROM tag_permissions tp
                                        WHERE tp.tag_id = tpr.tag_id
                                            AND tp.user_token = ${userToken}
                                            AND tp.can_review_requests = true
                                )
                                OR EXISTS (
                                        SELECT 1
                                        FROM tag_members tm
                                        JOIN tag_roles tr ON tr.id = tm.role_id
                                        WHERE tm.tag_id = tpr.tag_id
                                            AND tm.user_token = ${userToken}
                                            AND tr.can_review_requests = true
                                )
                                OR EXISTS (
                                        SELECT 1
                                        FROM org_tag_capability otc
                                        JOIN organization_members om
                                            ON om.organization_id = otc.org_id
                                         AND om.role_id = otc.role_id
                                         AND om.user_token = ${userToken}
                                        WHERE otc.tag_id = tpr.tag_id
                                            AND otc.can_review_requests = true
                                )
                            )
        )

        SELECT EXISTS (
            SELECT 1 FROM page_owner
            UNION ALL SELECT 1 FROM direct_access
            UNION ALL SELECT 1 FROM tag_owner_access
            UNION ALL SELECT 1 FROM tag_member_access
            UNION ALL SELECT 1 FROM org_owner_access
            UNION ALL SELECT 1 FROM org_member_access
            UNION ALL SELECT 1 FROM org_tag_chain_access
            UNION ALL SELECT 1 FROM tag_request_reviewer_access
        ) AS has_access;
    `;

    return result[0]?.has_access ?? false;
}

async function getUserToken() : Promise<string>
{
    const user = await getSessionUser(await getSessionCookie())
    if (!user)
        throw new Error("Unidentified User");
    return user.user_id;
}

export async function canEditPage(pageId: number, userToken: string = ""): Promise<boolean> {
    if (userToken.length === 0)
        userToken = await getUserToken();
    return await hasPageAccess(userToken, pageId, ['WRITE', 'ADMIN']);
}

export async function canViewPage(pageId: number, userToken: string = ""): Promise<boolean> {
    if (userToken.length === 0)
        userToken = await getUserToken();
    if (!userToken)
        return false;
    return await hasPageAccess(userToken, pageId, ['READ', 'WRITE', 'ADMIN']);
}

export async function getCanonicalNamespace(pageId: number)
{
    return await prisma.pageSlug.findFirst({
        where : { pageId, isCanonical : true}
    });
}

export async function getRecentlyEditedPages(limit: number = 6) {
    const user = await getSessionUser(await getSessionCookie());

    const pages = await prisma.page.findMany({
        where: user
            ? {
                OR: [
                    { public: true },
                    { ownerId: user.user_id },
                    { permissions: { some: { userToken: user.user_id } } },
                ],
            }
            : { public: true },
        orderBy: { lastModified: 'desc' },
        take: limit,
        include: {
            slugs: { where: { isCanonical: true } },
            lastEditor: { select: { username: true } },
            tagPages: { include: { tag: { select: { name: true, color: true } } }, take: 1 },
        },
    });

    return pages.map((p: typeof pages[number]) => ({
        pageId: p.pageId,
        title: p.title,
        lastModified: p.lastModified,
        canonicalSlug: p.slugs[0] ? { namespace: p.slugs[0].namespace, slug: p.slugs[0].slug } : null,
        lastEditorName: p.lastEditor?.username ?? null,
        tag: p.tagPages[0]?.tag ? { name: p.tagPages[0].tag.name, color: p.tagPages[0].tag.color } : null,
    }));
}

// ───────────── PAGE PERMISSIONS ─────────────

async function hasPageManagePermission(pageId: number, userToken: string): Promise<boolean> {
    const page = await prisma.page.findUnique({ where: { pageId }, select: { ownerId: true } });
    if (!page) return false;
    if (page.ownerId === userToken) return true;

    const permission = await prisma.pagePermission.findUnique({
        where: { pageId_userToken: { pageId, userToken } },
    });

    return Boolean(permission?.canManagePermissions || permission?.permissions === 'ADMIN');
}

export async function searchUsersForPageAdd(query: string) {
    await requireUser();

    const q = query.trim();
    if (!q) return [];

    return prisma.user.findMany({
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
}

export async function getPagePermissions(pageId: number) {
    return prisma.pagePermission.findMany({
        where: { pageId },
        include: { user: { select: { user_id: true, username: true, accountId: true, imgLink: true } } },
    });
}

export async function addPagePermission(pageId: number, accountId: string, level: PermissionLevel) {
    const user = await requireUser();
    const can = await hasPageManagePermission(pageId, user.user_id);
    if (!can) throw new PagePermissionError("Forbidden");

    const targetUser = await prisma.user.findUnique({ where: { accountId }, select: { user_id: true } });
    if (!targetUser) throw new Error("User not found. Please select a user from suggestions.");

    const result = await prisma.pagePermission.upsert({
        where: { pageId_userToken: { pageId, userToken: targetUser.user_id } },
        update: { permissions: level },
        create: { pageId, userToken: targetUser.user_id, permissions: level },
        include: { user: { select: { user_id: true, username: true, accountId: true, imgLink: true } } },
    });

    revalidatePath(`/wiki/${accountId}/${pageId}/edit`);
    return result;
}

export async function removePagePermission(pageId: number, userToken: string) {
    const user = await requireUser();
    const can = await hasPageManagePermission(pageId, user.user_id);
    if (!can) throw new PagePermissionError("Forbidden");

    await prisma.pagePermission.delete({
        where: { pageId_userToken: { pageId, userToken } },
    }).catch(() => {});

    revalidatePath(`/pages`);
}

export async function getGrantableTagsAndOrgs(pageId: number) {
    const user = await requireUser();

    const [page, orgs] = await Promise.all([
        prisma.page.findUnique({
            where: { pageId },
            select: { ownerId: true, tagPages: { select: { tag: true } } },
        }),
        prisma.organization.findMany({ include: { roles: true } }),
    ]);
    if (!page || page.ownerId !== user.user_id) throw new PagePermissionError("Forbidden");

    const tags = page.tagPages.map(({ tag }) => tag);

    const grantableTags = [];
    for (const tag of tags) {
        const caps = await getTagCapabilities(tag.id, user.user_id);
        if (caps.canManagePageGrants) {
            const roles = await prisma.tagRole.findMany({
                where: { tagId: tag.id },
                orderBy: { hierarchyLevel: 'desc' },
            });
            grantableTags.push({ id: tag.id, name: tag.name, roles });
        }
    }

    const grantableOrgs = orgs.map(({ id, name, roles }) => ({ id, name, roles }));

    return { grantableTags, grantableOrgs };
}

export async function getPageRoleAccess(pageId: number) {
    const [tagAccess, orgAccess] = await Promise.all([
        prisma.tagPageAccess.findMany({
            where: { pageId },
            include: { tag: { select: { name: true } }, minRole: { select: { roleName: true } } },
        }),
        prisma.orgPageAccess.findMany({
            where: { pageId },
            include: { organization: { select: { name: true } }, minRole: { select: { roleName: true } } },
        }),
    ]);
    return { tagAccess, orgAccess };
}

export async function addTagRolePageAccess(pageId: number, tagId: number, minRoleId: number, level: PermissionLevel) {
    const user = await requireUser();
    const can = await hasPageManagePermission(pageId, user.user_id);
    if (!can) throw new PagePermissionError("Forbidden");

    const pageTag = await prisma.tagPage.findUnique({ where: { tagId_pageId: { tagId, pageId } } });
    if (!pageTag) throw new PagePermissionError("Tag is not attached to this page");

    const result = await prisma.tagPageAccess.upsert({
        where: { pageId_tagId: { pageId, tagId } },
        update: { minRoleId, permissions: level },
        create: { pageId, tagId, minRoleId, permissions: level },
        include: { tag: { select: { name: true } }, minRole: { select: { roleName: true } } },
    });

    revalidatePath(`/pages`);
    return result;
}

export async function removeTagRolePageAccess(pageId: number, tagId: number) {
    const user = await requireUser();
    const can = await hasPageManagePermission(pageId, user.user_id);
    if (!can) throw new PagePermissionError("Forbidden");

    await prisma.tagPageAccess.delete({
        where: { pageId_tagId: { pageId, tagId } },
    }).catch(() => {});

    revalidatePath(`/pages`);
}

export async function addOrgRolePageAccess(pageId: number, orgId: number, minRoleId: number, level: PermissionLevel) {
    const user = await requireUser();
    const can = await hasPageManagePermission(pageId, user.user_id);
    if (!can) throw new PagePermissionError("Forbidden");

    const role = await prisma.organizationRole.findUnique({ where: { id: minRoleId } });
    if (!role || role.organizationId !== orgId) throw new PagePermissionError("Invalid organization role");

    if (!(await userHasOrgPermission(orgId, "canManageOrgPageGrants", user))) {
        const { requestOrganizationPageAccess } = await import("@/actions/orgs");
        await requestOrganizationPageAccess(orgId, pageId, minRoleId, level);
        return { request: true as const };
    }

    const result = await prisma.orgPageAccess.upsert({
        where: { orgId_pageId: { orgId, pageId } },
        update: { minRoleId, permissions: level },
        create: { pageId, orgId, minRoleId, permissions: level },
        include: { organization: { select: { name: true } }, minRole: { select: { roleName: true } } },
    });

    revalidatePath(`/pages`);
    return result;
}

export async function removeOrgRolePageAccess(pageId: number, orgId: number) {
    const user = await requireUser();
    const can = await hasPageManagePermission(pageId, user.user_id);
    if (!can) throw new PagePermissionError("Forbidden");

    await prisma.orgPageAccess.delete({
        where: { orgId_pageId: { orgId, pageId } },
    }).catch(() => {});

    revalidatePath(`/pages`);
}

export async function deletePage(pageId: number) {
    const user = await requireUser();

    const page = await prisma.page.findUnique({ where: { pageId }, select: { ownerId: true } });
    if (!page) throw new Error("Page not found");
    if (page.ownerId !== user.user_id) throw new PagePermissionError("Forbidden");

    await prisma.page.delete({ where: { pageId } });

    revalidatePath(`/pages`);
    return { success: true };
}