"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { isDefaultTitle } from "@/app/lib/page/title";
import { reviewTagPageRequest } from "@/actions/tags";
import { reviewOrganizationTagRequest, reviewOrganizationPageRequest } from "@/actions/orgs";

type Notification = {
    id: number;
    type: string;
    read: boolean;
    createdAt: string;
    actor: { username: string; imgLink: string; accountId: string } | null;
    page: {
        pageId: number;
        title: string;
        canonicalSlug: { namespace: string; slug: string } | null;
    } | null;
    tagPageRequest: {
        id: number;
        status: string;
        tagName: string;
        tagNamespace: string;
        pageTitle: string;
        pageHref: string;
    } | null;
    orgTagRequest: {
        id: number;
        status: string;
        orgName: string;
        tagName: string;
        tagNamespace: string;
    } | null;
    orgPageRequest: {
        id: number;
        status: string;
        orgName: string;
        pageTitle: string;
        pageHref: string;
    } | null;
};

export default function NotificationBell() {
    const t = useTranslations("Notifications");
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [busyId, setBusyId] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    function removeLocal(id: number) {
        setNotifications((prev) => {
            const target = prev.find((n) => n.id === id);
            if (target && !target.read) {
                setUnreadCount((count) => Math.max(0, count - 1));
            }
            return prev.filter((n) => n.id !== id);
        });
    }

    async function handleDismiss(id: number) {
        removeLocal(id);
        try {
            await fetch("/api/notifications/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
        } catch {}
    }

    async function handleClearRead() {
        setNotifications((prev) => prev.filter((n) => !n.read));
        try {
            await fetch("/api/notifications/clear-read", { method: "DELETE" });
        } catch {}
    }

    async function handleAcceptFriend(id: number) {
        removeLocal(id);
        try {
            await fetch("/api/friends/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId: id }),
            });
        } catch {}
    }

    async function handleRefuseFriend(id: number) {
        removeLocal(id);
        try {
            await fetch("/api/friends/refuse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId: id }),
            });
        } catch {}
    }

    async function handleTagPageRequest(notificationId: number, requestId: number, accept: boolean) {
        setBusyId(notificationId);
        try {
            await reviewTagPageRequest(requestId, accept);
            removeLocal(notificationId);
            router.refresh();
        } catch {
        } finally {
            setBusyId(null);
        }
    }

    async function handleOrgTagRequest(notificationId: number, requestId: number, accept: boolean) {
        setBusyId(notificationId);
        try {
            await reviewOrganizationTagRequest(requestId, accept);
            removeLocal(notificationId);
            router.refresh();
        } catch {
        } finally {
            setBusyId(null);
        }
    }

    async function handleOrgPageRequest(notificationId: number, requestId: number, accept: boolean) {
        setBusyId(notificationId);
        try {
            await reviewOrganizationPageRequest(requestId, accept);
            removeLocal(notificationId);
            router.refresh();
        } catch {
        } finally {
            setBusyId(null);
        }
    }

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

    function friendHref(n: Notification): string | null {
        return n.actor ? `/wiki/${encodeURIComponent(n.actor.accountId)}` : null;
    }

    function handleFriendNotificationClick(n: Notification) {
        const href = friendHref(n);
        if (!href) return;
        handleNotificationClick(n.id);
        router.push(href);
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

    const hasReadNotifications = notifications.some((n) => n.read);

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
                    <div className="flex items-center justify-between px-4 py-2 border-b gap-2">
                        <span className="font-semibold text-sm">{t("title")}</span>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline cursor-pointer">
                                    {t("markAllRead")}
                                </button>
                            )}
                            {hasReadNotifications && (
                                <button onClick={handleClearRead} className="text-xs text-gray-500 hover:underline cursor-pointer">
                                    {t("clearRead")}
                                </button>
                            )}
                        </div>
                    </div>

                    {loading && (
                        <div className="px-4 py-6 text-sm text-center text-gray-500">{t("loading")}</div>
                    )}

                    {!loading && notifications.length === 0 && (
                        <div className="px-4 py-6 text-sm text-center text-gray-500">{t("empty")}</div>
                    )}

                    {!loading && notifications.map((n) => {
                        if (n.type === "FRIEND_REQUEST") {
                            return (
                                <div
                                    key={n.id}
                                    onClick={() => handleFriendNotificationClick(n)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            handleFriendNotificationClick(n);
                                        }
                                    }}
                                    role={n.actor ? "link" : undefined}
                                    tabIndex={n.actor ? 0 : undefined}
                                    className={`relative px-4 py-3 border-b last:border-b-0 ${n.actor ? "cursor-pointer hover:bg-gray-50" : ""} ${!n.read ? "bg-blue-50" : ""}`}
                                >
                                    <button
                                        onClick={(event) => { event.stopPropagation(); handleDismiss(n.id); }}
                                        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                                        aria-label={t("ignore")}
                                    >
                                        ✕
                                    </button>
                                    <p className="text-sm pr-4">
                                        {t("friendRequest", { actor: n.actor?.username ?? t("someone") })}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <button
                                            onClick={(event) => { event.stopPropagation(); handleAcceptFriend(n.id); }}
                                            className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                                        >
                                            {t("accept")}
                                        </button>
                                        <button
                                            onClick={(event) => { event.stopPropagation(); handleRefuseFriend(n.id); }}
                                            className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 cursor-pointer"
                                        >
                                            {t("refuse")}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{timeAgo(n.createdAt)}</p>
                                </div>
                            );
                        }

                        if (n.type === "TAG_PAGE_REQUEST" && n.tagPageRequest) {
                            const req = n.tagPageRequest;
                            return (
                                <div key={n.id} className={`relative px-4 py-3 border-b last:border-b-0 ${!n.read ? "bg-blue-50" : ""}`}>
                                    <button
                                        onClick={() => handleDismiss(n.id)}
                                        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                                        aria-label={t("ignore")}
                                    >
                                        ✕
                                    </button>
                                    <Link
                                        href={`/tags/${req.tagNamespace}/manage`}
                                        onClick={() => handleNotificationClick(n.id)}
                                        className="text-sm pr-4 hover:underline block"
                                    >
                                        {t("tagPageRequestText", {
                                            actor: n.actor?.username ?? t("someone"),
                                            tag: req.tagName,
                                            title: isDefaultTitle(req.pageTitle) ? t("untitled") : req.pageTitle,
                                        })}
                                    </Link>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <button
                                            disabled={busyId === n.id}
                                            onClick={() => handleTagPageRequest(n.id, req.id, true)}
                                            className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer disabled:opacity-50"
                                        >
                                            {t("accept")}
                                        </button>
                                        <button
                                            disabled={busyId === n.id}
                                            onClick={() => handleTagPageRequest(n.id, req.id, false)}
                                            className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 cursor-pointer disabled:opacity-50"
                                        >
                                            {t("refuse")}
                                        </button>
                                        <Link href={req.pageHref} className="text-xs text-blue-600 hover:underline">
                                            {t("viewRequest")}
                                        </Link>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{timeAgo(n.createdAt)}</p>
                                </div>
                            );
                        }

                        if (n.type === "ORG_TAG_REQUEST" && n.orgTagRequest) {
                            const req = n.orgTagRequest;
                            return (
                                <div key={n.id} className={`relative px-4 py-3 border-b last:border-b-0 ${!n.read ? "bg-blue-50" : ""}`}>
                                    <button
                                        onClick={() => handleDismiss(n.id)}
                                        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                                        aria-label={t("ignore")}
                                    >
                                        ✕
                                    </button>
                                    <Link
                                        href={`/orgs/${encodeURIComponent(req.orgName)}/manage`}
                                        onClick={() => handleNotificationClick(n.id)}
                                        className="text-sm pr-4 hover:underline block"
                                    >
                                        {t("orgTagRequestText", {
                                            actor: n.actor?.username ?? t("someone"),
                                            tag: req.tagName,
                                            org: req.orgName,
                                        })}
                                    </Link>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <button
                                            disabled={busyId === n.id}
                                            onClick={() => handleOrgTagRequest(n.id, req.id, true)}
                                            className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer disabled:opacity-50"
                                        >
                                            {t("accept")}
                                        </button>
                                        <button
                                            disabled={busyId === n.id}
                                            onClick={() => handleOrgTagRequest(n.id, req.id, false)}
                                            className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 cursor-pointer disabled:opacity-50"
                                        >
                                            {t("refuse")}
                                        </button>
                                        <Link href={`/tags/${req.tagNamespace}`} className="text-xs text-blue-600 hover:underline">
                                            {t("viewRequest")}
                                        </Link>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{timeAgo(n.createdAt)}</p>
                                </div>
                            );
                        }

                        if (n.type === "ORG_PAGE_REQUEST" && n.orgPageRequest) {
                            const req = n.orgPageRequest;
                            return (
                                <div key={n.id} className={`relative px-4 py-3 border-b last:border-b-0 ${!n.read ? "bg-blue-50" : ""}`}>
                                    <button
                                        onClick={() => handleDismiss(n.id)}
                                        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                                        aria-label={t("ignore")}
                                    >
                                        ✕
                                    </button>
                                    <Link
                                        href={`/orgs/${encodeURIComponent(req.orgName)}/manage`}
                                        onClick={() => handleNotificationClick(n.id)}
                                        className="text-sm pr-4 hover:underline block"
                                    >
                                        {t("orgPageRequestText", {
                                            actor: n.actor?.username ?? t("someone"),
                                            title: isDefaultTitle(req.pageTitle) ? t("untitled") : req.pageTitle,
                                            org: req.orgName,
                                        })}
                                    </Link>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <button
                                            disabled={busyId === n.id}
                                            onClick={() => handleOrgPageRequest(n.id, req.id, true)}
                                            className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer disabled:opacity-50"
                                        >
                                            {t("accept")}
                                        </button>
                                        <button
                                            disabled={busyId === n.id}
                                            onClick={() => handleOrgPageRequest(n.id, req.id, false)}
                                            className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 cursor-pointer disabled:opacity-50"
                                        >
                                            {t("refuse")}
                                        </button>
                                        <Link href={req.pageHref} className="text-xs text-blue-600 hover:underline">
                                            {t("viewRequest")}
                                        </Link>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{timeAgo(n.createdAt)}</p>
                                </div>
                            );
                        }

                        return (
                            <div key={n.id} className={`relative flex items-start ${!n.read ? "bg-blue-50" : ""} border-b last:border-b-0`}>
                                <Link
                                    href={pageHref(n)}
                                    onClick={() => handleNotificationClick(n.id)}
                                    className="flex-1 block px-4 py-3 hover:bg-gray-50"
                                >
                                    <p className="text-sm pr-4">
                                        {t("pageEdited", { actor: n.actor?.username ?? t("someone"), title: isDefaultTitle(n.page?.title) ? t("untitled") : n.page!.title })}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">{timeAgo(n.createdAt)}</p>
                                </Link>
                                <button
                                    onClick={() => handleDismiss(n.id)}
                                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                                    aria-label={t("ignore")}
                                >
                                    ✕
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}