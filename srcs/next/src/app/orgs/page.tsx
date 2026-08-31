import React from 'react';
import { revalidatePath } from 'next/cache';
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
        <main className="min-h-screen bg-gray-50 p-6 pt-20">
            <div className="max-w-6xl mx-auto">
                <header className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">My organizations</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage your organizations and access controls</p>
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
                                placeholder="New organization"
                                className="px-3 py-1.5 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                            <button
                                type="submit"
                                className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Create
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
