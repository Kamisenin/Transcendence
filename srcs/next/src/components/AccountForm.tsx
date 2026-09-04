"use client";

import { useState} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

type Props = {
    user: {
        accountId: string;
        username: string;
        firstName: string | null;
        lastName: string | null;
        email: string;
        emailVerified: boolean;
        twoFactorEnabled: boolean;
    };
}

export default function AccountForm({ user }: Props) {
    const t = useTranslations("Account");
    const tCommon = useTranslations("Common");
    const [loading, setLoading] = useState(false);
    const [account_id, setAccountId] = useState(user.accountId);
    const [username, setUsername] = useState(user.username);
    const [firstName, setFirstName] = useState(user.firstName || "");
    const [lastName, setLastName] = useState(user.lastName || "");
    const [email, setEmail] = useState(user.email);
    const [message, setMessage] = useState("");
    const router = useRouter();

    async function save() {
        if (!account_id || !username || !email)
            return ;
        setLoading(true);
        setMessage("");
        const res = await fetch("/api/auth/update", {
            method: "POST",
            headers: {"Content-Type": "application/json" },
            body: JSON.stringify({accountId: account_id, username, firstName, lastName, email}),
        });
        const data = await res.json();
        if (res.ok) {
            if (email !== user.email && user.twoFactorEnabled){
                setMessage(t("2fa disable"))
            } else {
                setMessage(tCommon("saved"));
            }
            router.refresh();
        } else {
            setMessage(data.error || tCommon("error"));
        }
        setLoading(false);
    }

    async function handleVerifyClick() {
        setLoading(true);
        await fetch("/api/auth/resend_code", { method: "POST" });
        router.push("/verify");
    }
    return (
        
        <div className="flex flex-col gap-4">
            <label>
                {t("accountName")}
                <input
                    className="border p-2 w-full"
                    value={account_id}
                    onChange={(e) => setAccountId(e.target.value)}/>
            </label>
            <label>
                {t("username")}
                <input
                    className="border p-2 w-full"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}/>
            </label>
            <label>
                {t("firstName")}
                <input
                    className="border p-2 w-full"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}/>
            </label>
            <label>
                {t("lastName")}
                <input
                    className="border p-2 w-full"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}/>
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
                        <button onClick={handleVerifyClick} className="text-blue-500 underline">
                            {t("verifyMyEmail")}
                        </button>
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
