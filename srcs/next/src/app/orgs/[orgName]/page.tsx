
import React from 'react';
import { getOrganization } from '@/actions/orgs';
import { getTranslations } from 'next-intl/server';
import OrgDetails from '@/components/orgs/OrgDetails';

type Props = { params: Promise<{ orgName: string }> };

export default async function OrgPage({ params }: Props) {
    const { orgName }  = await params;
    const t = await getTranslations('Orgs');
    const org = await getOrganization(orgName);
    if (!org) return <div>{t('organizationNotFound')}</div>;

    return (
        <main className="p-6 pt-20 min-h-screen">
            <OrgDetails org={org} />
        </main>
    );
}