'use client'

import { useState } from "react"
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function VerifyPage() {
    const t = useTranslations("Auth.verify");
    const tCommon = useTranslations("Common");
    const [code, setCode] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setMessage("");
        const res = await fetch("/api/auth/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (res.ok) {
            setMessage(t("emailVerified"));
            router.push("/");
        } else {
            setMessage(data.error || tCommon("somethingWentWrong"));
        }
        setLoading(false);
    }

    async function handleResend() {
        setMessage("");
        const res = await fetch("/api/auth/resend_code", { method : "POST" });
        const data = await res.json();
        setMessage(res.ok ? t("codeResent") : (data.error || tCommon("somethingWentWrong")));
    }

    function handleSkip() {
        router.push("/");
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#f0e0d6] px-4 py-20">
            <div className="w-full max-w-md border border-[#d9bfb7] border-t-4 border-t-[#800000] bg-[#fffaf7] p-6 shadow-[0_2px_10px_rgba(128,0,0,0.08)]">
                <h1 className="mb-2 text-2xl font-bold text-[#800000]">{t("title")}</h1>
                <p className="mb-6 text-sm text-[#6f4d44]">{t("subtitle")}</p>
            <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder=""
                    maxLength={6}
                    className="border border-[#d9bfb7] bg-white p-2 text-center text-black tracking-[0.35em] outline-none focus:border-[#800000] focus:ring-2 focus:ring-[#e6a817]/40"
                    required/> 
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#800000] p-2 font-semibold text-white transition-colors hover:bg-[#650000] disabled:cursor-not-allowed disabled:opacity-60">
                        {loading ? t("verifying") : t("verify")}
                    </button>
            </form>
            <button onClick={handleResend} className="mt-4 text-sm font-medium text-[#800000] underline underline-offset-2 hover:text-[#650000]">
                {t("resendCode")}
            </button>
            <button onClick={handleSkip} className="mt-3 w-full border border-[#a98275] p-2 text-sm font-semibold text-[#3f2924] transition-colors hover:bg-[#f7e9e2]">
                {t("skip")}
            </button>
            {message && <p className="mt-4 text-sm text-[#6f4d44]">{message}</p>}
            </div>
        </main>
    );
}