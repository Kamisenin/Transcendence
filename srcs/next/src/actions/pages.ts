"use server";

import { prisma } from '%/lib/prisma/prisma';
import { getSessionUser, getSessionCookie } from '%/lib/session';
import { requireUser } from '@/actions/tags'
import { redirect } from "next/navigation";
import { PermissionLevel } from "@prisma/client"
import { init_slug, syncUserSlugs, slugify, removeTagSlug, setTagSlug } from "%/lib/page/slug";
import { User, Page } from '@prisma/client';
import { type InfoboxData } from "@/components/page/Infobox"

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

export async function getAccessiblePages() {
    const user = await requireUser();

    const userId = user.user_id;

    const directPages = await prisma.page.findMany({
        where: {
            permissions: { some: { userToken: userId } },
        },
        include: {
            slugs: true,
            owner: { select: { accountId: true, user_id: true } },
        },
        take: 200,
    });

    const tagMemberships = await prisma.tagMember.findMany({
        where: { userToken: userId },
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
        where: { userToken: userId },
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

export async function savePage(pageId: number, title: string, content: any, infobox: InfoboxData, visibility: boolean, canonicalNamespace?: string | null
) {
    const user = await requireUser();

    const titleSlug = title.trim() ? slugify(title) : null;
    if (!titleSlug) return { success: false, error: "The title cannot be empty." };

    const tagNamespace = canonicalNamespace?.trim() || null;

    const targetNamespaces = [user.accountId, ...(tagNamespace ? [tagNamespace] : [])];
    const conflict = await prisma.pageSlug.findFirst({
        where: { slug: titleSlug, namespace: { in: targetNamespaces }, pageId: { not: pageId } }
    });

    if (conflict) {
        return { success: false, error: `The title "${title}" is already used in this namespace "${conflict.namespace}".` };
    }
    
    await prisma.page.update({
        where: { pageId },
        data: { title, content, public: visibility, description: infobox.description, img: infobox.imageUrl }
    });
    
    await syncUserSlugs(pageId, titleSlug, user.accountId);

    if (tagNamespace) {
        await setTagSlug(pageId, titleSlug, tagNamespace);
    } else {
        await removeTagSlug(pageId, titleSlug);
    }

    return { success: true };
}

export async function createPage() {
    const user = await requireUser();

    const page = await prisma.page.create({
        data: {
            title : '',
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
        )

        SELECT EXISTS (
            SELECT 1 FROM page_owner
            UNION ALL SELECT 1 FROM direct_access
            UNION ALL SELECT 1 FROM tag_owner_access
            UNION ALL SELECT 1 FROM tag_member_access
            UNION ALL SELECT 1 FROM org_owner_access
            UNION ALL SELECT 1 FROM org_member_access
            UNION ALL SELECT 1 FROM org_tag_chain_access
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
    console.log(pageId);
    console.log(userToken);
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