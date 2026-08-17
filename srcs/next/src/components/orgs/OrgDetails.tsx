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
            <div className="max-w-6xl mx-auto">
                    <div className="bg-white border border-gray-200 rounded-md shadow-sm p-6">
                        <header className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-900">{org.name}</h1>
                                <p className="text-sm text-gray-500 mt-1">Created {org.createdAt?.toString() || '—'}</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/orgs/${encodeURIComponent(org.name)}/manage`}
                                    className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                >
                                    Manage organization
                                </Link>
                            </div>
                        </header>

            <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="col-span-1 md:col-span-2 space-y-6">
                            <div>
                                <h2 className="font-medium text-gray-900 mb-2">Roles</h2>
                                <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
                                    <ul className="space-y-2">
                                        {org.roles && org.roles.length > 0 ? (
                                            org.roles.map((r: any) => (
                                                    <li key={r.id} className="text-sm text-gray-800">
                                                            {r.roleName}
                                                        </li>
                                                ))
                                        ) : (
                                            <div className="text-sm text-gray-500">No role found</div>
                                        )}
                                    </ul>
                                </div>
                            </div>

                            <div>
                                <h2 className="font-medium text-gray-900 mb-2">Pages</h2>
                                {org.orgPageAccess && org.orgPageAccess.length > 0 ? (
                                    <ul className="space-y-2">
                                            {org.orgPageAccess.map((a: any) => {
                                                const page = a.page;
                                                const owner = page?.owner;
                                                const namespace = owner?.accountId || owner?.user_id || '';
                                                const pageLink = namespace ? `/wiki/${namespace}/${page.pageId}` : `/pages/${page.pageId}`;
                                                return (
                                                        <li
                                            key={page.pageId}
                                                        className="flex items-center justify-between border rounded p-3 bg-white"
                                                        >
                                                            <div>
                                                                    <div className="font-medium text-gray-900">{page.title || `Page #${page.pageId}`}</div>
                                                                    <div className="text-sm text-gray-500">Permissions: {a.permissions || '—'}</div>
                                                                </div>
                                                            <div className="flex gap-2">
                                                                    <Link href={pageLink} className="text-sm text-blue-600 hover:underline">
                                                                        View
                                                                    </Link>
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

                        <aside className="col-span-1 space-y-6">
                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                                {org.orgTagAccess && org.orgTagAccess.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                            {org.orgTagAccess.map((a: any) => {
                                                const tag = a.tag;
                                                return (
                                                        <Link
                                            key={tag.id}
                                                        href={`/tags/${encodeURIComponent(tag.name)}`}
                                                        className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-sm text-gray-700 hover:bg-gray-200"
                                                        >
                                                            #{tag.name}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                ) : (
                                    <div className="text-sm text-gray-500">No tag found</div>
                                )}
                            </div>

                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">Members</h3>
                                {org.members && org.members.length > 0 ? (
                                    <ul className="space-y-2">
                                            {org.members.map((m: any) => {
                                                const user = m.user;
                                                const profileId = user?.accountId || user?.user_id || `member-${m.id}`;
                                                return (
                                                        <li key={profileId} className="flex items-center justify-between">
                                                                <div>
                                                                    <Link href={`/users/${profileId}`} className="text-sm font-medium text-blue-600 hover:underline">
                                                                        {user?.username || profileId}
                                                                    </Link>
                                                                    <div className="text-xs text-gray-500">{m.role?.roleName || 'Member'}</div>
                                                                </div>
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
        </div>
    );
}