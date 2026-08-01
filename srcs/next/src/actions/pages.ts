"use server";

import { prisma } from '%/lib/prisma/prisma';
import { getSessionUser, getSessionCookie } from '%/lib/session';
import { redirect } from "next/navigation";
import { PermissionLevel } from "@prisma/client"
import { init_slug, syncUserSlugs, slugify, removeTagSlug, setTagSlug } from "%/lib/page/slug";
import { User } from '@prisma/client';
import { type InfoboxData } from "@/components/page/Infobox"

export async function savePage(pageId: number, title: string, content: any, infobox: InfoboxData, visibility: boolean, canonicalNamespace?: string | null
) {
    const user = await getSessionUser(await getSessionCookie());
    if (!user) throw new Error("Unidentified user");

    console.log("desc : ", infobox.description, " img :", infobox.imageUrl);
    await prisma.page.update({
        where: { pageId },
        data: { title, content, public: visibility, description: infobox.description, img: infobox.imageUrl}
    });

    await syncUserSlugs(pageId, title, user.accountId);

    // cleanup and update of page slug
    if (canonicalNamespace && canonicalNamespace.trim()) {
        await setTagSlug(pageId, title, canonicalNamespace.trim());
    } else {
        await removeTagSlug(pageId);
    }
}

export async function createPage() {
    const user = await getSessionUser(await getSessionCookie());

    if (!user) throw new Error("Unidentified user");

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

    const page = await prisma.page.findUnique({ where: { pageId }, select: { public: true } });
    if (!page) return false;

    if (!userToken) return false;

    return await hasPageAccess(userToken, pageId, ['READ', 'WRITE', 'ADMIN']);
}