"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useTranslations } from "next-intl";
import { searchUsersForFriends, SearchFriendUser } from "@/actions/friendship";
import { addFriends } from "@/actions/friendship";
import UserAvatar from "@/components/UserAvatar";

type Props = {
    currentUserId: string;
};

export default function FriendSearch({ currentUserId }: Props) {
    const t = useTranslations("Friend");

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchFriendUser[]>([]);
    const [sentRequests, setSentRequests] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

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
                const users = await searchUsersForFriends(query);
                setResults(users);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    function handleAddFriend(receiverId: string) {
        setError(null);
        startTransition(async () => {
            try {
                await addFriends(currentUserId, receiverId);
                setSentRequests((prev) => ({ ...prev, [receiverId]: true }));
            } catch (e: any) {
                setError(e.message || t("addFailed"));
            }
        });
    }

    return (
        <div className="relative mb-3 w-full">
            <div className="relative flex items-center">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    className="w-full rounded-md border border-[#d9bfb7] bg-white px-3 py-1.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#800000] focus:ring-1 focus:ring-[#800000]"
                />
                {loading && (
                    <span className="absolute right-3 text-xs text-gray-400 animate-pulse">...</span>
                )}
            </div>

            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

            {results.length > 0 && (
                <div className="absolute left-0 right-0 z-20 mt-1 max-h-52 overflow-y-auto rounded-md border border-[#d9bfb7] bg-white shadow-lg divide-y divide-gray-100">
                    {results.map((user) => {
                        const isRequested = Boolean(sentRequests[user.user_id] || user.hasPendingRequest);
                        const isAlreadyFriend = user.isFriend;
                        const isDisabled = isPending || isRequested || isAlreadyFriend;

                        return (
                            <div key={user.user_id} className="flex items-center justify-between p-2 hover:bg-[#fffaf7]">
                                <div className="flex items-center gap-2 min-w-0">
                                    <UserAvatar
                                        accountId={user.accountId}
                                        imgLink={user.imgLink}
                                        alt={user.username || user.accountId}
                                        size={28}
                                        className="h-7 w-7 shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-semibold text-gray-800">{user.username}</p>
                                        <p className="truncate text-[10px] text-gray-400">@{user.accountId}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleAddFriend(user.user_id)}
                                    disabled={isDisabled}
                                    className={`ml-2 shrink-0 rounded px-2.5 py-1 text-xs font-medium transition ${
                                        isDisabled
                                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                            : "bg-[#800000] text-[#fffaf7] hover:bg-[#5f0000]"
                                    }`}
                                >
                                    {isAlreadyFriend
                                        ? t("alreadyFriends")
                                        : isRequested
                                        ? t("requestSent")
                                        : t("add")}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}