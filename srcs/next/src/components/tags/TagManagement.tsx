"use client";

import { useState } from 'react';
import TagMembersPanel from './TagMembersPanel';
import TagRolesPanel from './TagRolesPanel';
import TagRequestsPanel from './TagRequestsPanel';
import TagSettingsPanel from './TagSettingsPanel';
import type { TagCapabilities } from '%/lib/tag_permissions';
import { type Member } from "./TagMembersPanel"


export type Tag = {
    id: number;
    name: string;
    description: string | null;
    color: number | null;
    namespace : string | null;
    ownerToken: string;
};

type Role = {
    id: number;
    tagId: number;
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

type PendingRequest = {
    id: number;
    tagId: number;
    pageId: number;
    requestedBy: string;
    createdAt: Date;
    page: { pageId: number; title: string };
    requester: { user_id: string; username: string };
};

type Props = {
    tag: Tag;
    capabilities: TagCapabilities;
    roles: Role[];
    members: Member[];
    pendingRequests: PendingRequest[];
    currentUserToken: string;
};

const TABS = [
    { key: 'members', label: 'Membres' },
    { key: 'roles', label: 'Rôles' },
    { key: 'requests', label: 'Demandes' },
    { key: 'settings', label: 'Paramètres' },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function TagManagement({tag, capabilities, roles, members, pendingRequests, currentUserToken,}: Props) {
    const [activeTab, setActiveTab] = useState<TabKey>('members');

    const visibleTabs = TABS.filter(t => {
        if (t.key === 'requests') return capabilities.canReviewRequests;
        if (t.key === 'settings') return capabilities.canEditInfo || capabilities.canDeleteTag;
        return true;
    });

    return (
        <div className="max-w-5xl mx-auto p-8 pt-20">
            <div className="flex items-center gap-3 mb-6">
                <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tag.color ? `#${tag.color.toString(16).padStart(6, '0')}` : '#ccc' }}
                />
                <h1 className="text-2xl font-bold">{tag.name}</h1>
                {capabilities.isOwner && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        Owner
                    </span>
                )}
            </div>

            {tag.description && <p className="text-gray-500 mb-6">{tag.description}</p>}

            <div className="flex gap-1 border-b mb-6">
                {visibleTabs.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key)}
                        className={[
                            "px-4 py-2 text-sm font-medium border-b-2 transition -mb-px",
                            activeTab === t.key
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        ].join(" ")}
                    >
                        {t.label}
                        {t.key === 'requests' && pendingRequests.length > 0 && (
                            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[10px] bg-red-500 text-white rounded-full">
                                {pendingRequests.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {activeTab === 'members' && (
                <TagMembersPanel
                    tagId={tag.id}
                    members={members}
                    roles={roles}
                    capabilities={capabilities}
                    currentUserToken={currentUserToken}
                />
            )}

            {activeTab === 'roles' && (
                <TagRolesPanel tagId={tag.id} roles={roles} capabilities={capabilities} />
            )}

            {activeTab === 'requests' && capabilities.canReviewRequests && (
                <TagRequestsPanel tagId={tag.id} requests={pendingRequests} />
            )}

            {activeTab === 'settings' && (
                <TagSettingsPanel tag={tag} capabilities={capabilities} />
            )}
        </div>
    );
}