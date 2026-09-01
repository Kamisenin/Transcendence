'use client';

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function RegisterPage() {
    const t = useTranslations("Auth.register");
    const router = useRouter();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        console.log(form);
        const f = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: form.get('email'),
                password: form.get('password'),
                accountId: form.get('account_id'),
                stayConnected: false
            })
        });
        if (f.ok) {
            const j = await f.json();
            console.log(j);
            window.location.href = '/verify';
        } else if (f.status === 409) {
            console.log("email already in use")
        }
        else
            console.log('server has sent an error');
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">{t("title")}</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-80">
                <input
                    type="email"
                    name="email"
                    placeholder={t("emailPlaceholder")}
                    className="border p-2 rounded text-black"
                    required
                />
                <input
                    type="text"
                    name="account_id"
                    placeholder={t("accountNamePlaceholder")}
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
                <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                    {t("submit")}
                </button>
            </form>
        </div>
    );
}