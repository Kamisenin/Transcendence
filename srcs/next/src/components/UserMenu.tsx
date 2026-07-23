"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type UserMenuProps = {
    user: { username: string  } | null; 
};

export default function UserMenu({ user }: UserMenuProps) {
    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

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
        const res = await fetch("/api/pages/create", {method: "POST"});
        const data = await res.json();
     
        if (res.ok) {
            router.push(`/pages/${data.pageId}/edit`);
        } else {
            console.error(data.error);
        }
        setCreating(false);
    }
    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="w-10 h-10 rounded-full bg-gray-300 cursor-pointer">
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-back rounded shadow-lg border">
                    {user ? (
                        <>
                            <div className="px-4 py-2 border-b text-sm font-semibold">
                                Hello, {user.username}
                            </div>
                            <Link href="/account" className="block px-4 py-2 hover:bg-gray-100">
                                Account
                            </Link>
                            <button
                                onClick={handleCreatePage}
                                disabled={creating}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100">
                                {creating ? "Creating..." : "Create my page"}
                            </button>
                            <Link href="/settings" className="block px-4 py-2 hover:bg-gray-100">
                                Settings
                            </Link>
                            <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-100">
                                Log out
                            </button>
                        </>
                    ) : (
                        <Link href="/login" className="block px-4 py-2 hover:bg-gray-100">
                            log in
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
