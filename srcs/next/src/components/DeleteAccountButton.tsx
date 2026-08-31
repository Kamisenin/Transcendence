"use client";

import { useState } from "react";

export default function DeleteAccountButton() {
    const [showConfirm, setShowConfirm] = useState(false);
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        setLoading(true);
        setMessage("");

        const res = await fetch("/api/auth/delete_account", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({password}),
        });
        const data = await res.json();
        if (res.ok) {
            window.location.href = "/";
        } else {
            setMessage(data.error || "something went wrong");
            setLoading(false);
        }
    }
    return (
        <div className="flex flex-col gap-3">
            <a
                href="/api/auth/export_data"
                className="text-sm text-blue-500 underline">
                    Export my data
            </a>

            {!showConfirm ? (
                <button
                    onClick={() => setShowConfirm(true)}
                    className="text-sm text-red-600 underline w-fit"
                >
                    Delete my account
                </button>
                
            ) : (
                <div className="border border-red-500 p-4 rounded flex flex-col gap-3">
                    <p className="text-sm font-semibold text-red-600">
                        This action is irreversible. Enter your password to confirm.    
                    </p>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="password"
                        className="border p-2 rounded text-black"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleDelete}
                            disabled={loading || !password}
                            className="bg-red-600 text-white px-4 py-2 rounded"
                        >
                            {loading ? "Deleting..." : "confirm deletion"}
                        </button>
                        <button
                            onClick={() => setShowConfirm(false)}
                            className="px-4 py-2 rounded border"
                        >
                            Cancel
                        </button>
                    </div>
                    {message && <p className="text-sm text-red-500">{message}</p>}
                </div>
            )}
        </div>
    );
}