"use client";

import { useEffect, useRef } from "react";

type DescriptionInputProps = {
    value: string;
    onChange: (value: string) => void;
};

export default function DescriptionInput({ value, onChange }: DescriptionInputProps) {
    const ref = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.style.height = "auto";
            ref.current.style.height = `${ref.current.scrollHeight}px`;
        }
    }, [value]);

    return (
        <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
                ref={ref}
                rows={1}
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Ajouter une description..."
                className="w-full text-xs text-gray-600 border-b border-gray-200 focus:border-blue-400 outline-none resize-none overflow-hidden p-1 block bg-transparent"
            />
        </div>
    );
}