
import React from 'react';
import { getOrganization } from '@/actions/orgs';
import OrgDetails from '@/components/orgs/OrgDetails';

type Props = { params: Promise<{ orgName: string }> };

export default async function OrgPage({ params }: Props) {
    const { orgName }  = await params;
    const org = await getOrganization(orgName);
    if (!org) return <div>Organization not found</div>;

    return (
        <main className="p-6 pt-20 min-h-screen">
            <OrgDetails org={org} />
        </main>
    );
}