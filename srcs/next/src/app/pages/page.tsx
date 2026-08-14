'use client';

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type PageItem = {
    pageId: number;
    title?: string;
    preview?: string | null;
    ownerAccount?: string;
    canonicalSlug?: { namespace: string; slug: string } | null;
};

function PageRow({ item }: { item: PageItem }) {
    const pageHref = item.canonicalSlug
        ? `/wiki/${item.canonicalSlug.namespace}/${item.canonicalSlug.slug}`
        : `/wiki/${item.ownerAccount}/${item.pageId}`;
    const editHref = `/wiki/${item.ownerAccount}/${item.pageId}/edit`;

    return (
        <div className="flex items-center gap-4 border rounded p-3">
            <div className="w-28 h-20 bg-gray-100 flex-shrink-0 overflow-hidden rounded">
                {item.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.preview} alt={item.title || `Page ${item.pageId}`} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm text-gray-500">Preview</div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <Link href={pageHref} className="text-lg font-medium text-blue-600 hover:underline truncate">
                    {item.title || `Page #${item.pageId}`}
                </Link>
                <div className="text-sm text-gray-500 truncate">Owner: {item.ownerAccount}</div>
            </div>

            <div className="flex-shrink-0">
                <Link href={editHref} className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:opacity-95">
                    Edit
                </Link>
            </div>
        </div>
    );
}

export default function MyPages() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlTab = searchParams?.get("tab") || "owned";

    const [tab, setTab] = useState<string>(urlTab);
    const [items, setItems] = useState<PageItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPages = useCallback(async (t: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/pages?tab=${encodeURIComponent(t)}`, { cache: "no-store" });
            const json = await res.json();
            if (!res.ok || !json.ok) {
                setError(json?.error || "Failed to fetch");
                setItems([]);
            } else {
                setItems(json.pages || []);
            }
        } catch (err: any) {
            setError(err?.message || "Network error");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // initial load & when tab changes
    useEffect(() => {
        fetchPages(tab);
        // update url without full navigation
        const nextUrl = `/pages/?tab=${encodeURIComponent(tab)}`;
        // use router.push to keep SPA behavior
        router.replace(nextUrl);
    }, [tab, fetchPages, router]);

    // sync with URL changes (back/forward)
    useEffect(() => {
        if (urlTab && urlTab !== tab) setTab(urlTab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urlTab]);

    return (
        <div className="p-6 pt-20">

            <nav className="mb-6 flex gap-2">
                <button
                    onClick={() => setTab("owned")}
                    className={`px-3 py-1 rounded ${tab === "owned" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
                >
                    My pages
                </button>
                <button
                    onClick={() => setTab("accessible")}
                    className={`px-3 py-1 rounded ${tab === "accessible" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
                >
                    Shared pages
                </button>
            </nav>

            <section className="space-y-3">
                {loading ? (
                    <div className="space-y-2">
                        <div className="h-20 bg-gray-100 animate-pulse rounded" />
                        <div className="h-20 bg-gray-100 animate-pulse rounded" />
                    </div>
                ) : error ? (
                    <div className="text-sm text-red-500">Error: {error}</div>
                ) : items.length === 0 ? (
                    <div className="text-sm text-gray-500">No pages found</div>
                ) : (
                    items.map((it) => <PageRow key={it.pageId} item={it} />)
                )}
            </section>
        </div>
    );
}