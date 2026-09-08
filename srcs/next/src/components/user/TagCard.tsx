import Link from "next/link";
import { Tag } from "@prisma/client";

type Props = {
    tag: Tag;
};

function getTagColor(color: number | null) {
    return color === null
        ? "#800000"
        : `#${color.toString(16).padStart(6, "0")}`;
}

export default function TagCard({ tag }: Props) {
    const tagColor = getTagColor(tag.color);

    return (
        <Link
            href={`/tags/${encodeURIComponent(tag.name)}`}
            className="group block border border-[#d9bfb7] bg-[#fffaf7] p-3 transition-colors hover:border-[#800000] hover:bg-[#f7e9e2]"
            style={{ borderLeftColor: tagColor, borderLeftWidth: "4px" }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate font-semibold text-[#800000] group-hover:underline">
                        #{tag.name}
                    </p>
                    {tag.namespace && (
                        <p className="mt-1 truncate font-mono text-[11px] text-[#8a6b63]">
                            {tag.namespace}
                        </p>
                    )}
                </div>
                <span
                    aria-hidden="true"
                    className="mt-1 h-3 w-3 shrink-0 rounded-full border border-black/10"
                    style={{ backgroundColor: tagColor }}
                />
            </div>
            {tag.description && (
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#6f5b55]">
                    {tag.description}
                </p>
            )}
        </Link>
    );
}
