"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { createPage } from "@/actions/pages";
import Link from "next/link";

type UserMenuProps = {
    user: { username: string  } | null; 
};

export default function UserMenu({ user }: UserMenuProps) {
    const t = useTranslations("UserMenu");
    const tOrgs = useTranslations("Orgs");
    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => {
            document.removeEventListener("mousedown", handleClick);
        };
    }, []);
    async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/";
    }

    async function handleCreatePage() {
        setCreating(true);

        try {
            await createPage();
        } catch (error) {
            console.error("error creating page :", error);
        } finally {
            setCreating(false);
        }
    }
    if (!user) {
        return (
            <div className="flex items-center gap-3">
                <Link href="/login" className="border border-black px-4 py-2 rounded">
                    {t("signIn")}
                </Link>
                <Link href="/register" className="border border-black px-4 py-2 rounded">
                    {t("signUp")}
                </Link>
            </div>
        );
    }
    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="w-10 h-10 rounded-full bg-white border-2 border-black shadow-md hover:shadow-lg cursor-pointer transition">
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-back rounded shadow-lg border">
                    <div className="px-4 py-2 border-b text-sm font-semibold">
                        {t("hello", {username: user.username})}
                    </div>
                    <Link href="/account" className="block px-4 py-2 hover:bg-gray-100">
                        {t("account")}
                    </Link>
                    <Link href="/pages/" className="block px-4 py-2 hover:bg-gray-100">
                        {t("myPages")}
                    </Link>
                    <Link href="/orgs/" className="block px-4 py-2 hover:bg-gray-100">
                        {tOrgs("myOrganizations")}
                    </Link>
                    <button
                        onClick={handleCreatePage}
                        disabled={creating}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100">
                        {creating ? t("creatingPage") : t("createPage")}
                    </button>
                    <Link href="/settings" className="block px-4 py-2 hover:bg-gray-100">
                        {t("settings")}
                    </Link>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-100">
                        {t("logOut")}
                    </button>
                </div>
            )}
        </div>
    );
}