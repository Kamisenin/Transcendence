
import React from 'react';
import { getOrganization, userHasOrgPermission } from '@/actions/orgs';
import { getTranslations } from 'next-intl/server';
import OrgDetails from '@/components/orgs/OrgDetails';
import { getSessionCookie, getSessionUser } from "%/lib/session";
import { getFriends } from "@/actions/friendship";

type Props = { params: Promise<{ orgName: string }> };

export default async function OrgPage({ params }: Props) {
    const { orgName }  = await params;
    const t = await getTranslations('Orgs');
    const org = await getOrganization(orgName);
    if (!org) return <div>{t('organizationNotFound')}</div>;

    const sessionUser = await getSessionUser(await getSessionCookie());
    const canManage = await userHasOrgPermission(org.id, "canManageMembers", sessionUser);
    const friendIds = sessionUser
        ? (await getFriends(sessionUser.user_id)).map((friendship) =>
            friendship.senderId === sessionUser.user_id ? friendship.receiverId : friendship.senderId
        )
        : [];

    return (
        <main className="min-h-screen bg-[#f0e0d6] p-4 pt-20 sm:p-6 sm:pt-20">
            <OrgDetails org={org} canManage={canManage} friendIds={friendIds} />
        </main>
    );
}