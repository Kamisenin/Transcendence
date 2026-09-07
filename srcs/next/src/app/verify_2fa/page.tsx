'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function Verify2faPage() {
    const t = useTranslations("Auth.verify2fa");
    const tVerify = useTranslations("Auth.verify");
    const tCommon = useTranslations("Common");
    const [code, setCode] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setMessage("");
        const res = await fetch("/api/auth/verify_2fa", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({code}),
        });
        const data = await res.json();
        if (res.ok) {
            window.location.href = "/";
        } else {
            setMessage(data.error || tCommon("somethingWentWrong"));
        }
        setLoading(false);
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">{t("title")}</h1>
            <p className="text-sm text-gray-600 mb-4">{t("subtitle")}</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-80">
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={6}
                    className="border p-2 rounded text-black text-center tracking-widest"
                    required
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                >
                    {loading ? tVerify("verifying") : tVerify("verify")}
                </button>
            </form>
            {message && <p className="text-sm mt-4">{message}</p>}
        </div>
    );
}