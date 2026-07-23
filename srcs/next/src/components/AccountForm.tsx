"use client";

import { useState} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = {
    user: {
        username: string;
        email: string;
        emailVerified: boolean;
    };
}

export default function AccountForm({ user }: Props) {
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState(user.username);
    const [email, setEmail] = useState(user.email);
    const [message, setMessage] = useState("");
    const router = useRouter();

    async function save() {
        if (!username || !email)
            return ;
        setLoading(true);
        setMessage("");
        const res = await fetch("/api/auth/update", {
            method: "POST",
            headers: {"Content-Type": "application/json" },
            body: JSON.stringify({username, email}),
        });
        const data = await res.json();
        if (res.ok) {
            setMessage("Saved !");
            router.refresh();
        } else {
            setMessage(data.error || "Error");
        }
        setLoading(false);
    }
    return (
        <div className="flex flex-col gap-4">
            <label>
                Username
                <input
                    className="border p-2 w-full"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}/>
            </label>
            <label>
                Email
                <input
                    className="border p-2 w-full"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}/>
            </label>
            <div className="text-sm">
                {user.emailVerified ? (
                    <span className="text-green-600 font-semibold">✓ Email verified</span>
                ) : (
                    <>
                        <span className="text-red-500 font-semibold">✗ Email not verified </span>
                        <Link href="/verify" className="text-blue-500 underline">
                            Verify my email
                        </Link>
                    </>
                )}
            </div>
            <button
                disabled={loading}
                onClick={save}
                className="bg-black text-white p-2 rounded">
                {loading ? "Saving..." : "Save"}
            </button>
            <p>{message}</p>
            <Link href="/account/password" className="text-sm text-blue-500 underline">
                Change password
            </Link>
        </div>
    );
}