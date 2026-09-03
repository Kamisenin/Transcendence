"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type SessionInfo = {
    id: string;
    ipAddress: string;
    createdAt: string;
    expiresAt: string;
    isCurrent: boolean;
};

export default function SessionList() {
    const t = useTranslations("Session");
    const tCommon = useTranslations("Common");
    const [sessions, setSessions] = useState<SessionInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    async function loadSessions() {
        setLoading(true);
        const res = await fetch("/api/auth/sessions");
        const data = await res.json();
        if (res.ok) {
            setSessions(data.sessions);
        }
        setLoading(false);
    }
    useEffect(() => {
        loadSessions();
    }, []);
    
    async function handleRevoke(sessionId: string) {
        setMessage("");
        const res = await fetch("/api/auth/sessions/revoke", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({sessionId}),
        });
        if (res.ok){
            loadSessions();
        } else {
            setMessage("Something went wrong")
        }
    }
    
    if (loading)
        return <p className="text-sm text-gray-500">{t("loading")}</p>;
    return (
        <div className="flex flex-col gap-3">
            <h2 className="font-semibold">{t("Active_sessions")}</h2>
            <ul className="flex flex-col gap-2">
                {sessions.map((s) => (
                    <li key={s.id} className="border p-2 rounded flex justify-between items-center text-sm">
                        <div>
                            <p>
                                {s.ipAddress === "::1" || s.ipAddress === "127.0.0.1" ? "Localhost" : s.ipAddress}{" "}
                                {s.isCurrent && (
                                    <span className="text-green-600 font-semibold">{t("device")}</span>
                                )}
                            </p>
                            <p className="text-gray-500">
                                {t("Since")} {new Date(s.createdAt).toLocaleString()}
                            </p>
                        </div>
                        {!s.isCurrent && (
                            <button
                                onClick={() => handleRevoke(s.id)}
                                className="text-red-600 underline"
                            >
                                {t("Revoke")}
                            </button>
                        )}
                    </li>
                ))}
            </ul>
            {message && <p className="text-sm  text-red-500">{message}</p>}
        </div>
    );
}
