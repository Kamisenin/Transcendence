"use client";

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { updateTagInfo, deleteTag } from '@/actions/tags';
import type { TagCapabilities } from '%/lib/tag_permissions';
import { type Tag } from './TagManagement';

type Props = {
    tag: Tag;
    capabilities: TagCapabilities;
};

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export default function TagSettingsPanel({ tag, capabilities }: Props) {
    const t = useTranslations('Tags');
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState(tag.name);
    const [description, setDescription] = useState(tag.description ?? '');
    const [color, setColor] = useState(
        tag.color ? `#${tag.color.toString(16).padStart(6, '0')}` : '#3b82f6'
    );
    const [namespace, setNamespace] = useState(tag.namespace ?? '');

    // Delete confirmation state
    const [deleteStep, setDeleteStep] = useState(0);
    const [deleteStatus, setDeleteStatus] = useState<string | null>(null);

    function handleSave() {
        setError(null);
        startTransition(async () => {
            try {
                await updateTagInfo(tag.id, {
                    name,
                    description,
                    color: parseInt(color.replace('#', ''), 16),
                    namespace
                });
            } catch (e: any) {
                setError(e.message);
            }
        });
    }

    function getDeleteButtonText() {
        if (isPending && deleteStatus) return deleteStatus;
        if (deleteStep === 0) return t('deleteTagBtn');
        if (deleteStep === 1) return t('confirmDeletion');
        if (deleteStep === 2) return t('lastConfirmation');
        return t('deleteTagBtn');
    }

    function handleDelete() {
        setError(null);

        if (deleteStep < 2) {
            setDeleteStep((s) => s + 1);
            return;
        }

        startTransition(async () => {
            try {
                setDeleteStatus(t('deletingInProgress'));
                await deleteTag(tag.id);
                setDeleteStatus(t('tagDeletedRedirecting'));
            } catch (e: any) {
                setError(e.message ?? t('deleteError'));
                setDeleteStep(0);
                setDeleteStatus(null);
            }
        });
    }

    if (!capabilities.canEditInfo && !capabilities.canDeleteTag) {
        return <p className="text-sm text-[#8a6b63]">{t('noAccessToPage')}</p>;
    }

    return (
        <div className="max-w-md">
            {error && (
                <div className="mb-4 rounded-md border border-[#e6b8b0] bg-[#fff1ef] p-3 text-sm text-[#a33a2b]">
                    {error}
                </div>
            )}

            {capabilities.canEditInfo && (
                <div className="space-y-3 mb-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('name')}</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-md border border-[#d9bfb7] bg-[#fffaf7] px-3 py-2 text-sm outline-none focus:border-[#800000]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('description')}</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full rounded-md border border-[#d9bfb7] bg-[#fffaf7] px-3 py-2 text-sm outline-none focus:border-[#800000]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('color')}</label>
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="h-9 w-16 cursor-pointer rounded-md border border-[#d9bfb7] bg-[#fffaf7] p-1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('namespace')}</label>
                        <div className="flex items-center gap-1 text-sm text-[#8a6b63]">
                            <span>/wiki/</span>
                            <input
                                type="text"
                                value={namespace}
                                onChange={(e) => setNamespace(slugify(e.target.value))}
                                placeholder={t('namespacePlaceholderShort')}
                                className="flex-1 rounded-md border border-[#d9bfb7] bg-[#fffaf7] px-2 py-1.5 text-sm text-[#3f2924] outline-none focus:border-[#800000]"
                            />
                            <span>/page-title</span>
                        </div>
                        <p className="mt-1 text-xs text-[#a89088]">
                            {t('namespaceHint')}
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isPending || !name.trim()}
                        className="rounded-md bg-[#800000] px-4 py-1.5 text-sm font-semibold text-[#fffaf7] transition hover:bg-[#5f0000] disabled:opacity-50"
                    >
                        {t('save')}
                    </button>
                </div>
            )}

            {capabilities.canDeleteTag && (
                <div className="border-t border-[#d9bfb7] pt-5">
                    <p className="mb-2 text-sm font-semibold text-[#8a6b63]">{t('dangerousZone')}</p>
                    <button
                        onClick={handleDelete}
                        disabled={isPending}
                        className="rounded-md border border-[#e6b8b0] bg-[#fff1ef] px-4 py-1.5 text-sm font-semibold text-[#a33a2b] transition hover:bg-[#f9dcd7] disabled:opacity-50"
                    >
                        {getDeleteButtonText()}
                    </button>

                    {deleteStep > 0 && !isPending && (
                        <p className="mt-2 text-xs text-[#a33a2b]">
                            {t('deleteIrreversible')}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}