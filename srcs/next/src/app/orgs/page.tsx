import React from 'react';
import { getTranslations } from 'next-intl/server';
import { revalidatePath } from 'next/cache';
import { getUserOrgs } from '@/actions/orgs';
import OrgList from '@/components/orgs/OrgList';

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

                    <div>
                        <form
                            action={async (formData: FormData) => {
                                'use server';
                                const name = String(formData.get('name') || '');
                                if (name.trim()) {
                                    await (await import('@/actions/orgs')).createOrganization(name.trim());
                                    revalidatePath('/orgs');
                                }
                            }}
                            className="flex items-center gap-2"
                        >
                            <input
                                name="name"
                                placeholder={t('newOrganizationPlaceholder')}
                                className="border border-[#d9bfb7] bg-[#fffaf7] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d9bfb7]"
                            />
                            <button
                                type="submit"
                                className="inline-flex items-center bg-[#800000] px-3 py-1.5 text-sm font-medium text-[#fffaf7] hover:bg-[#5f0000]"
                            >
                                {t('newOrganization')}
                            </button>
                        </form>
                    </div>
                </header>
                <section>
                    <OrgList orgs={summaries} />
                </section>
            </div>
        </main>
    );
}
