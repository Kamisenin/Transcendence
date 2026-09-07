"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type Props = {
    twoFactorEnabled: boolean;
    emailVerified: boolean;
};

export default function TwoFactorToggle({ twoFactorEnabled, emailVerified }: Props) {
    const t = useTranslations("Auth.twoFactor");
    const tCommon = useTranslations("Common");
    const [enabled, setEnabled] = useState(twoFactorEnabled);
    useEffect(() => {setEnabled(twoFactorEnabled);}, [twoFactorEnabled]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const router = useRouter();

    async function handleToggle() {
        const newValue = !enabled;
        if (newValue && !emailVerified) {
            setMessage(t("verifyEmailFirst"));
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
            setMessage(newValue ? t("enabled") : t("disabled"))
            router.refresh();
        } else {
            setMessage(data.error || tCommon("somethingWentWrong"));
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
                <span>{t("label")}</span>
            </label>
            {message && <p className="text-sm text-red-600">{message}</p>}
        </div>
    );
}