import React from 'react';
import { getOrganization, userHasOrgPermission } from '@/actions/orgs';
import dynamic from 'next/dynamic';

type Props = { params: Promise<{ orgName: string }> };

const OrgManageClient = dynamic(() => import('@/components/orgs/OrgManage').then(m => m.default), { ssr: false });

export default async function OrgManagePage({ params }: Props) {
    const { orgName }  = await params;
    const org = await getOrganization(orgName);
    if (!org) return <div>Organization not found</div>;

    const canManage = await userHasOrgPermission(org.id, "canManageMembers") || org.ownerToken === (await (await import('%/lib/session')).getSessionUser((await import('%/lib/session')).getSessionCookie()));

    return (
        <main className="p-6 pt-20 min-h-screen">
            <OrgManageClient org={org} canManage={Boolean(canManage)} />
        </main>
    );
}