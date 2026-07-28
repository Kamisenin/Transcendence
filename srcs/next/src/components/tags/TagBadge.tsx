"use client";

import { X } from "lucide-react";
import { Tag } from "./tagType";

type TagBadgeProps = {
    tag: Tag;
    onRemove?: () => void;
};

export default function TagBadge({ tag, onRemove }: TagBadgeProps) {
    return (
        <span
            style={{
                backgroundColor: `${tag.color}15`,
                color: tag.color,
                borderColor: `${tag.color}30`,
            }}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium border rounded-full shrink-0"
        >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
            {tag.name}
            {onRemove && (
                <button type="button" onClick={onRemove} className="hover:opacity-75 p-0.5 ml-0.5 cursor-pointer">
                    <X size={10} />
                </button>
            )}
        </span>
    );
}