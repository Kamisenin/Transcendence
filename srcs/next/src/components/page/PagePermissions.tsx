"use client";

import { useState, useEffect, useTransition, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
    addPagePermission, removePagePermission, searchUsersForPageAdd,
    getGrantableTagsAndOrgs, getPageRoleAccess,
    addTagRolePageAccess, removeTagRolePageAccess,
    addOrgRolePageAccess, removeOrgRolePageAccess,
} from '@/actions/pages';

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

    useEffect(() => {
        (async () => {
            const [{ grantableTags, grantableOrgs }, { tagAccess, orgAccess }] = await Promise.all([
                getGrantableTagsAndOrgs(),
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

    return (
        <div className="border rounded-lg p-3 bg-gray-50">
            <div className="text-xs font-semibold text-gray-500 mb-2">{t("title")}</div>

            {error && (
                <div className="mb-2 p-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded">
                    {error}
                </div>
            )}

            <div className="flex gap-2 mb-2">
                <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as GrantMode)}
                    className="border rounded px-2 py-1.5 text-sm bg-white"
                >
                    <option value="user">{t("byUser")}</option>
                    <option value="tagRole">{t("byTagRole")}</option>
                    <option value="orgRole">{t("byOrgRole")}</option>
                </select>
                <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as 'READ' | 'WRITE' | 'ADMIN')}
                    className="border rounded px-2 py-1.5 text-sm bg-white"
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
                        <div className="divide-y border rounded bg-white mb-2">
                            {results.map(u => (
                                <div key={u.user_id} className="flex items-center justify-between p-2">
                                    <div className="flex items-center gap-2">
                                        <img
                                            src={u.imgLink || '/default-avatar.png'}
                                            alt=""
                                            className="w-6 h-6 rounded-full bg-gray-200"
                                        />
                                        <div>
                                            <p className="text-sm font-medium leading-tight">{u.username}</p>
                                            <p className="text-xs text-gray-400 leading-tight">@{u.accountId}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAdd(u.accountId)}
                                        disabled={isPending}
                                        className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-2.5 py-1 rounded"
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
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <select
                        value={selectedTagId ?? ''}
                        onChange={(e) => { setSelectedTagId(Number(e.target.value) || null); setSelectedTagRoleId(null); }}
                        className="w-full min-w-0 border rounded px-2 py-1.5 text-sm bg-white truncate"
                    >
                        <option value="">{grantableTags.length ? t("selectTag") : t("noTagsAvailable")}</option>
                        {grantableTags.map(tag => (
                            <option key={tag.id} value={tag.id}>{tag.name}</option>
                        ))}
                    </select>
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
                        className="col-span-2 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-2.5 py-1.5 rounded"
                    >
                        {t("add")}
                    </button>
                </div>
            )}

            {mode === 'orgRole' && (
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <select
                        value={selectedOrgId ?? ''}
                        onChange={(e) => { setSelectedOrgId(Number(e.target.value) || null); setSelectedOrgRoleId(null); }}
                        className="w-full min-w-0 border rounded px-2 py-1.5 text-sm bg-white truncate"
                    >
                        <option value="">{grantableOrgs.length ? t("selectOrgLabel") : t("noOrgsAvailable")}</option>
                        {grantableOrgs.map(org => (
                            <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                    </select>
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
                        className="col-span-2 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-2.5 py-1.5 rounded"
                    >
                        {t("add")}
                    </button>
                </div>
            )}

            <div className="divide-y border rounded bg-white mb-3">
                <div className="flex items-center justify-between p-2 bg-gray-50">
                    <span className="text-sm font-medium">@{ownerAccountId}</span>
                    <span className="text-xs text-gray-400">{t("owner")}</span>
                </div>
                {permissions.length === 0 ? (
                    <p className="text-xs text-gray-400 px-1 py-2">{t("noPermissionsYet")}</p>
                ) : (
                    permissions.map((p) => (
                        <div key={p.userToken} className="flex items-center justify-between p-2">
                            <div className="flex items-center gap-2">
                                <img
                                    src={p.user.imgLink || '/default-avatar.png'}
                                    alt=""
                                    className="w-6 h-6 rounded-full bg-gray-200"
                                />
                                <div>
                                    <p className="text-sm font-medium leading-tight">{p.user.username}</p>
                                    <p className="text-xs text-gray-400 leading-tight">@{p.user.accountId}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
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
                            <div key={a.tagId} className="flex items-center justify-between p-2">
                                <p className="text-sm">
                                    <span className="font-medium">{a.tag.name}</span>
                                    <span className="text-gray-400"> · {a.minRole.roleName}+</span>
                                </p>
                                <div className="flex items-center gap-2">
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
                            <div key={a.orgId} className="flex items-center justify-between p-2">
                                <p className="text-sm">
                                    <span className="font-medium">{a.organization.name}</span>
                                    <span className="text-gray-400"> · {a.minRole.roleName}+</span>
                                </p>
                                <div className="flex items-center gap-2">
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