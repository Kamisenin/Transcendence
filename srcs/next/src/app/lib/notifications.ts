"use server";

import { prisma } from '%/lib/prisma/prisma';

export async function getPageWatchers(pageId: number, excludeUserId?: string): Promise<string[]> {
    const rows = await prisma.$queryRaw<{ user_token: string }[]>`
        WITH page_owner AS (
            SELECT owner_id AS user_token
            FROM pages
            WHERE page_id = ${pageId}
        ),

        direct_access AS (
            SELECT user_token
            FROM page_permissions
            WHERE page_id = ${pageId}
        ),

        tag_owner_access AS (
            SELECT t.owner_token AS user_token
            FROM tag_page_access tpa
            JOIN tags t ON t.id = tpa.tag_id
            WHERE tpa.page_id = ${pageId}
        ),

        tag_member_access AS (
            SELECT tm.user_token
            FROM tag_page_access tpa
            JOIN tag_members tm ON tm.tag_id = tpa.tag_id
            JOIN tag_roles member_role ON member_role.id = tm.role_id
            JOIN tag_roles min_role ON min_role.id = tpa.min_role_id
            WHERE tpa.page_id = ${pageId}
              AND member_role.hierarchy_level >= min_role.hierarchy_level
        ),

        org_owner_access AS (
            SELECT o.owner_token AS user_token
            FROM org_page_access opa
            JOIN organizations o ON o.id = opa.org_id
            WHERE opa.page_id = ${pageId}
        ),

        org_member_access AS (
            SELECT om.user_token
            FROM org_page_access opa
            JOIN organization_members om ON om.organization_id = opa.org_id
            JOIN organization_roles member_role ON member_role.id = om.role_id
            JOIN organization_roles min_role ON min_role.id = opa.min_role_id
            WHERE opa.page_id = ${pageId}
              AND member_role.hierarchy_level >= min_role.hierarchy_level
        ),

        org_tag_chain_access AS (
            SELECT om.user_token
            FROM tag_page_access tpa
            JOIN org_tag_access ota ON ota.tag_id = tpa.tag_id
            JOIN organization_members om ON om.organization_id = ota.org_id
            JOIN organization_roles member_role ON member_role.id = om.role_id
            JOIN organization_roles min_role ON min_role.id = ota.min_role_id
            WHERE tpa.page_id = ${pageId}
              AND member_role.hierarchy_level >= min_role.hierarchy_level
        )

        SELECT DISTINCT user_token FROM (
            SELECT user_token FROM page_owner
            UNION ALL SELECT user_token FROM direct_access
            UNION ALL SELECT user_token FROM tag_owner_access
            UNION ALL SELECT user_token FROM tag_member_access
            UNION ALL SELECT user_token FROM org_owner_access
            UNION ALL SELECT user_token FROM org_member_access
            UNION ALL SELECT user_token FROM org_tag_chain_access
        ) AS all_access
        WHERE user_token IS NOT NULL;
    `;

    const tokens = rows.map((r: { user_token: string }) => r.user_token);
    return excludeUserId ? tokens.filter((t: string) => t !== excludeUserId) : tokens;
}

export async function notifyPageEdit(pageId: number, editorId: string): Promise<void> {
    const watchers = await getPageWatchers(pageId, editorId);
    if (watchers.length === 0) return;

    await prisma.notification.createMany({
        data: watchers.map(userToken => ({
            recipientId: userToken,
            actorId: editorId,
            pageId,
            type: 'PAGE_EDITED',
        })),
    });
}