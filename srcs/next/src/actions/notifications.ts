"use server";

import { prisma } from "@/app/lib/prisma/prisma";
import { NotificationType } from "@prisma/client";

type NotifyInput = {
    recipientId: string;
    actorId?: string | null;
    pageId?: number | null;
    friendshipId?: string | null;
    type: NotificationType;
};

export async function notify({ recipientId, actorId, pageId, friendshipId, type }: NotifyInput) {
    if (actorId && actorId === recipientId) return null;

    return prisma.notification.create({
        data: { recipientId, actorId, pageId, friendshipId, type },
    });
}

export async function notifyFriendRequest(friendshipId: string, senderId: string, receiverId: string) {
    return notify({
        recipientId: receiverId,
        actorId: senderId,
        friendshipId,
        type: NotificationType.FRIEND_REQUEST,
    });
}

export async function getTagRequestReviewers(tagId: number, excludeUserId?: string): Promise<string[]> {
    const rows = await prisma.$queryRaw<{ user_token: string }[]>`
        WITH tag_owner AS (
            SELECT owner_token AS user_token FROM tags WHERE id = ${tagId}
        ),
        direct_access AS (
            SELECT user_token FROM tag_permissions WHERE tag_id = ${tagId} AND can_review_requests = true
        ),
        member_access AS (
            SELECT tm.user_token
            FROM tag_members tm
            JOIN tag_roles tr ON tr.id = tm.role_id
            WHERE tm.tag_id = ${tagId} AND tr.can_review_requests = true
        ),
        org_access AS (
            SELECT om.user_token
            FROM org_tag_capability otc
            JOIN organization_members om ON om.organization_id = otc.org_id AND om.role_id = otc.role_id
            WHERE otc.tag_id = ${tagId} AND otc.can_review_requests = true
        )
        SELECT DISTINCT user_token FROM (
            SELECT user_token FROM tag_owner
            UNION ALL SELECT user_token FROM direct_access
            UNION ALL SELECT user_token FROM member_access
            UNION ALL SELECT user_token FROM org_access
        ) AS all_reviewers
        WHERE user_token IS NOT NULL;
    `;
    const tokens = rows.map((r) => r.user_token);
    return excludeUserId ? tokens.filter((t) => t !== excludeUserId) : tokens;
}

export async function notifyTagPageRequest(tagPageRequestId: number, tagId: number, requesterId: string): Promise<void> {
    const reviewers = await getTagRequestReviewers(tagId, requesterId);
    if (reviewers.length === 0) return;

    await prisma.notification.createMany({
        data: reviewers.map((recipientId) => ({
            recipientId,
            actorId: requesterId,
            tagPageRequestId,
            type: 'TAG_PAGE_REQUEST' as const,
        })),
    });
}

export async function getOrgTagGrantReviewers(orgId: number, excludeUserId?: string): Promise<string[]> {
    const rows = await prisma.$queryRaw<{ user_token: string }[]>`
        WITH org_owner AS (
            SELECT owner_token AS user_token FROM organizations WHERE id = ${orgId}
        ),
        member_access AS (
            SELECT om.user_token
            FROM organization_members om
            JOIN organization_roles orr ON orr.id = om.role_id
            WHERE om.organization_id = ${orgId} AND orr.can_manage_org_tag_grants = true
        )
        SELECT DISTINCT user_token FROM (
            SELECT user_token FROM org_owner
            UNION ALL SELECT user_token FROM member_access
        ) AS all_reviewers
        WHERE user_token IS NOT NULL;
    `;
    const tokens = rows.map((r) => r.user_token);
    return excludeUserId ? tokens.filter((t) => t !== excludeUserId) : tokens;
}

export async function getOrgPageGrantReviewers(orgId: number, excludeUserId?: string): Promise<string[]> {
    const rows = await prisma.$queryRaw<{ user_token: string }[]>`
        WITH org_owner AS (
            SELECT owner_token AS user_token FROM organizations WHERE id = ${orgId}
        ),
        member_access AS (
            SELECT om.user_token
            FROM organization_members om
            JOIN organization_roles orr ON orr.id = om.role_id
            WHERE om.organization_id = ${orgId} AND orr.can_manage_org_page_grants = true
        )
        SELECT DISTINCT user_token FROM (
            SELECT user_token FROM org_owner
            UNION ALL SELECT user_token FROM member_access
        ) AS all_reviewers
        WHERE user_token IS NOT NULL;
    `;
    const tokens = rows.map((r) => r.user_token);
    return excludeUserId ? tokens.filter((t) => t !== excludeUserId) : tokens;
}

export async function notifyOrgTagRequest(orgTagRequestId: number, orgId: number, requesterId: string): Promise<void> {
    const reviewers = await getOrgTagGrantReviewers(orgId, requesterId);
    if (reviewers.length === 0) return;

    await prisma.notification.createMany({
        data: reviewers.map((recipientId) => ({
            recipientId,
            actorId: requesterId,
            orgTagRequestId,
            type: 'ORG_TAG_REQUEST' as const,
        })),
    });
}

export async function notifyOrgPageRequest(orgPageRequestId: number, orgId: number, requesterId: string): Promise<void> {
    const reviewers = await getOrgPageGrantReviewers(orgId, requesterId);
    if (reviewers.length === 0) return;

    await prisma.notification.createMany({
        data: reviewers.map((recipientId) => ({
            recipientId,
            actorId: requesterId,
            orgPageRequestId,
            type: 'ORG_PAGE_REQUEST' as const,
        })),
    });
}