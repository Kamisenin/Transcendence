"use client";

import { useState, useTransition } from 'react';
import { assignTagRole, removeTagMember } from '@/actions/tags';
import AddMember from './AddMember';

import type { TagCapabilities } from '%/lib/tag_permissions';

type Role = {
    id: number;
    roleName: string;
    hierarchyLevel: number;
};

export type Member = {
    tagId: number;
    userToken: string;
    roleId: number;
    user: { user_id: string; username: string; imgLink: string };
    role: Role;
};

type Props = {
    tagId: number;
    members: Member[];
    roles: Role[];
    capabilities: TagCapabilities;
    currentUserToken: string;
};

export default function TagMembersPanel({ tagId, members, roles, capabilities, currentUserToken }: Props) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // rôles que l'utilisateur courant peut assigner (strictement inférieurs à son rang)
    const assignableRoles = roles.filter(r => capabilities.isOwner || r.hierarchyLevel < capabilities.rank);

    function handleRoleChange(targetUserToken: string, roleId: number) {
        setError(null);
        startTransition(async () => {
            try {
                await assignTagRole(tagId, targetUserToken, roleId);
            } catch (e: any) {
                setError(e.message);
            }
        });
    }

    function handleRemove(targetUserToken: string) {
        if (!confirm("Retirer ce membre du tag ?")) return;
        setError(null);
        startTransition(async () => {
            try {
                await removeTagMember(tagId, targetUserToken);
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

            {capabilities.canManageMembers && (
                <div className="mb-6">
                    <AddMember
                        tagId={tagId}
                        assignableRoles={assignableRoles}
                        existingMemberTokens={members.map(m => m.userToken)}
                    />
                </div>
            )}

            <div className="divide-y border rounded-lg overflow-hidden">
                {members.length === 0 && (
                    <p className="p-4 text-sm text-gray-400">Aucun membre pour l'instant.</p>
                )}

                {members.map(member => {
                    const canManageThis =
                        capabilities.canManageMembers &&
                        (capabilities.isOwner || capabilities.rank > member.role.hierarchyLevel);

                    return (
                        <div key={member.userToken} className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-3">
                                <img
                                    src={member.user.imgLink || '/default-avatar.png'}
                                    alt=""
                                    className="w-8 h-8 rounded-full bg-gray-200"
                                />
                                <span className="text-sm font-medium">{member.user.username}</span>
                                {member.userToken === currentUserToken && (
                                    <span className="text-xs text-gray-400">(toi)</span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {canManageThis ? (
                                    <>
                                        <select
                                            value={member.roleId}
                                            disabled={isPending}
                                            onChange={(e) => handleRoleChange(member.userToken, Number(e.target.value))}
                                            className="text-sm border rounded px-2 py-1 bg-white"
                                        >
                                            {/* le rôle actuel doit toujours apparaître, même si non "assignable" désormais */}
                                            {!assignableRoles.some(r => r.id === member.roleId) && (
                                                <option value={member.roleId}>{member.role.roleName}</option>
                                            )}
                                            {assignableRoles.map(r => (
                                                <option key={r.id} value={r.id}>{r.roleName}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => handleRemove(member.userToken)}
                                            disabled={isPending}
                                            className="text-xs text-red-500 hover:text-red-700 px-2"
                                        >
                                            Retirer
                                        </button>
                                    </>
                                ) : (
                                    <span className="text-sm text-gray-500">{member.role.roleName}</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}