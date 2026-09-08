import React from 'react';
import Link from 'next/link';
import UserAvatar from '@/components/UserAvatar';
import { isUserOnline } from '@/components/user/profile-utils';
import { useTranslations } from 'next-intl';
import type { Organization } from '@prisma/client';
import { isDefaultTitle } from '@/app/lib/page/title';

    type OrgWithAccess = Organization & {
    members?: Array<{ id?: number; user?: { accountId?: string; user_id?: string; username?: string | null; firstName?: string | null; lastName?: string | null; imgLink?: string | null; lastSeen?: Date | null }; role?: { roleName?: string } }>;
    roles?: Array<{ id: number; roleName: string }>;
    orgTagAccess?: Array<{ tag: { id: number; name: string }; minRole?: unknown; permissions?: string }>;
    orgPageAccess?: Array<{ page: { pageId: number; title?: string | null; owner?: { accountId?: string; user_id?: string } }; minRole?: unknown; permissions?: string }>;
};

export default function OrgDetails({ org, canManage, friendIds = [] }: { org: OrgWithAccess; canManage: boolean; friendIds?: string[] }) {
    const t = useTranslations('Orgs');
    const createdDate = org.createdAt ? new Date(org.createdAt).toLocaleDateString() : '—';

    return (
            <div className="mx-auto max-w-6xl">
                    <div className="border border-[#d9bfb7] border-t-4 border-t-[#800000] bg-[#fffaf7] p-4 shadow-[0_2px_10px_rgba(128,0,0,0.08)] sm:p-6">
                        <header className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                            <div>
                                <h1 className="text-2xl font-semibold text-[#800000]">{org.name}</h1>
                                <p className="mt-1 text-sm text-[#8a6b63]">{t('created', { date: createdDate })}</p>
                            </div>

                            {canManage && (
                                <Link
                                    href={`/orgs/${encodeURIComponent(org.name)}/manage`}
                                    className="inline-flex items-center border border-[#800000] px-3 py-1.5 text-sm font-medium text-[#800000] hover:bg-[#f7e9e2]"
                                >
                                    {t('manageOrganization')}
                                </Link>
                            )}
                        </header>

            <section className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="col-span-1 md:col-span-2 space-y-6">
                            <div>
                                <h2 className="mb-2 font-medium text-[#3f2924]">{t('roles')}</h2>
                                <div className="border border-[#ead7d0] bg-[#f7e9e2] p-3">
                                    <ul className="space-y-2">
                                        {org.roles && org.roles.length > 0 ? (
                                            org.roles.map((r) => (
                                                    <li key={r.id} className="text-sm text-[#3f2924]">
                                                            {r.roleName}
                                                        </li>
                                                ))
                                        ) : (
                                            <div className="text-sm text-[#8a6b63]">{t('noRoleFound')}</div>
                                        )}
                                    </ul>
                                </div>
                            </div>

                            <div>
                                <h2 className="mb-2 font-medium text-[#3f2924]">{t('pages')}</h2>
                                {org.orgPageAccess && org.orgPageAccess.length > 0 ? (
                                    <ul className="space-y-2">
                                            {org.orgPageAccess.map((a) => {
                                                const page = a.page;
                                                const owner = page?.owner;
                                                const namespace = owner?.accountId || owner?.user_id || '';
                                                const pageLink = namespace ? `/wiki/${namespace}/${page.pageId}` : `/pages/${page.pageId}`;
                                                return (
                                                        <li
                                            key={page.pageId}
                                                        className="flex items-center justify-between border border-[#ead7d0] bg-[#fffaf7] p-3"
                                                        >
                                                            <div>
                                                                    <div className="font-medium text-[#3f2924]">{!isDefaultTitle(page.title) ? page.title : `Page #${page.pageId}`}</div>
                                                                    <div className="text-sm text-[#8a6b63]">{t('permissionsLabel')}: {a.permissions || '—'}</div>
                                                                </div>
                                                            <div className="flex gap-2">
                                                                    <Link href={pageLink} className="text-sm text-[#800000] hover:underline">
                                                                        {t('view')}
                                                                    </Link>
                                                                </div>
                                                        </li>
                                                );
                                            })}
                                        </ul>
                                ) : (
                                    <div className="text-sm text-[#8a6b63]">{t('noPageFound')}</div>
                                )}
                            </div>
                        </div>

                        <aside className="col-span-1 space-y-6">
                            <div>
                                <h3 className="mb-2 font-medium text-[#3f2924]">{t('tags')}</h3>
                                {org.orgTagAccess && org.orgTagAccess.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                            {org.orgTagAccess.map((a) => {
                                                const tag = a.tag;
                                                return (
                                                        <Link
                                            key={tag.id}
                                                        href={`/tags/${encodeURIComponent(tag.name)}`}
                                                        className="inline-flex items-center border border-[#d9bfb7] bg-[#f7e9e2] px-2 py-1 text-sm text-[#800000] hover:bg-[#ead7d0]"
                                                        >
                                                            #{tag.name}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                ) : (
                                    <div className="text-sm text-[#8a6b63]">{t('noTagFound')}</div>
                                )}
                            </div>

                            <div>
                                <h3 className="mb-2 font-medium text-[#3f2924]">{t('members')}</h3>
                                {org.members && org.members.length > 0 ? (
                                    <ul className="space-y-2">
                                            {org.members.map((m) => {
                                                const user = m.user;
                                                const profileId = user?.accountId || user?.user_id || `member-${m.id}`;
                                                const isOnline = isUserOnline(user?.lastSeen);
                                                const isFriend = Boolean(user?.user_id && friendIds.includes(user.user_id));
                                                const displayName = isFriend && user?.firstName && user?.lastName
                                                    ? `${user.firstName} ${user.lastName}`
                                                    : user?.username || profileId;
                                                return (
                                                        <li key={profileId}>
                                                            <Link
                                                                href={`/wiki/${encodeURIComponent(profileId)}`}
                                                                className="flex items-center gap-3 border border-[#ead7d0] bg-[#fffaf7] p-2 transition-colors hover:border-[#800000] hover:bg-[#f7e9e2]"
                                                            >
                                                                <div className="relative shrink-0">
                                                                    <UserAvatar
                                                                        accountId={profileId}
                                                                        imgLink={user?.imgLink}
                                                                        alt={displayName}
                                                                        size={40}
                                                                        className="h-10 w-10"
                                                                    />
                                                                    <span
                                                                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#fffaf7] ${
                                                                            isOnline ? "bg-[#4f8f52]" : "bg-[#a89088]"
                                                                        }`}
                                                                    />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="truncate text-sm font-medium text-[#800000]">
                                                                        {displayName}
                                                                    </div>
                                                                    <div className="truncate text-xs text-[#8a6b63]">
                                                                        @{profileId} · {m.role?.roleName || t('member')}
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                            </li>
                                                    );
                                            })}
                                        </ul>
                                ) : (
                                    <div className="text-sm text-[#8a6b63]">{t('noMemberFound')}</div>
                                )}
                            </div>
                        </aside>
                    </section>
        </div>
        </div>
    );
}