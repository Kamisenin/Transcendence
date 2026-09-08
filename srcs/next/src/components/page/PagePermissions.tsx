"use client";

import { useState, useEffect, useTransition, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { addPagePermission, removePagePermission, searchUsersForPageAdd } from '@/actions/pages';

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

type Props = {
    pageId: number;
    ownerAccountId: string;
    initialPermissions: PermissionEntry[];
};

export default function PagePermissions({ pageId, ownerAccountId, initialPermissions }: Props) {
    const t = useTranslations("Page.permissions");
    const tCommon = useTranslations("Common");

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [level, setLevel] = useState<'READ' | 'WRITE' | 'ADMIN'>('READ');
    const [permissions, setPermissions] = useState<PermissionEntry[]>(initialPermissions);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query.trim().length < 2) {
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
    }, [query]);

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

    return (
        <div className="border rounded-lg p-3 bg-gray-50">
            <div className="text-xs font-semibold text-gray-500 mb-2">{t("title")}</div>

            {error && (
                <div className="mb-2 p-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded">
                    {error}
                </div>
            )}

            <div className="flex gap-2 mb-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    className="flex-1 border rounded px-2 py-1.5 text-sm bg-white"
                />
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

            <div className="divide-y border rounded bg-white">
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
        </div>
    );
}