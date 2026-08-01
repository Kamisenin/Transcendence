"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
    twoFactorEnabled: boolean;
    emailVerified: boolean;
};

export default function TwoFactorToggle({ twoFactorEnabled, emailVerified }: Props) {
    const [enabled, setEnabled] = useState(twoFactorEnabled);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const router = useRouter();

    async function handleToggle() {
        const newValue = !enabled;

        if (newValue && !emailVerified) {
            setMessage("Please verify your email first, in your account settings.");
            return ;
        }
        setLoading(true);
        setMessage("");
        const res = await fetch("/api/auth/2fa", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({enable: newValue}),
        });
        const data = await res.json();
        
        if (res.ok) {
            setEnabled(data.twoFactorEnabled);
            setMessage(newValue ? "Two-factor authentication enabled." : "Two-factor authentification disabled")
            router.refresh();
        } else {
            setMessage(data.error || "Something went wrong");
        }
        setLoading(false);
    }
    return (
        <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={enabled}
                    onChange={handleToggle}
                    disabled={loading}
                />
                <span>Two-factor authentication (email code)</span>
            </label>
            {message && <p className="text-sm text-red-600">{message}</p>}
        </div>
    );
}