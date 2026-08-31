'use client';

import Link from "next/link"
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function LoginPage() {
    const t = useTranslations("Auth.login");
    const [error, setError] = useState("");

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
            window.location.href = '/verify_2fa';
            return ;
        }

        window.location.href = '/';
        console.log(j);
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">{t("title")}</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-80">
                <input
                    type="text"
                    name="id"
                    placeholder={t("idPlaceholder")}
                    className="border p-2 rounded text-black"
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder={t("passwordPlaceholder")}
                    className="border p-2 rounded text-black"
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
                <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                    {t("submit")}
                </button>
            </form>
            <p className="text-sm mt-4">
                {t("noAccount")} {" "}
                <Link href="/register" className="text-blue-500 underline">
                    {t("signUp")}
                </Link>
            </p>
        </div>
    );
}