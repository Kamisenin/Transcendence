"use client";

import React from "react";
import { useTranslations } from "next-intl";

type Props = {
    isPublic: boolean;
    onChange: (isPublic: boolean) => void;
};

export default function VisibilityToggler({ isPublic, onChange }: Props) {
    const t = useTranslations("Common");
    return (
        <div className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-t border-gray-100 pt-2">
            <label className="flex min-w-0 cursor-pointer select-none items-center gap-1.5 text-xs font-medium text-gray-600">
                <span>{t('visibility')}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    isPublic ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                }`}>
                    {isPublic ? t('public') : t('private')}
                </span>
            </label>

            <label className="relative ml-auto inline-flex shrink-0 cursor-pointer items-center">
                <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => onChange(e.target.checked)}
                    className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#ead7d0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#fffaf7] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#fffaf7] after:border-[#d9bfb7] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#800000]"></div>
            </label>
        </div>
    );
}