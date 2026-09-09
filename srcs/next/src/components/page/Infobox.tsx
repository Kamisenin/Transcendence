"use client";

import { useState } from "react";
import { GripVertical, Trash2, Eye, Image as ImageIcon } from "lucide-react";

import VisibilityToggler from "@/components/page/VisibilityToggler";
import CreateTagModal from "@/components/tags/CreateTagModal";
import { useTranslations } from "next-intl";
import { Tag } from "../tags/tagType";
import InfoboxPreview from "./InfoboxPreview";
import TitleInput from "./TitleInput";
import DescriptionInput from "./DescriptionInput";
import TagManager from "../tags/TagManager";
import PagePermissions from "./PagePermissions";

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
    accountId: string | undefined
    id: string;
    pageId: number;
    data: InfoboxData;
    onChange?: (data: InfoboxData) => void;
    isReadOnly?: boolean;
    availableTagsPool?: Tag[];
    canonicalNamespace?: string | null;
    ownerAccountId?: string;
    initialPermissions?: any[];
    isOwner?: boolean;
};

export default function Infobox({ accountId, id, pageId, data, onChange, isReadOnly = false, canonicalNamespace, ownerAccountId, initialPermissions = [], isOwner = false }: Props) {
    const t = useTranslations("Page");
    const [isPreview, setIsPreview] = useState(isReadOnly);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const updateField = (key: keyof InfoboxData, value: any) => onChange?.({ ...data, [key]: value });

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
        <div className="group relative h-full w-full min-w-0 bg-[#fffaf7] rounded-xl border border-[#d9bfb7] ring-1 ring-[#ead7d0] p-2 sm:p-4 shadow-sm flex flex-col overflow-hidden">
            <div className="absolute left-2 top-2 z-10 flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#fffaf7]/90 backdrop-blur-sm rounded border border-[#ead7d0] shadow-xs p-0.5">
                <button
                    type="button"
                    className="drag-handle cursor-grab active:cursor-grabbing p-1 rounded hover:bg-[#f7e9e2] text-[#a89088]"
                    title={t("editor.moveBlock")}
                >
                    <GripVertical size={14} />
                </button>
            </div>

            {/* En-tête */}
            <div className="pl-0 sm:pl-7 flex flex-wrap items-center justify-between gap-2 border-b pb-2 mb-3 shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('options')}</span>
                <button
                    type="button"
                    onClick={() => setIsPreview(true)}
                    className="flex items-center gap-1 text-xs bg-[#f7e9e2] text-[#800000] hover:bg-[#ead7d0] font-medium px-2 py-1 rounded-md transition cursor-pointer"
                >
                    <Eye size={13} /> {t('preview')}
                </button>
            </div>

            {/* Formulaire défilant si redimensionné petit en hauteur */}
            <div className="pl-0 sm:pl-7 pr-0 sm:pr-1 space-y-3 flex-1 min-h-0 overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>
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
                        className="w-full min-w-0 text-xs border border-[#d9bfb7] rounded-lg px-3 py-1.5 outline-none focus:border-[#800000] bg-[#fffaf7]"
                    />
                </div>

                <DescriptionInput value={data.description} onChange={(val) => updateField("description", val)} />

                <TagManager
                    accountId={accountId!}
                    pageId={pageId}
                    data={data}
                    onChange={onChange}
                    onOpenModal={() => setIsCreateModalOpen(true)}
                />

                {isOwner && ownerAccountId && (
                    <PagePermissions
                        pageId={pageId}
                        ownerAccountId={ownerAccountId}
                        initialPermissions={initialPermissions}
                    />
                )}
            </div>

            <CreateTagModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onTagCreated={(newTag) => onChange?.({ ...data, tags: [...(data.tags || []), newTag] })}
            />

            <VisibilityToggler
                isPublic={data.public ?? true}
                onChange={(newPublicState) => updateField("public", newPublicState)}
            />
        </div>
    );
}