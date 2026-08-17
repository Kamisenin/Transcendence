"use client";

import { useState, useTransition } from 'react';
import { updateTagInfo, deleteTag } from '@/actions/tags';
import type { TagCapabilities } from '@/lib/tag-permissions';

type Tag = {
    id: number;
    name: string;
    description: string | null;
    color: number | null;
    namespace: string | null;
};

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
        if (deleteStep === 0) return 'Delete Tag';
        if (deleteStep === 1) return 'Confirmer la suppression';
        if (deleteStep === 2) return 'Dernière confirmation';
        return 'Delete Tag';
    }

    function handleDelete() {
        setError(null);

        if (deleteStep < 2) {
            setDeleteStep((s) => s + 1);
            return;
        }

        startTransition(async () => {
            try {
                setDeleteStatus('Suppression en cours...');
                await deleteTag(tag.id); // ta fonction gère déjà la redirection
                setDeleteStatus('Tag supprimé, redirection...');
            } catch (e: any) {
                setError(e.message ?? 'Erreur lors de la suppression');
                setDeleteStep(0);
                setDeleteStatus(null);
            }
        });
    }

    if (!capabilities.canEditInfo && !capabilities.canDeleteTag) {
        return <p className="text-sm text-gray-400">You do not have the current access right to this page.</p>;
    }

    return (
        <div className="max-w-md">
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
                    {error}
                </div>
            )}

            {capabilities.canEditInfo && (
                <div className="space-y-3 mb-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border rounded px-3 py-1.5 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full border rounded px-3 py-1.5 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Color</label>
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-16 h-8 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Namespace</label>
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                            <span>/wiki/</span>
                            <input
                                type="text"
                                value={namespace}
                                onChange={(e) => setNamespace(slugify(e.target.value))}
                                placeholder="mon-tag"
                                className="flex-1 border rounded px-2 py-1 text-sm text-gray-900"
                            />
                            <span>/page-title</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Allows pages that use this tag to use its namespace instead of the user's namespace
                            leave empty to remove
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isPending || !name.trim()}
                        className="text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg"
                    >
                        Save
                    </button>
                </div>
            )}

            {capabilities.canDeleteTag && (
                <div className="border-t pt-4">
                    <p className="text-sm text-gray-500 mb-2">Dangerous Zone</p>
                    <button
                        onClick={handleDelete}
                        disabled={isPending}
                        className="text-sm bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 px-4 py-1.5 rounded-lg"
                    >
                        {getDeleteButtonText()}
                    </button>

                    {deleteStep > 0 && !isPending && (
                        <p className="text-xs text-red-500 mt-2">
                            This action is irreversible.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}