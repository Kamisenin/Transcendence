"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

type DescriptionInputProps = {
    value: string;
    onChange: (value: string) => void;
};

export default function DescriptionInput({ value, onChange }: DescriptionInputProps) {
    const t = useTranslations("Page");
    const tCommon = useTranslations("Common");
    const ref = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.style.height = "auto";
            ref.current.style.height = `${ref.current.scrollHeight}px`;
        }
    }, [value]);

    return (
        <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{tCommon("description")}</label>
            <textarea
                ref={ref}
                rows={1}
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder={t("descriptionPlaceholder")}
                className="w-full text-xs text-[#6f4d44] border-b border-[#d9bfb7] focus:border-[#800000] outline-none resize-none overflow-hidden p-1 block bg-transparent"
            />
        </div>
    );
}
