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

function PageRow({
    item,
    onDeleted,
}: {
    item: PageItem;
    onDeleted: (pageId: number) => void;
}) {
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

    const pageTitle = !isDefaultTitle(item.title)
        ? item.title
        : `Page #${item.pageId}`;

    return (
        <div className="flex items-center gap-4 border border-[#d9bfb7] bg-[#fffaf7] p-3 shadow-[0_2px_8px_rgba(128,0,0,0.06)] transition-shadow hover:shadow-md">

            <div className="h-20 w-28 flex-shrink-0 overflow-hidden border border-[#ead8d1] bg-[#f0e0d6]">
                {item.preview ? (
                    <img
                        src={item.preview}
                        alt={pageTitle}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-[#8a6b63]">
                        {t("preview")}
                    </div>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <Link
                    href={pageHref}
                    className="block truncate text-lg font-semibold text-[#3f2924] transition-colors hover:text-[#800000] hover:underline">
                    {pageTitle}
                </Link>

                <div className="mt-1 truncate text-sm text-[#8a6b63]">
                    {t("owner", { owner: item.ownerAccount })}
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-shrink-0 items-center gap-2">
                <Link
                    href={editHref}
                    className="rounded bg-[#800000] px-3 py-1.5 text-sm font-medium text-[#fffaf7] transition-colors hover:bg-[#5f0000]"
                >
                    {t("edit")}
                </Link>

                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded bg-[#ef0000] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#c90000] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {deleting ? "..." : t("delete")}
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

    const fetchPages = useCallback(
        async (tabName: string) => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(
                    `/api/pages?tab=${encodeURIComponent(tabName)}`,
                    { cache: "no-store" }
                );
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
                setError(
                    err instanceof Error
                        ? err.message
                        : t("failedToFetch")
                );
                setItems([]);
            } finally {
                setLoading(false);
            }
        },
        [router, t]
    );

    useEffect(() => {
        fetchPages(tab);

        const nextUrl = `/pages/?tab=${encodeURIComponent(tab)}`;
        router.replace(nextUrl);
    }, [tab, fetchPages, router]);

    useEffect(() => {
        if (urlTab && urlTab !== tab) {
            setTab(urlTab);
        }
    }, [urlTab]);

    function handleDeleted(pageId: number) {
        setItems((prev) => prev.filter((it) => it.pageId !== pageId));
    }

    return (
        <div className="min-h-screen bg-[#f0e0d6] px-4 pb-12 pt-20 text-[#3f2924]">
            <div className="mx-auto max-w-7xl">

                <div className="mb-6 border-b-2 border-[#800000] pb-3">
                    <h1 className="text-2xl font-bold text-[#800000]">
                        {t("myPages")}
                    </h1>
                </div>

                <nav className="mb-6 flex gap-2">
                    <button
                        onClick={() => setTab("owned")}
                        className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
                            tab === "owned"
                                ? "bg-[#800000] text-[#fffaf7]"
                                : "border border-[#d9bfb7] bg-[#fffaf7] text-[#3f2924] hover:border-[#800000] hover:text-[#800000]"
                        }`}
                    >
                        {t("myPages")}
                    </button>

                    <button
                        onClick={() => setTab("accessible")}
                        className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
                            tab === "accessible"
                                ? "bg-[#800000] text-[#fffaf7]"
                                : "border border-[#d9bfb7] bg-[#fffaf7] text-[#3f2924] hover:border-[#800000] hover:text-[#800000]"
                        }`}
                    >
                        {t("sharedPages")}
                    </button>
                </nav>

                <section className="space-y-3">
                    {loading ? (
                        <div className="space-y-3">
                            <div className="h-24 animate-pulse rounded border border-[#d9bfb7] bg-[#fffaf7]" />
                            <div className="h-24 animate-pulse rounded border border-[#d9bfb7] bg-[#fffaf7]" />
                        </div>
                    ) : error ? (
                        <div className="border border-[#d9bfb7] bg-[#fffaf7] p-4 text-sm text-[#c90000]">
                            {t("error", { message: error })}
                        </div>
                    ) : items.length === 0 ? (
                        <div className="border border-[#d9bfb7] bg-[#fffaf7] p-8 text-center text-sm text-[#8a6b63]">
                            {t("noPagesFound")}
                        </div>
                    ) : (
                        items.map((it) => (
                            <PageRow
                                key={it.pageId}
                                item={it}
                                onDeleted={handleDeleted}
                            />
                        ))
                    )}
                </section>
            </div>
        </div>
    );
}