"use client";

import React from "react";

type Props = {
    isPublic: boolean;
    onChange: (isPublic: boolean) => void;
};

export default function VisibilityToggler({ isPublic, onChange }: Props) {
    return (
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5 cursor-pointer select-none">
                <span>Visibility</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    isPublic ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                }`}>
                    {isPublic ? 'Public' : 'Private'}
                </span>
            </label>

            <label className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => onChange(e.target.checked)}
                    className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
        </div>
    );
}