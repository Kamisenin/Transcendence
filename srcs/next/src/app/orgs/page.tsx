import React from 'react';
import { getTranslations } from 'next-intl/server';
import { getUserOrgs } from '@/actions/orgs';
import OrgList from '@/components/orgs/OrgList';
import OrganizationCreateForm from '@/components/orgs/OrganizationCreateForm';

export default async function OrgsPage() {
    const orgs = await getUserOrgs();
    const t = await getTranslations('Orgs');

    const summaries = orgs.map(o => ({
        id: o.id,
        name: o.name,
        createdAt: o.createdAt?.toISOString(),
        isOwner: false,
    }));

    return (
        <main className="min-h-screen bg-[#f0e0d6] p-6 pt-20">
            <div className="max-w-6xl mx-auto">
                <header className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-[#800000]">{t('myOrganizations')}</h1>
                        <p className="mt-1 text-sm text-[#8a6b63]">{t('manageDescription')}</p>
                    </div>

                    <OrganizationCreateForm />
                </header>
                <section>
                    <OrgList orgs={summaries} />
                </section>
            </div>
        </main>
    );
}
