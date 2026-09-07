"use client";

import { useState, useEffect, useTransition, useRef } from 'react';
import { addTagMember } from '@/actions/tags';

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
            <p className="text-sm text-gray-400">
                Aucun rôle disponible à assigner (crée d'abord un rôle inférieur à ton rang).
            </p>
        );
    }

    return (
        <div className="border rounded-lg p-3 bg-gray-50">
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
                    placeholder="Rechercher par pseudo ou identifiant..."
                    className="flex-1 border rounded px-2 py-1.5 text-sm bg-white"
                />
                <select
                    value={selectedRoleId ?? ''}
                    onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                    className="border rounded px-2 py-1.5 text-sm bg-white"
                >
                    {assignableRoles.map(r => (
                        <option key={r.id} value={r.id}>{r.roleName}</option>
                    ))}
                </select>
            </div>

            {loading && <p className="text-xs text-gray-400 px-1">Recherche...</p>}

            {results.length > 0 && (
                <div className="divide-y border rounded bg-white">
                    {results.map(u => {
                        const alreadyMember = existingMemberTokens.includes(u.user_id);
                        return (
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
                                    onClick={() => handleAdd(u.user_id)}
                                    disabled={isPending || alreadyMember}
                                    className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-2.5 py-1 rounded"
                                >
                                    {alreadyMember ? 'Déjà membre' : 'Ajouter'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && query.trim().length >= 2 && results.length === 0 && (
                <p className="text-xs text-gray-400 px-1">Aucun résultat.</p>
            )}
        </div>
    );
}