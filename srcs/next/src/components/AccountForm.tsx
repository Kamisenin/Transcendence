"use client";

import { useState} from "react";
import { useRouter } from "next/navigation";

type Props = {
    user: {
        username: string;
        email: string;
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
        const res = await fetch("/api/auth/update", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username,
                email,
            }),
        });
        if (res.ok) {
            setMessage("Saved !");
            router.refresh();
        } else {
            setMessage("Error");
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
            <button
                disabled={loading}
                onClick={save}
                className="bg-black text-white p-2 rounded">
                {loading ? "Saving..." : "Save"}
            </button>
            <p>{message}</p>
        </div>
    );
}