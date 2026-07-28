"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
    twoFactor: boolean;
    emailVerif: boolean;
};

export default function TwoFactorToggle({ twoFactor, emailVerif }: Props) {
    const [enabled, setEnabled] = useState(twoFactor);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const router = useRouter();

    async function handleToggle() {
        setMessage("");

        if (!enabled && !emailVerif) {
            setLoading(true);
            await fetch("/api/auth/resend_code", {method: "POST"});
            router.push("/verify");
            return ;
        }
        setLoading(true);
        const res = await fetch("/api/auth/2fa/toggle", {
            method: "POST",
            headers: {"Content-Type": "application.json"},
            body: JSON.stringify({enable: !enabled}),
        });
        const data = await res.json();
        
        if (res.ok) {
            setEnabled(!enabled);
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
                    disabled={loading}
                    onChange={handleToggle}
                />
                Two-factor authentication (email code)
            </label>
            {message && <p className="text-sm text-red-500">{message}</p>}
        </div>
    );
}