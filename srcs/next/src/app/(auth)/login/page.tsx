'use client';

import Link from "next/link"
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function LoginPage() {
    const t = useTranslations("Auth.login");
    const router = useRouter();
    const [error, setError] = useState("");

    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();

        setError("");
        const form = new FormData(event.currentTarget);
        const f = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: form.get('id'),
                password: form.get('password'),
                stayConnected: form.get('stayConnected') === 'on',
            })
        });
        const j = await f.json();

        if (!f.ok){
            setError(j.error || "Non-existent account or incorrect password");
            return ;
        }
        if (j.twoFactorRequired) {
            router.push('/verify_2fa');
            return ;
        }

        router.push('/');
        router.refresh();
        console.log(j);
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#f0e0d6] px-4 py-20">
            <div className="w-full max-w-md border border-[#d9bfb7] border-t-4 border-t-[#800000] bg-[#fffaf7] p-6 shadow-[0_2px_10px_rgba(128,0,0,0.08)]">
            <h1 className="mb-6 text-2xl font-bold text-[#800000]">{t("title")}</h1>
            <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
                <input
                    type="text"
                    name="id"
                    placeholder={t("idPlaceholder")}
                    className="border border-[#d9bfb7] bg-white p-2 text-black outline-none focus:border-[#800000] focus:ring-2 focus:ring-[#e6a817]/40"
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder={t("passwordPlaceholder")}
                    className="border border-[#d9bfb7] bg-white p-2 text-black outline-none focus:border-[#800000] focus:ring-2 focus:ring-[#e6a817]/40"
                    required
                />
                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="stayConnected" />
                    {t("stayConnected")}
                </label>
                {error &&  (
                    <p className="text-red-500 text-sm">
                        {error}
                    </p>
                )}
                <button type="submit" className="bg-[#800000] p-2 font-semibold text-white transition-colors hover:bg-[#650000]">
                    {t("submit")}
                </button>
            </form>
            <p className="mt-5 text-sm text-[#6f4d44]">
                {t("noAccount")} {" "}
                <Link href="/register" className="font-semibold text-[#800000] underline underline-offset-2 hover:text-[#650000]">
                    {t("signUp")}
                </Link>
            </p>
            </div>
        </main>
    );
}