"use client";

import { useState } from "react";
import Link from "next/link";

type UserMenuProps = {
    user: { username: string  } | null; 
};

export default function UserMenu({ user }: UserMenuProps) {
    const [open, setOpen] = useState(false);

    async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/";
    }
    return (
        <div className="relative">
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
