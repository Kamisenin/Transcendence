'use client';

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { deletePage } from "@/actions/pages";
import { isDefaultTitle } from "@/app/lib/page/title";

type PageItem = {
    pageId: number;
    title?: string;
    preview?: string | null;
    ownerAccount: string;
    canonicalSlug?: { namespace: string; slug: string } | null;
};

function PageRow({ item, onDeleted }: { item: PageItem; onDeleted: (pageId: number) => void }) {
    const t = useTranslations("MyPages");
    const [deleting, setDeleting] = useState(false);
    const pageHref = item.canonicalSlug
        ? `/wiki/${item.canonicalSlug.namespace}/${item.canonicalSlug.slug}`
        : `/wiki/${item.ownerAccount}/${item.pageId}`;
    const editHref = `/wiki/${item.ownerAccount}/${item.pageId}/edit`;

    async function handleDelete() {
        if (!window.confirm(t("confirmDelete"))) return;

        setDeleting(true);
        try {
            await deletePage(item.pageId);
            onDeleted(item.pageId);
        } catch {
            setDeleting(false);
        }
    }

    return (
        <div className="flex items-center gap-4 border rounded p-3">
            <div className="w-28 h-20 bg-gray-100 flex-shrink-0 overflow-hidden rounded">
                {item.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.preview} alt={!isDefaultTitle(item.title) ? item.title : `Page ${item.pageId}`} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm text-gray-500">{t("preview")}</div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <Link href={pageHref} className="text-lg font-medium text-blue-600 hover:underline truncate">
                    {!isDefaultTitle(item.title) ? item.title : `Page #${item.pageId}`}
                </Link>
                 <div className="text-sm text-gray-500 truncate">{t("owner", { owner: item.ownerAccount })}</div>
            </div>

            <div className="flex-shrink-0 flex items-center gap-2">
                <Link href={editHref} className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:opacity-95">
                    {t("edit")}
                </Link>
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-1 rounded bg-red-50 text-red-600 text-sm hover:bg-red-100 disabled:opacity-50"
                >
                    {t("delete")}
                </button>
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
            if (res.status === 401 && json?.error === "AUTH_REQUIRED") {
                router.push("/login");
                return;
            }
            if (!res.ok || !json.ok) {
                setError(json?.error || t("failedToFetch"));
                setItems([]);
            } else {
                setItems(json.pages || []);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : t("failedToFetch"));
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [router, t]);

    useEffect(() => {
        fetchPages(tab);
        const nextUrl = `/pages/?tab=${encodeURIComponent(tab)}`;
        router.replace(nextUrl);
    }, [tab, fetchPages, router]);

    useEffect(() => {
        if (urlTab && urlTab !== tab) setTab(urlTab);
    }, [urlTab]);

    function handleDeleted(pageId: number) {
        setItems((prev) => prev.filter((it) => it.pageId !== pageId));
    }

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
                    items.map((it) => <PageRow key={it.pageId} item={it} onDeleted={handleDeleted} />)
                )}
            </section>
        </div>
    );
}