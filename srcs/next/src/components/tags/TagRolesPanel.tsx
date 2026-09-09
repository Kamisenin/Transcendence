"use client";

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { createTagRole, updateTagRole, deleteTagRole } from '@/actions/tags';
import type { TagCapabilities } from '%/lib/tag_permissions';

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

type RoleForm = Omit<Role, 'id'>;

type Props = {
    tagId: number;
    roles: Role[];
    capabilities: TagCapabilities;
};

type PermissionKey = { [K in keyof RoleForm]: RoleForm[K] extends boolean ? K : never; } [keyof RoleForm];

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
    const t = useTranslations('Tags.roles');
    const tCommon = useTranslations('Common');

    const permissionFields: { key: PermissionKey; label: string }[] = [
        { key: 'canManageMembers', label: t('manageMembers') },
        { key: 'canManageRoles', label: t('manageRoles') },
        { key: 'canEditInfo', label: t('editTagInfo') },
        { key: 'canDeleteTag', label: t('deleteTag') },
        { key: 'canAddPage', label: t('addPage') },
        { key: 'canRevokePage', label: t('revokePage') },
        { key: 'canManagePageGrants', label: t('managePageAccess') },
        { key: 'canReviewRequests', label: t('handleRequests') },
    ];

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

    function handleDelete(roleId : number) {
        if (!confirm(t('deleteRoleConfirm'))) return;
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
                <div className="mb-4 rounded-md border border-[#e6b8b0] bg-[#fff1ef] p-3 text-sm text-[#a33a2b]">
                    {error}
                </div>
            )}

            <div className="space-y-2 mb-4">
                {roles.sort((a, b) => b.hierarchyLevel - a.hierarchyLevel).map(role => (
                    <div key={role.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="font-medium text-sm">{role.roleName}</span>
                                <span className="ml-2 text-xs text-[#a89088]">{t('hierarchyLevelPlaceholder')} {role.hierarchyLevel}</span>
                            </div>
                            {canManage(role) && (
                                <div className="flex gap-2">
                                    <button onClick={() => startEdit(role)} className="rounded-md px-2 py-1 text-xs font-semibold text-[#800000] hover:bg-[#f7e9e2]">
                                        {t('editTagInfo')}
                                    </button>
                                    <button onClick={() => handleDelete(role.id)} className="rounded-md px-2 py-1 text-xs font-semibold text-[#a33a2b] hover:bg-[#fff1ef]">
                                        {t('deleteTag')}
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
                    className="rounded-md bg-[#800000] px-3 py-1.5 text-sm font-semibold text-[#fffaf7] transition hover:bg-[#5f0000]"
                >
                    {t('newRole')}
                </button>
            )}

            {editingId !== null && (
                <div className="mt-4 rounded-lg border border-[#d9bfb7] bg-[#f7e9e2] p-4">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <input
                            type="text"
                            placeholder={t('roleNamePlaceholder')}
                            value={form.roleName}
                            onChange={(e) => setForm({ ...form, roleName: e.target.value })}
                            className="border rounded px-2 py-1 text-sm"
                        />
                        <input
                            type="number"
                            placeholder={t('hierarchyLevelPlaceholder')}
                            value={form.hierarchyLevel}
                            disabled={!capabilities.isOwner}
                            onChange={(e) => setForm({ ...form, hierarchyLevel: Number(e.target.value) })}
                            className="rounded-md border border-[#d9bfb7] bg-[#fffaf7] px-2 py-1 text-sm outline-none focus:border-[#800000] disabled:bg-[#ead7d0]"
                            title={!capabilities.isOwner ? t('hierarchyHint') : ''}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {permissionFields.map(f => (
                            <label key={f.key} className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form[f.key]}
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
                            className="rounded-md bg-[#800000] px-3 py-1.5 text-sm font-semibold text-[#fffaf7] transition hover:bg-[#5f0000] disabled:opacity-50"
                        >
                            {tCommon('save')}
                        </button>
                        <button
                            onClick={() => setEditingId(null)}
                            className="rounded-md px-3 py-1.5 text-sm font-semibold text-[#8a6b63] hover:bg-[#ead7d0]"
                        >
                            {tCommon('cancel')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}