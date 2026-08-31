"use client";

import { useTranslations } from "next-intl";

export default function LogoutButton() {
    const t = useTranslations("Auth.logout");

    const handleLogout = async () => {
        const res = await fetch("/api/auth/logout", {method: "POST"});
        if (res.ok)
            window.location.reload();
        else
            console.error(t("unableToLogout"));
    };
    return (
        <button className={"border-solid"} onClick={handleLogout}>{t("disconnect")}</button>
    );
}