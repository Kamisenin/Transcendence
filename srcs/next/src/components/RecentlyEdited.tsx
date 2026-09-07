import { getRecentlyEditedPages } from "@/actions/pages";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

function timeAgo(date: Date, t: (key: string, values?: any) => string): string {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return t("justNow");
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t("minutesAgo", { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("hoursAgo", { count: hours });
    const days = Math.floor(hours / 24);
    return t("daysAgo", { count: days });
}

export default async function RecentlyEdited() {
    const pages = await getRecentlyEditedPages(6);
    const t = await getTranslations("RecentlyEdited");
    const tTime = await getTranslations("Notifications");

    if (pages.length === 0) return null;

    return (
        <div className="w-full mt-10">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">{t("title")}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pages.map((page) => {
                    const href = page.canonicalSlug
                        ? `/wiki/${page.canonicalSlug.namespace}/${page.canonicalSlug.slug}`
                        : `/pages/${page.pageId}`;
                    return (
                        <Link
                            key={page.pageId}
                            href={href}
                            className="block border border-border rounded-lg p-4 hover:bg-accent transition"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <span className="font-medium text-sm">{page.title === 'Untitled' ? t("untitled") : page.title}</span>
                                {page.tag && (
                                    <span
                                        className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap text-white"
                                        style={{ backgroundColor: page.tag.color ? `#${page.tag.color.toString(16).padStart(6, '0')}` : '#888' }}
                                    >
                                        {page.tag.name}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-zinc-500 mt-2">
                                {page.lastEditorName
                                    ? t("editedBy", { name: page.lastEditorName, time: timeAgo(page.lastModified, tTime) })
                                    : timeAgo(page.lastModified, tTime)}
                            </p>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}