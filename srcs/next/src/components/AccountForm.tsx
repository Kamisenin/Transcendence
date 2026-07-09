"use client";

import { useState } from "react";

type Props = {
    user: {
        username: string;
        email: string;
    };
}

export default function AccountForm({ user }: Props) {
    const [username, setUsername] = useState(user.username);
    const [email, setEmail] = useState(user.email);

    async function save() {
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
            console.log("saved");
        } else {
            console.log("error");
        }
    };
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
                onClick={save}
                className="bg-black text-white p-2 rounded">
                save
            </button>

        </div>
    );
}