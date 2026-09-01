'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function ChangePasswordPage() {
    const t = useTranslations("Auth.changePassword");
    const tCommon = useTranslations("Common");
    const [step, setStep] = useState(1);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleStep1(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setMessage("");
        const res = await fetch("/api/auth/verify_password", {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({currentPassword}),
        });
        const data = await res.json();

        if (res.ok) {
            setStep(2);
        } else {
            setMessage(data.error || tCommon("somethingWentWrong"))
        }
        setLoading(false);
    }

    async function handleStep2(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMessage("");

        if (newPassword !== confirmPassword) {
            setMessage(t("passwordsDoNotMatch"));
            return ;
        }
        setLoading(true);
        const res = await fetch("/api/auth/change_password", {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({currentPassword, newPassword}),
        });
        const data = await res.json();
        
        if (res.ok) {
            router.push("/account");
        } else {
            setMessage(data.error || tCommon("somethingWentWrong"))
        }
        setLoading(false);
    }
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">{t("title")}</h1>
            {step === 1 && (
                <form onSubmit={handleStep1} className="flex flex-col gap-3 w-80">
                    <p className="text-sm text-gray-600">{t("enterCurrent")}</p>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder={t("currentPlaceholder")}
                        className="border p-2 rounded text-black" 
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                        {loading ? t("checking") : t("next")}
                    </button>
                </form>
            )}

            {step === 2 && (
                <form onSubmit={handleStep2} className="flex flex-col  gap-3 w-80">
                    <p className="text-sm text-gray-600">{t("enterNew")}</p>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t("newPlaceholder")}
                        className="border p-2 rounded text-black"
                        required
                    />
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t("confirmPlaceholder")}
                        className="border p-2 rounded text-black"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                        {loading ? tCommon("saving") : t("submit")}
                    </button>
                </form>
            )}

            {message && <p className="text-sm text-red-500 mt-4">{message}</p>}
        </div>
    );
}
