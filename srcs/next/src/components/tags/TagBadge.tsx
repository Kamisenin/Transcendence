"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Tag } from "./tagType";
import { getTagPageState, TagWithPending } from "@/actions/tags";

type TagBadgeProps = {
    tagId: string;
    pageId: number;
    onRemove?: () => void;
};

export default function TagBadge({ tagId, pageId, onRemove }: TagBadgeProps) {
    const t = useTranslations("Tags");
    const [tag, setTag] = useState<TagWithPending | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;

        async function fetchTag() {
            setLoading(true);
            const fetchedTag = await getTagPageState(tagId, pageId);
            if (isMounted) {
                setTag(fetchedTag);
                setLoading(false);
            }
        }

        fetchTag();

        return () => {
            isMounted = false;
        };
    }, [tagId, pageId]);

    if (loading) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs text-gray-400 shrink-0 animate-pulse">
                <Loader2 size={10} className="animate-spin" />
                <span>...</span>
            </span>
        );
    }

    if (!tag) {
        return null;
    }

    const tagColor = tag.color ? `#${tag.color.toString(16).padStart(6, "0")}` : "#000000";
    const backgroundColor = tag.pending ? "transparent" : `${tagColor}15`;
    const borderColor = tag.pending ? `${tagColor}30` : `${tagColor}50`;

    console.log("Tag :", tag.name, "Pending:", tag.pending);
    return (
        <span
            style={{
                backgroundColor,
                color: tagColor,
                borderColor,
            }}
            title={tag.pending ? t("tagPendingApproval") : undefined}
            className={`inline-flex min-w-0 max-w-full items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0 ${
                tag.pending ? "opacity-60" : ""
            }`}
        >
            <Link 
                href={`/tags/${tag.namespace}`} 
                className="inline-flex items-center gap-1 min-w-0 hover:underline"
                style={{ color: "inherit" }}
            >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tagColor }} />
                <span className="min-w-0 break-words">{tag.name}</span>
            </Link>
            {onRemove && (
                <button 
                    type="button" 
                    onClick={onRemove} 
                    className="hover:opacity-75 p-0.5 ml-0.5 cursor-pointer"
                >
                    <X size={10} />
                </button>
            )}
        </span>
    );
}