import React from 'react';
import { getUserOrgs } from '@/actions/orgs';
import OrgList from '@/components/orgs/OrgList';

export default async function OrgsPage() {
    const orgs = await getUserOrgs();

    const summaries = orgs.map(o => ({
        id: o.id,
        name: o.name,
        createdAt: o.createdAt?.toISOString(),
        isOwner: false,
    }));

    return (
        <main className="p-6 pt-20 min-h-screen">
            <header className="mb-6">
                <h1 className="text-2xl font-bold">My organizations</h1>
            </header>

            <section>
                <OrgList orgs={summaries} />
            </section>

            <section className="mt-6">
                <form action={async (formData: FormData) => {
                    'use server';
                    const name = String(formData.get('name') || '');
                    if (name.trim()) {
                        await (await import('@/actions/orgs')).createOrganization(name.trim());
                        // reload
                    }
                }}>
                    <input name="name" placeholder="Organization name" className="input" />
                    <button type="submit" className="btn">Create</button>
                </form>
            </section>
        </main>
    );
}