"use client";

import { useState, useEffect, useTransition, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
    addPagePermission, removePagePermission, searchUsersForPageAdd,
    getGrantableTagsAndOrgs, getPageRoleAccess,
    addTagRolePageAccess, removeTagRolePageAccess,
    addOrgRolePageAccess, removeOrgRolePageAccess,
} from '@/actions/pages';
import UserAvatar from '@/components/UserAvatar';

type SearchUser = {
    user_id: string;
    username: string | null;
    accountId: string;
    imgLink: string | null;
};

type PermissionEntry = {
    userToken: string;
    permissions: 'READ' | 'WRITE' | 'ADMIN';
    user: { user_id: string; username: string | null; accountId: string; imgLink: string | null };
};

type RoleOption = { id: number; roleName: string; hierarchyLevel: number };
type GrantableTag = { id: number; name: string; roles: RoleOption[] };
type GrantableOrg = { id: number; name: string; roles: RoleOption[] };

type TagAccessEntry = { tagId: number; minRoleId: number; permissions: string; tag: { name: string }; minRole: { roleName: string } };
type OrgAccessEntry = { orgId: number; minRoleId: number; permissions: string; organization: { name: string }; minRole: { roleName: string } };

type Props = {
    pageId: number;
    ownerAccountId: string;
    initialPermissions: PermissionEntry[];
};

type GrantMode = 'user' | 'tagRole' | 'orgRole';

export default function PagePermissions({ pageId, ownerAccountId, initialPermissions }: Props) {
    const t = useTranslations("Page.permissions");
    const tCommon = useTranslations("Common");

    const [mode, setMode] = useState<GrantMode>('user');

    // --- user mode state ---
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchUser[]>([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // --- shared level + data ---
    const [level, setLevel] = useState<'READ' | 'WRITE' | 'ADMIN'>('READ');
    const [permissions, setPermissions] = useState<PermissionEntry[]>(initialPermissions);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // --- tag/org role mode state ---
    const [grantableTags, setGrantableTags] = useState<GrantableTag[]>([]);
    const [grantableOrgs, setGrantableOrgs] = useState<GrantableOrg[]>([]);
    const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
    const [selectedTagRoleId, setSelectedTagRoleId] = useState<number | null>(null);
    const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
    const [selectedOrgRoleId, setSelectedOrgRoleId] = useState<number | null>(null);
    const [tagAccess, setTagAccess] = useState<TagAccessEntry[]>([]);
    const [orgAccess, setOrgAccess] = useState<OrgAccessEntry[]>([]);
    const [tagQuery, setTagQuery] = useState('');
    const [orgQuery, setOrgQuery] = useState('');

    useEffect(() => {
        (async () => {
            const [{ grantableTags, grantableOrgs }, { tagAccess, orgAccess }] = await Promise.all([
                getGrantableTagsAndOrgs(pageId),
                getPageRoleAccess(pageId),
            ]);
            setGrantableTags(grantableTags);
            setGrantableOrgs(grantableOrgs);
            setTagAccess(tagAccess as any);
            setOrgAccess(orgAccess as any);
        })();
    }, [pageId]);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (mode !== 'user' || query.trim().length < 2) {
            setResults([]);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const users = await searchUsersForPageAdd(query);
                setResults(users);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, mode]);

    function handleAdd(accountId: string) {
        setError(null);
        startTransition(async () => {
            try {
                const result = await addPagePermission(pageId, accountId, level);
                setPermissions((prev) => {
                    const withoutExisting = prev.filter((p) => p.userToken !== result.userToken);
                    return [...withoutExisting, result as PermissionEntry];
                });
                setQuery('');
                setResults([]);
            } catch (e: any) {
                setError(e.message || t("addFailed"));
            }
        });
    }

    function handleRemove(userToken: string) {
        setError(null);
        startTransition(async () => {
            try {
                await removePagePermission(pageId, userToken);
                setPermissions((prev) => prev.filter((p) => p.userToken !== userToken));
            } catch (e: any) {
                setError(e.message || t("removeFailed"));
            }
        });
    }

    function handleAddTagRole() {
        if (!selectedTagId || !selectedTagRoleId) return;
        setError(null);
        startTransition(async () => {
            try {
                const result = await addTagRolePageAccess(pageId, selectedTagId, selectedTagRoleId, level);
                setTagAccess((prev) => [...prev.filter(a => a.tagId !== selectedTagId), result as any]);
            } catch (e: any) {
                setError(e.message || t("addFailed"));
            }
        });
    }

    function handleRemoveTagRole(tagId: number) {
        setError(null);
        startTransition(async () => {
            try {
                await removeTagRolePageAccess(pageId, tagId);
                setTagAccess((prev) => prev.filter(a => a.tagId !== tagId));
            } catch (e: any) {
                setError(e.message || t("removeFailed"));
            }
        });
    }

    function handleAddOrgRole() {
        if (!selectedOrgId || !selectedOrgRoleId) return;
        setError(null);
        startTransition(async () => {
            try {
                const result = await addOrgRolePageAccess(pageId, selectedOrgId, selectedOrgRoleId, level);
                if ('request' in result && result.request) {
                    setError(t("requestSent"));
                    return;
                }
                setOrgAccess((prev) => [...prev.filter(a => a.orgId !== selectedOrgId), result as any]);
            } catch (e: any) {
                setError(e.message || t("addFailed"));
            }
        });
    }

    function handleRemoveOrgRole(orgId: number) {
        setError(null);
        startTransition(async () => {
            try {
                await removeOrgRolePageAccess(pageId, orgId);
                setOrgAccess((prev) => prev.filter(a => a.orgId !== orgId));
            } catch (e: any) {
                setError(e.message || t("removeFailed"));
            }
        });
    }

    const currentTagRoles = grantableTags.find(tag => tag.id === selectedTagId)?.roles ?? [];
    const currentOrgRoles = grantableOrgs.find(org => org.id === selectedOrgId)?.roles ?? [];
    const filteredTags = grantableTags.filter(tag => tag.name.toLowerCase().includes(tagQuery.trim().toLowerCase()));
    const filteredOrgs = grantableOrgs.filter(org => org.name.toLowerCase().includes(orgQuery.trim().toLowerCase()));

    return (
        <div className="w-full min-w-0 overflow-hidden rounded-lg border bg-gray-50 p-3">
            <div className="text-xs font-semibold text-gray-500 mb-2">{t("title")}</div>

            {error && (
                <div className="mb-2 p-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded">
                    {error}
                </div>
            )}

            <div className="mb-2 flex min-w-0 flex-col gap-2 sm:flex-row">
                <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as GrantMode)}
                    className="w-full min-w-0 border rounded px-2 py-1.5 text-sm bg-white sm:w-auto"
                >
                    <option value="user">{t("byUser")}</option>
                    <option value="tagRole">{t("byTagRole")}</option>
                    <option value="orgRole">{t("byOrgRole")}</option>
                </select>
                <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as 'READ' | 'WRITE' | 'ADMIN')}
                    className="w-full min-w-0 border rounded px-2 py-1.5 text-sm bg-white sm:w-auto"
                >
                    <option value="READ">{t("levelRead")}</option>
                    <option value="WRITE">{t("levelWrite")}</option>
                    <option value="ADMIN">{t("levelAdmin")}</option>
                </select>
            </div>

            {mode === 'user' && (
                <>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t("searchPlaceholder")}
                            className="flex-1 min-w-0 border rounded px-2 py-1.5 text-sm bg-white truncate"
                        />
                    </div>

                    {loading && <p className="text-xs text-gray-400 px-1">{tCommon("searching")}</p>}

                    {results.length > 0 && (
                        <div className="mb-2 divide-y overflow-hidden rounded border bg-white">
                            {results.map(u => (
                                <div key={u.user_id} className="flex min-w-0 flex-col gap-2 p-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <UserAvatar accountId={u.accountId} imgLink={u.imgLink} alt={u.username || u.accountId} size={24} className="h-6 w-6" />
                                        <div className="min-w-0">
                                            <p className="break-words text-sm font-medium leading-tight">{u.username}</p>
                                            <p className="break-words text-xs text-gray-400 leading-tight">@{u.accountId}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAdd(u.accountId)}
                                        disabled={isPending}
                                        className="text-xs bg-[#800000] hover:bg-[#5f0000] disabled:opacity-40 disabled:cursor-not-allowed text-[#fffaf7] px-2.5 py-1 rounded"
                                    >
                                        {t("add")}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {mode === 'tagRole' && (
                <div className="mb-2 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="relative">
                        <input value={selectedTagId ? grantableTags.find(tag => tag.id === selectedTagId)?.name ?? '' : tagQuery} onChange={(e) => { setSelectedTagId(null); setSelectedTagRoleId(null); setTagQuery(e.target.value); }} placeholder={t("searchTag")} className="w-full min-w-0 border rounded px-2 py-1.5 text-sm bg-white" />
                        {!selectedTagId && tagQuery.trim() && <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto border rounded bg-white shadow">{filteredTags.map(tag => <button type="button" key={tag.id} onClick={() => { setSelectedTagId(tag.id); setTagQuery(''); setSelectedTagRoleId(null); }} className="block w-full px-2 py-1.5 text-left text-sm hover:bg-gray-100">#{tag.name}</button>)}</div>}
                    </div>
                    <select
                        value={selectedTagRoleId ?? ''}
                        onChange={(e) => setSelectedTagRoleId(Number(e.target.value) || null)}
                        disabled={!selectedTagId}
                        className="w-full min-w-0 border rounded px-2 py-1.5 text-sm bg-white disabled:opacity-50 truncate"
                    >
                        <option value="">{t("selectRole")}</option>
                        {currentTagRoles.map(role => (
                            <option key={role.id} value={role.id}>{role.roleName}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleAddTagRole}
                        disabled={isPending || !selectedTagId || !selectedTagRoleId}
                        className="text-xs bg-[#800000] hover:bg-[#5f0000] disabled:opacity-40 disabled:cursor-not-allowed text-[#fffaf7] px-2.5 py-1.5 rounded sm:col-span-2"
                    >
                        {t("add")}
                    </button>
                </div>
            )}

            {mode === 'orgRole' && (
                <div className="mb-2 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="relative">
                        <input value={selectedOrgId ? grantableOrgs.find(org => org.id === selectedOrgId)?.name ?? '' : orgQuery} onChange={(e) => { setSelectedOrgId(null); setSelectedOrgRoleId(null); setOrgQuery(e.target.value); }} placeholder={t("searchOrganization")} className="w-full min-w-0 border rounded px-2 py-1.5 text-sm bg-white" />
                        {!selectedOrgId && orgQuery.trim() && <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto border rounded bg-white shadow">{filteredOrgs.map(org => <button type="button" key={org.id} onClick={() => { setSelectedOrgId(org.id); setOrgQuery(''); setSelectedOrgRoleId(null); }} className="block w-full px-2 py-1.5 text-left text-sm hover:bg-gray-100">{org.name}</button>)}</div>}
                    </div>
                    <select
                        value={selectedOrgRoleId ?? ''}
                        onChange={(e) => setSelectedOrgRoleId(Number(e.target.value) || null)}
                        disabled={!selectedOrgId}
                        className="w-full min-w-0 border rounded px-2 py-1.5 text-sm bg-white disabled:opacity-50 truncate"
                    >
                        <option value="">{t("selectRole")}</option>
                        {currentOrgRoles.map(role => (
                            <option key={role.id} value={role.id}>{role.roleName}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleAddOrgRole}
                        disabled={isPending || !selectedOrgId || !selectedOrgRoleId}
                        className="text-xs bg-[#800000] hover:bg-[#5f0000] disabled:opacity-40 disabled:cursor-not-allowed text-[#fffaf7] px-2.5 py-1.5 rounded sm:col-span-2"
                    >
                        {t("add")}
                    </button>
                </div>
            )}

            <div className="divide-y border rounded bg-white mb-3">
                <div className="flex min-w-0 flex-col gap-1 bg-gray-50 p-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="break-words text-sm font-medium">@{ownerAccountId}</span>
                    <span className="text-xs text-gray-400">{t("owner")}</span>
                </div>
                {permissions.length === 0 ? (
                    <p className="text-xs text-gray-400 px-1 py-2">{t("noPermissionsYet")}</p>
                ) : (
                    permissions.map((p) => (
                        <div key={p.userToken} className="flex min-w-0 flex-col gap-2 p-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-2">
                                <UserAvatar accountId={p.user.accountId} imgLink={p.user.imgLink} alt={p.user.username || p.user.accountId} size={24} className="h-6 w-6" />
                                <div className="min-w-0">
                                    <p className="break-words text-sm font-medium leading-tight">{p.user.username}</p>
                                    <p className="break-words text-xs text-gray-400 leading-tight">@{p.user.accountId}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                                <span className="text-xs text-gray-500">
                                    {p.permissions === 'READ' ? t("levelRead") : p.permissions === 'WRITE' ? t("levelWrite") : t("levelAdmin")}
                                </span>
                                <button
                                    onClick={() => handleRemove(p.userToken)}
                                    disabled={isPending}
                                    className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
                                >
                                    {t("remove")}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {tagAccess.length > 0 && (
                <>
                    <div className="text-xs font-semibold text-gray-500 mb-1">{t("tagAccessList")}</div>
                    <div className="divide-y border rounded bg-white mb-3">
                        {tagAccess.map((a) => (
                            <div key={a.tagId} className="flex min-w-0 flex-col gap-2 p-2 sm:flex-row sm:items-center sm:justify-between">
                                <p className="min-w-0 break-words text-sm">
                                    <span className="font-medium break-words">{a.tag.name}</span>
                                    <span className="text-gray-400"> · {a.minRole.roleName}+</span>
                                </p>
                                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                                    <span className="text-xs text-gray-500">
                                        {a.permissions === 'READ' ? t("levelRead") : a.permissions === 'WRITE' ? t("levelWrite") : t("levelAdmin")}
                                    </span>
                                    <button
                                        onClick={() => handleRemoveTagRole(a.tagId)}
                                        disabled={isPending}
                                        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
                                    >
                                        {t("remove")}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {orgAccess.length > 0 && (
                <>
                    <div className="text-xs font-semibold text-gray-500 mb-1">{t("orgAccessList")}</div>
                    <div className="divide-y border rounded bg-white">
                        {orgAccess.map((a) => (
                            <div key={a.orgId} className="flex min-w-0 flex-col gap-2 p-2 sm:flex-row sm:items-center sm:justify-between">
                                <p className="min-w-0 break-words text-sm">
                                    <span className="font-medium break-words">{a.organization.name}</span>
                                    <span className="text-gray-400"> · {a.minRole.roleName}+</span>
                                </p>
                                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                                    <span className="text-xs text-gray-500">
                                        {a.permissions === 'READ' ? t("levelRead") : a.permissions === 'WRITE' ? t("levelWrite") : t("levelAdmin")}
                                    </span>
                                    <button
                                        onClick={() => handleRemoveOrgRole(a.orgId)}
                                        disabled={isPending}
                                        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
                                    >
                                        {t("remove")}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}