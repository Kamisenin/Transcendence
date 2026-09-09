"use client";

import { X } from "lucide-react";
import { Tag } from "./tagType";
import Link from "next/link";
import { useTranslations } from "next-intl";

type TagBadgeProps = {
    tag: Tag;
    onRemove?: () => void;
};

export default function TagBadge({ tag, onRemove }: TagBadgeProps) {
    const t = useTranslations("Tags");
    return (
            <span
                style={{
                    backgroundColor: `${tag.color}15`,
                    color: tag.color,
                    borderColor: `${tag.color}30`,
                }}
                title={tag.pending ? t("tagPendingApproval") : undefined}
                className={`inline-flex min-w-0 max-w-full items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0 ${
                    tag.pending ? "opacity-40" : ""
                }`}
            >
                <Link href={`/tags/${tag.namespace}`}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                    <span className="min-w-0 break-words">{tag.name}</span>
                </Link>
                {onRemove && (
                    <button type="button" onClick={onRemove} className="hover:opacity-75 p-0.5 ml-0.5 cursor-pointer">
                        <X size={10} />
                    </button>
                )}
            </span>
    );
}