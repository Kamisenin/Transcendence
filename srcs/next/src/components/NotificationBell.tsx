"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

type Notification = {
    id: number;
    type: string;
    read: boolean;
    createdAt: string;
    actor: { username: string; imgLink: string } | null;
    page: {
        pageId: number;
        title: string;
        canonicalSlug: { namespace: string; slug: string } | null;
    } | null;
};

export default function NotificationBell() {
    const t = useTranslations("Notifications");
    const [open, setOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    async function fetchUnreadCount() {
        try {
            const res = await fetch("/api/notifications/unread-count");
            if (!res.ok) return;
            const data = await res.json();
            setUnreadCount(data.count ?? 0);
        } catch {}
    }

    async function fetchNotifications() {
        setLoading(true);
        try {
            const res = await fetch("/api/notifications?limit=15");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications ?? []);
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    async function handleToggle() {
        const willOpen = !open;
        setOpen(willOpen);
        if (willOpen) {
            await fetchNotifications();
        }
    }

    async function handleNotificationClick(id: number) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
        fetch("/api/notifications/mark-read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        }).catch(() => {});
    }

    async function handleMarkAllRead() {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        fetch("/api/notifications/mark-read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ all: true }),
        }).catch(() => {});
    }

    function pageHref(n: Notification): string {
        if (!n.page) return "#";
        if (n.page.canonicalSlug) {
            return `/wiki/${n.page.canonicalSlug.namespace}/${n.page.canonicalSlug.slug}`;
        }
        return `/pages/${n.page.pageId}`;
    }

    function timeAgo(dateString: string): string {
        const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
        if (seconds < 60) return t("justNow");
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return t("minutesAgo", { count: minutes });
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return t("hoursAgo", { count: hours });
        const days = Math.floor(hours / 24);
        return t("daysAgo", { count: days });
    }

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={handleToggle}
                aria-label={t("ariaLabel")}
                className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 transition cursor-pointer"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-semibold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white text-black rounded-lg shadow-lg border max-h-96 overflow-y-auto z-50">
                    <div className="flex items-center justify-between px-4 py-2 border-b">
                        <span className="font-semibold text-sm">{t("title")}</span>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline cursor-pointer">
                                {t("markAllRead")}
                            </button>
                        )}
                    </div>

                    {loading && (
                        <div className="px-4 py-6 text-sm text-center text-gray-500">{t("loading")}</div>
                    )}

                    {!loading && notifications.length === 0 && (
                        <div className="px-4 py-6 text-sm text-center text-gray-500">{t("empty")}</div>
                    )}

                    {!loading && notifications.map((n) => (
                        <Link
                            key={n.id}
                            href={pageHref(n)}
                            onClick={() => handleNotificationClick(n.id)}
                            className={`block px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 ${!n.read ? "bg-blue-50" : ""}`}
                        >
                            <p className="text-sm">
                                {t("pageEdited", { actor: n.actor?.username ?? t("someone"), title: n.page?.title || t("untitled") })}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{timeAgo(n.createdAt)}</p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}