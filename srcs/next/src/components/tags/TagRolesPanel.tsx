"use client";

import { useState, useTransition } from 'react';
import { createTagRole, updateTagRole, deleteTagRole } from '@/actions/tags';
import type { TagCapabilities } from '@/lib/tag-permissions';

type Role = {
    id: number;
    roleName: string;
    hierarchyLevel: number;
    canManageMembers: boolean;
    canManageRoles: boolean;
    canEditInfo: boolean;
    canDeleteTag: boolean;
    canAddPage: boolean;
    canRevokePage: boolean;
    canManagePageGrants: boolean;
    canReviewRequests: boolean;
};

type Props = {
    tagId: number;
    roles: Role[];
    capabilities: TagCapabilities;
};

const PERMISSION_FIELDS: { key: keyof Role; label: string }[] = [
    { key: 'canManageMembers', label: 'Gérer les membres' },
    { key: 'canManageRoles', label: 'Gérer les rôles' },
    { key: 'canEditInfo', label: 'Éditer les infos du tag' },
    { key: 'canDeleteTag', label: 'Supprimer le tag' },
    { key: 'canAddPage', label: 'Ajouter une page' },
    { key: 'canRevokePage', label: 'Révoquer une page' },
    { key: 'canManagePageGrants', label: 'Gérer les accès de page' },
    { key: 'canReviewRequests', label: 'Traiter les demandes' },
];

const emptyForm = (hierarchyLevel: number) => ({
    roleName: '',
    hierarchyLevel,
    canManageMembers: false,
    canManageRoles: false,
    canEditInfo: false,
    canDeleteTag: false,
    canAddPage: false,
    canRevokePage: false,
    canManagePageGrants: false,
    canReviewRequests: false,
});

export default function TagRolesPanel({ tagId, roles, capabilities }: Props) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<number | 'new' | null>(null);
    const nextLevel = roles.length > 0 ? Math.max(...roles.map(r => r.hierarchyLevel)) + 1 : 1;
    const [form, setForm] = useState(emptyForm(nextLevel));

    function canManage(role: Role) {
        return capabilities.canManageRoles && (capabilities.isOwner || capabilities.rank > role.hierarchyLevel);
    }

    function startEdit(role: Role) {
        setForm(role);
        setEditingId(role.id);
    }

    function startCreate() {
        setForm(emptyForm(nextLevel));
        setEditingId('new');
    }

    function handleSubmit() {
        setError(null);
        startTransition(async () => {
            try {
                if (editingId === 'new') {
                    await createTagRole(tagId, form);
                } else if (editingId !== null) {
                    await updateTagRole(tagId, editingId, form);
                }
                setEditingId(null);
            } catch (e: any) {
                setError(e.message);
            }
        });
    }

    function handleDelete(roleId: number) {
        if (!confirm("Supprimer ce rôle ? Les membres l'ayant perdront leur accès lié.")) return;
        setError(null);
        startTransition(async () => {
            try {
                await deleteTagRole(tagId, roleId);
            } catch (e: any) {
                setError(e.message);
            }
        });
    }

    return (
        <div>
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
                    {error}
                </div>
            )}

            <div className="space-y-2 mb-4">
                {roles.sort((a, b) => b.hierarchyLevel - a.hierarchyLevel).map(role => (
                    <div key={role.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="font-medium text-sm">{role.roleName}</span>
                                <span className="ml-2 text-xs text-gray-400">rang {role.hierarchyLevel}</span>
                            </div>
                            {canManage(role) && (
                                <div className="flex gap-2">
                                    <button onClick={() => startEdit(role)} className="text-xs text-blue-600 hover:underline">
                                        Modifier
                                    </button>
                                    <button onClick={() => handleDelete(role.id)} className="text-xs text-red-500 hover:underline">
                                        Supprimer
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {capabilities.canManageRoles && editingId === null && (
                <button
                    onClick={startCreate}
                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg"
                >
                    + Nouveau rôle
                </button>
            )}

            {editingId !== null && (
                <div className="mt-4 border rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <input
                            type="text"
                            placeholder="Nom du rôle"
                            value={form.roleName}
                            onChange={(e) => setForm({ ...form, roleName: e.target.value })}
                            className="border rounded px-2 py-1 text-sm"
                        />
                        <input
                            type="number"
                            placeholder="Rang"
                            value={form.hierarchyLevel}
                            disabled={!capabilities.isOwner}
                            onChange={(e) => setForm({ ...form, hierarchyLevel: Number(e.target.value) })}
                            className="border rounded px-2 py-1 text-sm disabled:bg-gray-100"
                            title={!capabilities.isOwner ? "Rang limité à ton propre niveau ou en dessous" : ""}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {PERMISSION_FIELDS.map(f => (
                            <label key={f.key} className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form[f.key] as boolean}
                                    onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })}
                                />
                                {f.label}
                            </label>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleSubmit}
                            disabled={isPending || !form.roleName.trim()}
                            className="text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg"
                        >
                            Enregistrer
                        </button>
                        <button
                            onClick={() => setEditingId(null)}
                            className="text-sm px-3 py-1.5 rounded-lg hover:bg-gray-100"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}