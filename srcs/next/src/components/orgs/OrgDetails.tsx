import React from 'react';
import Link from 'next/link';
import type { Organization } from '@prisma/client';

type OrgWithAccess = Organization & {
    members?: Array<any>;
    roles?: Array<any>;
    orgTagAccess?: Array<{ tag: any; minRole?: any; permissions?: any }>;
    orgPageAccess?: Array<{ page: any; minRole?: any; permissions?: any }>;
};

export default function OrgDetails({ org }: { org: OrgWithAccess }) {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold">{org.name}</h1>
                <p className="text-sm text-gray-500">Created at {org.createdAt?.toString()}</p>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 md:col-span-2">
                    <h2 className="font-semibold mb-2">Rôles</h2>
                    <ul className="list-disc pl-6">
                        {org.roles?.map((r: any) => <li key={r.id}>{r.roleName}</li>)}
                        {!org.roles?.length && <li className="text-sm text-gray-500">No role found</li>}
                    </ul>

                    <div className="mt-6">
                        <h2 className="font-semibold mb-2">Pages</h2>
                        {org.orgPageAccess && org.orgPageAccess.length > 0 ? (
                            <ul className="space-y-2">
                                {org.orgPageAccess.map((a: any) => {
                                    const page = a.page;
                                    const owner = page?.owner;
                                    const namespace = owner?.accountId || owner?.user_id || '';
                                    const pageLink = namespace ? `/wiki/${namespace}/${page.pageId}` : `/pages/${page.pageId}`;
                                    return (
                                        <li key={page.pageId} className="flex items-center justify-between border rounded p-3">
                                            <div>
                                                <div className="font-medium">{page.title || `Page #${page.pageId}`}</div>
                                                <div className="text-sm text-gray-500">Permissions: {a.permissions || '—'}</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Link href={pageLink} className="text-sm text-blue-600 hover:underline">View</Link>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="text-sm text-gray-500">No page found</div>
                        )}
                    </div>
                </div>

                <aside className="col-span-1">
                    <h2 className="font-semibold mb-2">Tags</h2>
                    {org.orgTagAccess && org.orgTagAccess.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {org.orgTagAccess.map((a: any) => {
                                const tag = a.tag;
                                return (
                                    <Link key={tag.id} href={`/tags/${encodeURIComponent(tag.name)}`} className="px-2 py-1 rounded bg-gray-100 text-sm hover:bg-gray-200">
                                        #{tag.name}
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500">No tag found</div>
                    )}

                    <div className="mt-6">
                        <h2 className="font-semibold mb-2">Members</h2>
                        {org.members && org.members.length > 0 ? (
                            <ul className="list-disc pl-6">
                                {org.members.map((m: any) => {
                                    const user = m.user;
                                    const profileId = user?.accountId || user?.user_id;
                                    return (
                                        <li key={profileId} className="mb-1">
                                            <Link href={`/users/${profileId}`} className="text-blue-600 hover:underline">
                                                {user?.username || profileId}
                                            </Link>
                                            <span className="text-sm text-gray-500"> — {m.role?.roleName || 'Member'}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="text-sm text-gray-500">No member found</div>
                        )}
                    </div>
                </aside>
            </section>
        </div>
    );
}