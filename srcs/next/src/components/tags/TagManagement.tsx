"use client";

import { useState } from 'react';
import TagMembersPanel from './TagMembersPanel';
import TagRolesPanel from './TagRolesPanel';
import TagRequestsPanel from './TagRequestsPanel';
import TagSettingsPanel from './TagSettingsPanel';
import TagOrganizationRequestPanel from './TagOrganizationRequestPanel';
import TagOrganizationPermissionsPanel from './TagOrganizationPermissionsPanel';
import type { TagCapabilities } from '%/lib/tag_permissions';
import { type Member } from "./TagMembersPanel"
import { useTranslations } from 'next-intl';


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
    organizationMappings: Awaited<ReturnType<typeof import('@/actions/tags').getTagOrganizationMappings>>;
    organizationLinked: boolean;
};

type TabKey = 'members' | 'roles' | 'requests' | 'organization' | 'settings';

export default function TagManagement({tag, capabilities, roles, members, pendingRequests, currentUserToken, organizationMappings, organizationLinked}: Props) {
    const [activeTab, setActiveTab] = useState<TabKey>('members');
    const t = useTranslations('Tags');

    const TABS = [
        { key: 'members', label: t('tabMembers') },
        { key: 'roles', label: t('tabRoles') },
        { key: 'requests', label: t('tabRequests') },
        { key: 'organization', label: t('tabOrganization') },
        { key: 'settings', label: t('tabSettings') },
    ] as const;

    const visibleTabs = TABS.filter(t => {
        if (t.key === 'requests') return capabilities.canReviewRequests;
        if (t.key === 'settings') return capabilities.canEditInfo || capabilities.canDeleteTag;
        return true;
    });

    return (
        <div className="min-h-screen bg-[#f0e0d6] px-4 pb-16 pt-20 text-[#3f2924] sm:px-6">
            <div className="mx-auto max-w-5xl">
            <div className="mb-8 border-b-2 border-[#800000] pb-5">
                <div className="flex flex-wrap items-center gap-3">
                <span
                    className="h-4 w-4 rounded-full border border-black/10 shadow-sm"
                    style={{ backgroundColor: tag.color ? `#${tag.color.toString(16).padStart(6, '0')}` : '#ccc' }}
                />
                <h1 className="text-3xl font-semibold tracking-tight text-[#800000]">{tag.name}</h1>
                {capabilities.isOwner && (
                    <span className="rounded-full border border-[#d9bfb7] bg-[#f7e9e2] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a6b63]">
                        {t('ownerBadge')}
                    </span>
                )}
                </div>
                {tag.namespace && <p className="mt-2 font-mono text-xs text-[#8a6b63]">/{tag.namespace}</p>}
            </div>

            {tag.description && <p className="mb-6 max-w-2xl text-sm leading-6 text-[#8a6b63]">{tag.description}</p>}

            <div className="mb-6 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-[#d9bfb7]">
                {visibleTabs.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key)}
                        className={[
                            "-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition",
                            activeTab === t.key
                                ? "border-[#800000] text-[#800000]"
                                : "border-transparent text-[#8a6b63] hover:border-[#d9bfb7] hover:text-[#800000]"
                        ].join(" ")}
                    >
                        {t.label}
                        {t.key === 'requests' && pendingRequests.length > 0 && (
                            <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e6a817] px-1 text-[10px] font-bold text-[#3f2924]">
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

            {activeTab === 'organization' && !organizationLinked && <TagOrganizationRequestPanel tagId={tag.id} />}
            {activeTab === 'organization' && organizationLinked && <TagOrganizationPermissionsPanel tagId={tag.id} initialData={organizationMappings} />}

            {activeTab === 'settings' && (
                <TagSettingsPanel tag={tag} capabilities={capabilities} />
            )}
            </div>
        </div>
    );
}