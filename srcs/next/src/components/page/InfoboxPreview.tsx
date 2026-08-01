"use client";

import { useState } from "react";
import { Edit3, ChevronDown, ChevronUp } from "lucide-react";
import TagBadge from "../tags/TagBadge";
import { InfoboxData } from "./Infobox";

type InfoboxPreviewProps = {
    data: InfoboxData;
    isReadOnly?: boolean;
    onEdit?: () => void;
};

export default function InfoboxPreview({ data, isReadOnly, onEdit }: InfoboxPreviewProps) {
    const [showAllTags, setShowAllTags] = useState(false);
    const maxVisible = 4;
    const tags = data.tags || [];
    const visibleTags = showAllTags ? tags : tags.slice(0, maxVisible);

    return (
        <div className="h-full w-full bg-white rounded-xl border border-gray-200 shadow-xs p-4 flex flex-col gap-2.5 overflow-y-auto">
            {!isReadOnly && onEdit && (
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 text-xs shrink-0">
                    <span className="font-semibold text-blue-600 uppercase tracking-wider">Mode Prévisualisation</span>
                    <button
                        type="button"
                        onClick={onEdit}
                        className="flex items-center gap-1 text-gray-600 hover:text-blue-600 bg-gray-100 px-2 py-1 rounded cursor-pointer"
                    >
                        <Edit3 size={13} /> Éditer
                    </button>
                </div>
            )}

            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-1.5 leading-tight shrink-0">
                {data.title || <span className="text-gray-300 italic">Sans titre</span>}
            </h2>

            {data.imageUrl?.trim() && (
                <div className="rounded-lg overflow-hidden border border-gray-100 bg-gray-50 max-h-48 flex justify-center items-center shrink-0">
                    <img src={data.imageUrl} alt={data.title} className="w-full h-full object-cover" />
                </div>
            )}

            {data.description?.trim() && (
                <p className="text-xs text-gray-600 leading-normal whitespace-pre-wrap m-0 p-0">
                    {data.description}
                </p>
            )}

            {tags.length > 0 && (
                <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-1.5 items-center shrink-0">
                    {visibleTags.map((tag) => (
                        <TagBadge key={tag.id} tag={tag} />
                    ))}
                    {tags.length > maxVisible && (
                        <button
                            type="button"
                            onClick={() => setShowAllTags(!showAllTags)}
                            className="text-xs text-gray-500 hover:text-blue-600 font-medium flex items-center gap-0.5 ml-1 cursor-pointer"
                        >
                            {showAllTags ? <>Moins <ChevronUp size={12} /></> : <>+{tags.length - maxVisible} plus <ChevronDown size={12} /></>}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}