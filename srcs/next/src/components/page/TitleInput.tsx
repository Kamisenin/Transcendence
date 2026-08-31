"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { checkTitleAvailability } from "@/actions/pages";
import { useTranslations } from "next-intl";

type TitleInputProps = {
    pageId: number;
    title: string;
    onChange: (value: string) => void;
};

export default function TitleInput({ pageId, title, onChange }: TitleInputProps) {
    const t = useTranslations("Page");
    const [status, setStatus] = useState<{ checking: boolean; available: boolean | null; slug: string }>({
        checking: false,
        available: null,
        slug: "",
    });

    useEffect(() => {
        if (!title?.trim()) {
            setStatus({ checking: false, available: null, slug: "" });
            return;
        }

        setStatus((p) => ({ ...p, checking: true }));
        const timer = setTimeout(async () => {
            const res = await checkTitleAvailability(pageId, title);
            setStatus({ checking: false, available: res.available, slug: res.slug });
        }, 400);

        return () => clearTimeout(timer);
    }, [title, pageId]);

    return (
        <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t("titleLabel")}</label>
            <input
                type="text"
                value={title}
                onChange={(e) => onChange(e.target.value)}
                placeholder={t("titlePlaceholder")}
                className="w-full text-sm font-semibold border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 bg-white"
            />
            {title?.trim() !== "" && (
                <div className="mt-1 text-xs flex items-center gap-1.5">
                    {status.checking ? (
                        <span className="text-gray-400">{t("checkingAvailability")}</span>
                    ) : status.available ? (
                        <span className="text-emerald-600 flex items-center gap-1 font-medium">
                            <CheckCircle2 size={12} /> {t("available")} (/{status.slug})
                        </span>
                    ) : status.available === false ? (
                        <span className="text-rose-500 flex items-center gap-1 font-medium">
                            <AlertCircle size={12} /> {t("titleAlreadyUsed")}
                        </span>
                    ) : null}
                </div>
            )}
        </div>
    );
}
