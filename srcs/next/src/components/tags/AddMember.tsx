"use client";

import { useState, useEffect, useTransition, useRef } from 'react';
import { addTagMember } from '@/actions/tags';
import { useTranslations } from 'next-intl';
import UserAvatar from '@/components/UserAvatar';

type SearchUser = {
    user_id: string;
    username: string | null;
    accountId: string;
    imgLink: string | null;
};

type Role = {
    id: number;
    roleName: string;
    hierarchyLevel: number;
};

type Props = {
    tagId: number;
    assignableRoles: Role[];
    existingMemberTokens: string[];
    onAdded?: () => void;
};

export default function AddMember({ tagId, assignableRoles, existingMemberTokens, onAdded }: Props) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(assignableRoles[0]?.id ?? null);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const t = useTranslations("Tags.members")
    const tTags = useTranslations("Tags")
    const tCommon = useTranslations("Common")

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query.trim().length < 2) {
            setResults([]);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setResults(data.users ?? []);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    function handleAdd(userToken: string) {
        if (!selectedRoleId) return;
        setError(null);
        startTransition(async () => {
            try {
                await addTagMember(tagId, userToken, selectedRoleId);
                setQuery('');
                setResults([]);
                onAdded?.();
            } catch (e: any) {
                setError(e.message);
            }
        });
    }

    if (assignableRoles.length === 0) {
        return (
            <p className="text-sm text-[#8a6b63]">
                {tTags("noRoleAvailable")}
            </p>
        );
    }

    return (
        <div className="rounded-lg border border-[#d9bfb7] bg-[#f7e9e2] p-3">
            {error && (
                <div className="mb-2 rounded-md border border-[#e6b8b0] bg-[#fff1ef] p-2 text-xs text-[#a33a2b]">
                    {error}
                </div>
            )}

            <div className="flex gap-2 mb-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    className="flex-1 rounded-md border border-[#d9bfb7] bg-[#fffaf7] px-2 py-1.5 text-sm outline-none focus:border-[#800000]"
                />
                <select
                    value={selectedRoleId ?? ''}
                    onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                    className="rounded-md border border-[#d9bfb7] bg-[#fffaf7] px-2 py-1.5 text-sm outline-none focus:border-[#800000]"
                >
                    {assignableRoles.map(r => (
                        <option key={r.id} value={r.id}>{r.roleName}</option>
                    ))}
                </select>
            </div>

            {loading && <p className="px-1 text-xs text-[#a89088]">{tCommon("searching")}</p>}

            {results.length > 0 && (
                <div className="divide-y divide-[#ead7d0] overflow-hidden rounded-md border border-[#d9bfb7] bg-[#fffaf7]">
                    {results.map(u => {
                        const alreadyMember = existingMemberTokens.includes(u.user_id);
                        return (
                            <div key={u.user_id} className="flex items-center justify-between p-2">
                                <div className="flex items-center gap-2">
                                    <UserAvatar accountId={u.accountId} imgLink={u.imgLink} alt={u.username || u.accountId} size={24} className="h-6 w-6" />
                                    <div>
                                        <p className="text-sm font-medium leading-tight">{u.username}</p>
                                        <p className="text-xs leading-tight text-[#a89088]">@{u.accountId}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleAdd(u.user_id)}
                                    disabled={isPending || alreadyMember}
                                    className="rounded-md bg-[#800000] px-2.5 py-1 text-xs font-semibold text-[#fffaf7] transition hover:bg-[#5f0000] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {alreadyMember ? t("alreadyMember") : t("add")}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && query.trim().length >= 2 && results.length === 0 && (
                <p className="px-1 text-xs text-[#a89088]">{t("noMemberFound")}</p>
            )}
        </div>
    );
}