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
import { addPagePermission } from '@/actions/pages';

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
    onDelete?: (id: string) => void;
    isReadOnly?: boolean;
    availableTagsPool?: Tag[];
    canonicalNamespace?: string | null;
    isOwner?: boolean;
};

export default function Infobox({ accountId, id, pageId, data, onChange, onDelete, isReadOnly = false, canonicalNamespace, isOwner = false }: Props) {
    const t = useTranslations("Page");
    const tCommon = useTranslations("Common");
    const tTags = useTranslations("Tags");
    const [isPreview, setIsPreview] = useState(isReadOnly);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isPermModalOpen, setIsPermModalOpen] = useState(false);
    const [permUser, setPermUser] = useState("");
    const [permLevel, setPermLevel] = useState<'READ' | 'WRITE' | 'ADMIN'>('READ');
    const [permError, setPermError] = useState<string | null>(null);
    const [permLoading, setPermLoading] = useState(false);

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

    async function handleAddPermission() {
        setPermError(null);
        setPermLoading(true);
        try {
            const res = await addPagePermission(pageId, permUser, permLevel as any);
            if ((res as any)?.success) {
                alert(tCommon('saved'));
                setIsPermModalOpen(false);
                setPermUser('');
            } else {
                setPermError((res as any)?.error || 'Error');
            }
        } catch (e: any) {
            setPermError(e.message || 'Error');
        } finally {
            setPermLoading(false);
        }
    }

    return (
        <div className="group relative h-full w-full bg-white rounded-xl border border-blue-200 ring-1 ring-blue-50 p-4 shadow-sm flex flex-col overflow-hidden">
            {/* En-tête */}
            <div className="pl-7 flex items-center justify-between border-b pb-2 mb-3 shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('options')}</span>
                <div className="flex items-center gap-2">
                    {isOwner && (
                        <button
                            type="button"
                            onClick={() => setIsPermModalOpen(true)}
                            className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium px-2 py-1 rounded-md transition cursor-pointer"
                        >
                            {tTags('roles.managePageAccess')}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setIsPreview(true)}
                        className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium px-2 py-1 rounded-md transition cursor-pointer"
                    >
                        <Eye size={13} /> {t('editor.preview')}
                    </button>
                </div>
            </div>

            {/* Formulaire défilant si redimensionné petit en hauteur */}
            <div className="pl-7 pr-1 space-y-3 flex-1 overflow-y-auto">
                <TitleInput pageId={pageId} title={data.title} onChange={(val) => updateField("title", val)} />

                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                        <ImageIcon size={12} /> {t('imageUrlLabel')}
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
                    accountId={accountId!}
                    pageId={pageId}
                    data={data}
                    onChange={onChange}
                    onOpenModal={() => setIsCreateModalOpen(true)}
                />
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

            {isPermModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white p-4 rounded-lg w-96">
                        <h3 className="font-semibold mb-2">{tTags('confirmDeletion') /* reuse a generic label */}</h3>
                        <p className="text-sm text-gray-600 mb-3">{tTags('managePageAccess')}</p>

                        <div className="mb-3">
                            <input
                                placeholder="User token"
                                value={permUser}
                                onChange={(e) => setPermUser(e.target.value)}
                                className="w-full border rounded px-2 py-1 text-sm"
                            />
                        </div>

                        <div className="mb-3">
                            <select value={permLevel} onChange={(e) => setPermLevel(e.target.value as any)} className="w-full border rounded px-2 py-1 text-sm">
                                <option value="READ">READ</option>
                                <option value="WRITE">WRITE</option>
                                <option value="ADMIN">ADMIN</option>
                            </select>
                        </div>

                        {permError && <div className="text-sm text-red-600 mb-2">{permError}</div>}

                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setIsPermModalOpen(false)} className="px-3 py-1 rounded bg-gray-100">{tCommon('cancel')}</button>
                            <button onClick={handleAddPermission} disabled={permLoading || !permUser.trim()} className="px-3 py-1 rounded bg-blue-600 text-white">{permLoading ? tCommon('saving') : tCommon('save')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
