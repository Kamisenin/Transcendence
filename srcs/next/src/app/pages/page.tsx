'use client';

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

type PageItem = {
    pageId: number;
    title?: string;
    preview?: string | null;
    ownerAccount: string;
    canonicalSlug?: { namespace: string; slug: string } | null;
};

function PageRow({ item }: { item: PageItem }) {
    const t = useTranslations("MyPages");
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
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm text-gray-500">{t("preview")}</div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <Link href={pageHref} className="text-lg font-medium text-blue-600 hover:underline truncate">
                    {item.title || `Page #${item.pageId}`}
                </Link>
                 <div className="text-sm text-gray-500 truncate">{t("owner", { owner: item.ownerAccount })}</div>
            </div>

            <div className="flex-shrink-0">
                <Link href={editHref} className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:opacity-95">
                    {t("edit")}
                </Link>
            </div>
        </div>
    );
}

export default function MyPages() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlTab = searchParams?.get("tab") || "owned";
    const t = useTranslations("MyPages");

    const [tab, setTab] = useState<string>(urlTab);
    const [items, setItems] = useState<PageItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPages = useCallback(async (tabName: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/pages?tab=${encodeURIComponent(tabName)}`, { cache: "no-store" });
            const json = await res.json();
            if (!res.ok || !json.ok) {
                setError(json?.error || t("failedToFetch"));
                setItems([]);
            } else {
                setItems(json.pages || []);
            }
        } catch (err: any) {
            setError(err?.message || t("failedToFetch"));
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchPages(tab);
        const nextUrl = `/pages/?tab=${encodeURIComponent(tab)}`;
        router.replace(nextUrl);
    }, [tab, fetchPages, router]);

    useEffect(() => {
        if (urlTab && urlTab !== tab) setTab(urlTab);
    }, [urlTab]);

    return (
        <div className="p-6 pt-20">

            <nav className="mb-6 flex gap-2">
                <button
                    onClick={() => setTab("owned")}
                    className={`px-3 py-1 rounded ${tab === "owned" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
                >
                    {t("myPages")}
                </button>
                <button
                    onClick={() => setTab("accessible")}
                    className={`px-3 py-1 rounded ${tab === "accessible" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
                >
                    {t("sharedPages")}
                </button>
            </nav>

            <section className="space-y-3">
                {loading ? (
                    <div className="space-y-2">
                        <div className="h-20 bg-gray-100 animate-pulse rounded" />
                        <div className="h-20 bg-gray-100 animate-pulse rounded" />
                    </div>
                ) : error ? (
                    <div className="text-sm text-red-500">{t("error", { message: error })}</div>
                ) : items.length === 0 ? (
                    <div className="text-sm text-gray-500">{t("noPagesFound")}</div>
                ) : (
                    items.map((it) => <PageRow key={it.pageId} item={it} />)
                )}
            </section>
        </div>
    );
}