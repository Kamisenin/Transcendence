"use client";

import { useState} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

type Props = {
    user: {
        username: string;
        email: string;
        emailVerified: boolean;
    };
}

export default function AccountForm({ user }: Props) {
    const t = useTranslations("Account");
    const tCommon = useTranslations("Common");
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState(user.username);
    const [email, setEmail] = useState(user.email);
    const [message, setMessage] = useState("");
    const router = useRouter();

    async function save() {
        if (!username || !email)
            return ;
        setLoading(true);
        setMessage("");
        const res = await fetch("/api/auth/update", {
            method: "POST",
            headers: {"Content-Type": "application/json" },
            body: JSON.stringify({username, email}),
        });
        const data = await res.json();
        if (res.ok) {
            if (email !== user.email){
                setMessage("Email updated. 2FA has been disabled.")
            } else {
                setMessage(tCommon("saved"));
            }
            router.refresh();
        } else {
            setMessage(data.error || tCommon("error"));
        }
        setLoading(false);
    }
    return (
        <div className="flex flex-col gap-4">
            <label>
                {t("username")}
                <input
                    className="border p-2 w-full"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}/>
            </label>
            <label>
                {t("email")}
                <input
                    className="border p-2 w-full"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}/>
            </label>
            <div className="text-sm">
                {user.emailVerified ? (
                    <span className="text-green-600 font-semibold">{t("emailVerified")}</span>
                ) : (
                    <>
                        <span className="text-red-500 font-semibold">{t("emailNotVerified")} </span>
                        <Link href="/verify" className="text-blue-500 underline">
                            {t("verifyMyEmail")}
                        </Link>
                    </>
                )}
            </div>
            <button
                disabled={loading}
                onClick={save}
                className="bg-black text-white p-2 rounded">
                {loading ? tCommon("saving") : tCommon("save")}
            </button>
            <p>{message}</p>
            <Link href="/account/password" className="text-sm text-blue-500 underline">
                {t("changePassword")}
            </Link>
        </div>
    );
}
