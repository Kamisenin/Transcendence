"use client";

import { useState } from "react";
import { GripVertical, Trash2, Eye, Image as ImageIcon } from "lucide-react";

import VisibilityToggler from "@/components/page/VisibilityToggler";
import CreateTagModal from "@/components/tags/CreateTagModal";
import { Tag } from "../tags/tagType";
import InfoboxPreview from "./InfoboxPreview";
import TitleInput from "./TitleInput";
import DescriptionInput from "./DescriptionInput";
import TagManager from "../tags/TagManager";

export type { Tag };

export type InfoboxData = {
    title: string;
    imageUrl: string;
    description: string;
    tags: Tag[];
    canonicalNamespace?: string | null;
    public: boolean;
};

type Props = {
    accountId: string
    id: string;
    pageId: number;
    data: InfoboxData;
    onChange: (data: InfoboxData) => void;
    onDelete?: (id: string) => void;
    isReadOnly?: boolean;
    availableTagsPool?: Tag[];
    canonicalNamespace?: string | null;
};

export default function Infobox({ accountId, id, pageId, data, onChange, onDelete, isReadOnly = false, canonicalNamespace }: Props) {
    const [isPreview, setIsPreview] = useState(isReadOnly);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const updateField = (key: keyof InfoboxData, value: any) => onChange({ ...data, [key]: value });

    if (isReadOnly || isPreview) {
        return (
            <InfoboxPreview
                data={data}
                isReadOnly={isReadOnly}
                onEdit={() => setIsPreview(false)}
            />
        );
    }

    return (
        <div className="group relative h-full w-full bg-white rounded-xl border border-blue-200 ring-1 ring-blue-50 p-4 shadow-sm flex flex-col overflow-hidden">
            {/* En-tête */}
            <div className="pl-7 flex items-center justify-between border-b pb-2 mb-3 shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Page Options</span>
                <button
                    type="button"
                    onClick={() => setIsPreview(true)}
                    className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium px-2 py-1 rounded-md transition cursor-pointer"
                >
                    <Eye size={13} /> Preview
                </button>
            </div>

            {/* Formulaire défilant si redimensionné petit en hauteur */}
            <div className="pl-7 pr-1 space-y-3 flex-1 overflow-y-auto">
                <TitleInput pageId={pageId} title={data.title} onChange={(val) => updateField("title", val)} />

                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                        <ImageIcon size={12} /> URL de l'image
                    </label>
                    <input
                        type="text"
                        value={data.imageUrl}
                        onChange={(e) => updateField("imageUrl", e.target.value)}
                        placeholder="https://..."
                        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 bg-white"
                    />
                </div>

                <DescriptionInput value={data.description} onChange={(val) => updateField("description", val)} />

                <TagManager
                    pageId={pageId}
                    data={data}
                    onChange={onChange}
                    onOpenModal={() => setIsCreateModalOpen(true)}
                />
            </div>

            <CreateTagModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onTagCreated={(newTag) => onChange({ ...data, tags: [...(data.tags || []), newTag] })}
            />

            <VisibilityToggler
                isPublic={data.public ?? true}
                onChange={(newPublicState) => updateField("public", newPublicState)}
            />
        </div>
    );
}