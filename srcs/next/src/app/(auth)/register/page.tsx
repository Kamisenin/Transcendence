'use client';

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function RegisterPage() {
    const t = useTranslations("Auth.register");
    const router = useRouter();

    const [error, setError] = useState("");
    const accountNameError = error === "INVALID_ACCOUNT_ID";
    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        const form = new FormData(event.currentTarget);
        const f = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: form.get('email'),
                password: form.get('password'),
                accountId: form.get('account_id'),
                username: form.get('username'),
                stayConnected: false
            })
        });
        const data = await f.json();
        if (f.ok) {
            router.push('/verify');
            router.refresh();
        } else if (f.status === 409) {
            setError("email or username already in use")
        } else if (data.error === "INVALID_ACCOUNT_ID") {
            setError(data.error);
        }
        else{
            setError("An error occurred. Please try again");
            console.log('server has sent an error');
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#f0e0d6] px-4 py-20">
            <div className="w-full max-w-md border border-[#d9bfb7] border-t-4 border-t-[#800000] bg-[#fffaf7] p-6 shadow-[0_2px_10px_rgba(128,0,0,0.08)]">
            <h1 className="mb-6 text-2xl font-bold text-[#800000]">{t("title")}</h1>
            <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
                <input
                    type="email"
                    name="email"
                    placeholder={t("emailPlaceholder")}
                    className="border border-[#d9bfb7] bg-white p-2 text-black outline-none focus:border-[#800000] focus:ring-2 focus:ring-[#e6a817]/40"
                    required
                />
                <input
                    type="text"
                    name="account_id"
                    placeholder={t("accountNamePlaceholder")}
                    maxLength={20}
                    pattern="[A-Za-z0-9_-]+"
                    title="Use only letters, numbers, underscores and hyphens"
                    className="border border-[#d9bfb7] bg-white p-2 text-black outline-none focus:border-[#800000] focus:ring-2 focus:ring-[#e6a817]/40"
                    required
                />
                {accountNameError && (
                    <p className="text-red-500 text-sm">{t("accountNameInvalid")}</p>
                )}
                <input
                    type="text"
                    name="username"
                    placeholder={t("userNamePlaceholder")}
                    className="border border-[#d9bfb7] bg-white p-2 text-black outline-none focus:border-[#800000] focus:ring-2 focus:ring-[#e6a817]/40"
                />
                <input
                    type="password"
                    name="password"
                    placeholder={t("passwordPlaceholder")}
                    className="border border-[#d9bfb7] bg-white p-2 text-black outline-none focus:border-[#800000] focus:ring-2 focus:ring-[#e6a817]/40"
                    required
                />
                {error && !accountNameError && (
                    <p className="text-red-500 text-sm">
                        {error}
                    </p>
                )}
                <button type="submit" className="bg-[#800000] p-2 font-semibold text-white transition-colors hover:bg-[#650000]">
                    {t("submit")}
                </button>
            </form>
            </div>
        </main>
    );
}