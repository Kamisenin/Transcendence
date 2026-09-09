"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
    addOrganizationMembers,
    createOrganizationRole,
    deleteOrganization,
    deleteOrganizationRole,
    removeOrganizationMember,
    searchUsersForOrgMemberAdd,
    updateOrganizationMemberRole,
    reviewOrganizationPageRequest,
    reviewOrganizationTagRequest,
} from "@/actions/orgs";
import { OrgPermissionError } from "%/lib/errors";
import UserAvatar from "@/components/UserAvatar";

type Role = {
    id: number;
    roleName: string;
    hierarchyLevel: number;
    canManageMembers: boolean;
    canManageRoles: boolean;
    canEditInfo: boolean;
    canDeleteOrg: boolean;
    canManageOrgPageGrants: boolean;
    canManageOrgTagGrants: boolean;
};

type Member = {
    userToken: string;
    user: { user_id: string; username: string | null; accountId: string; imgLink: string | null };
    roleId: number;
    role: Role;
};

type SearchUser = {
    user_id: string;
    username: string | null;
    accountId: string;
    imgLink: string | null;
};

type OrganizationManageData = {
    id: number;
    name: string;
    ownerToken: string;
    roles: Role[];
    members: Member[];
    orgTagAccess?: Array<{
        tagId: number;
        tag: { id: number; name: string; roles: Array<{ id: number; roleName: string; hierarchyLevel: number }> };
    }>;
    orgTagCapability?: Array<{
        orgId: number;
        tagId: number;
        roleId: number;
        tagRoleId: number | null;
        tag: { id: number; name: string; roles: Array<{ id: number; roleName: string; hierarchyLevel: number }> };
        role: Role;
        tagRole?: { id: number; roleName: string; hierarchyLevel: number } | null;
    }>;
    orgTagRequests?: Array<{ id: number; tag: { name: string }; minRole: { roleName: string }; tagRole?: { roleName: string } | null; requester: { accountId: string; username: string | null } }>;
    orgPageRequests?: Array<{ id: number; page: { pageId: number; title: string }; minRole: { roleName: string }; requester: { accountId: string; username: string | null } }>;
};

const ROLE_NAME_PATTERN = /^[A-Za-z0-9 _-]+$/;

function getRoleError(code: string, t: ReturnType<typeof useTranslations>) {
    switch (code) {
        case "ROLE_NAME_REQUIRED": return t("roleNameRequired");
        case "ROLE_NAME_TOO_LONG": return t("roleNameTooLong");
        case "ROLE_NAME_INVALID": return t("roleNameInvalid");
        case "HIERARCHY_LEVEL_INVALID": return t("hierarchyLevelInvalid");
        default: return t("failedToCreateRole");
    }
}

export default function OrgManageClient({ org, canManage }: { org: OrganizationManageData; canManage: boolean }) {
    const t = useTranslations("Orgs");
    const tMembers = useTranslations("Tags.members");
    const tRoles = useTranslations("Tags.roles");
    const tCommon = useTranslations("Common");
    const tTags = useTranslations("Tags");

    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [toast, setToast] = useState<{ message: string; tone: "error" | "success" } | null>(null);
    const [roles, setRoles] = useState<Role[]>(org.roles ?? []);
    const [members, setMembers] = useState<Member[]>(org.members ?? []);
    const [tagRequests, setTagRequests] = useState(org.orgTagRequests ?? []);
    const [pageRequests, setPageRequests] = useState(org.orgPageRequests ?? []);
    const [busyKey, setBusyKey] = useState<string | null>(null);
    const [roleErrors, setRoleErrors] = useState<{ roleName?: string; hierarchyLevel?: string }>({});

    const [newRole, setNewRole] = useState({
        roleName: "",
        hierarchyLevel: 100,
        canManageMembers: false,
        canManageRoles: false,
        canEditInfo: false,
        canDeleteOrg: false,
        canManageOrgPageGrants: false,
        canManageOrgTagGrants: false,
    });

    const [memberRoleId, setMemberRoleId] = useState<number>(() => org.roles?.[0]?.id ?? 0);
    const [userQuery, setUserQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [showMenu, setShowMenu] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<SearchUser[]>([]);

    const confirmTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = (message: string, tone: "error" | "success" = "error") => {
        setToast({ message, tone });
        setTimeout(() => setToast(null), 3500);
    };

    const roleColors = [
        "bg-[#f7e9e2] text-[#800000] ring-[#d9bfb7]",
        "bg-[#ead7d0] text-[#6f4d44] ring-[#cda99d]",
        "bg-[#f4e8c1] text-[#765a12] ring-[#d8bc68]",
    ];
    const colorFor = (id: string | number) => {
        const s = String(id);
        let h = 0;
        for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
        return roleColors[h % roleColors.length];
    };

    const ownerToken = org.ownerToken as string;
    const sortedRoles = useMemo(() => [...roles].sort((a, b) => a.hierarchyLevel - b.hierarchyLevel), [roles]);

    useEffect(() => {
        const timeout = setTimeout(async () => {
            const q = userQuery.trim();
            if (!q) {
                setSearchResults([]);
                return;
            }
            try {
                const results = await searchUsersForOrgMemberAdd(q);
                const selectedIds = new Set(selectedUsers.map((u) => u.user_id));
                setSearchResults(results.filter((u) => !selectedIds.has(u.user_id)));
            } catch {
                setSearchResults([]);
            }
        }, 200);
        return () => clearTimeout(timeout);
    }, [userQuery, selectedUsers]);

    if (!canManage) {
        return <div className="p-6">{tTags("youDontHaveAccess")}</div>;
    }

    const pickUser = (u: SearchUser) => {
        if (selectedUsers.some((x) => x.user_id === u.user_id)) return;
        setSelectedUsers((prev) => [...prev, u]);
        setUserQuery("");
        setShowMenu(true);
    };

    const removePickedUser = (userId: string) => {
        setSelectedUsers((prev) => prev.filter((u) => u.user_id !== userId));
    };

    const handleAddSelectedUsers = async () => {
        if (!selectedUsers.length) return showToast(tMembers("selectAtLeastOneUser"));
        if (!memberRoleId) return showToast(tMembers("pleaseSelectRole"));

        setBusyKey("add-members");
        try {
            const created = await addOrganizationMembers(
                org.id,
                selectedUsers.map((u) => ({ accountId: u.accountId, roleId: memberRoleId }))
            );

            setMembers((prev) => {
                const map = new Map(prev.map((m) => [m.userToken, m]));
                for (const m of created) map.set(m.userToken, m);
                return Array.from(map.values());
            });

            setSelectedUsers([]);
            setUserQuery("");
            setSearchResults([]);
            showToast(tMembers("usersAdded"), "success");
        } catch (e) {
            showToast(e instanceof Error ? e.message : tMembers("failedToAddUsers"));
        } finally {
            setBusyKey(null);
        }
    };

    const handleDeleteOrganization = async () => {
        if (!confirmingDelete) {
            setConfirmingDelete(true);
            confirmTimeoutRef.current = setTimeout(() => setConfirmingDelete(false), 3000);
            return;
        }
        if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
        setConfirmingDelete(false);

        setIsDeleting(true);
        try {
            await deleteOrganization(org.id);
        } catch (e) {
            if (e instanceof OrgPermissionError) showToast(t("permissionDenied"));
            else showToast(t("deleteFailed"));
            setIsDeleting(false);
        }
    };

    const handleRemoveMember = async (member: Member) => {
        if (member.userToken === ownerToken) return showToast(tMembers("ownerCannotBeRemoved"));
        setBusyKey(`remove-member-${member.userToken}`);
        try {
            await removeOrganizationMember(org.id, member.userToken);
            setMembers((prev) => prev.filter((m) => m.userToken !== member.userToken));
            showToast(tMembers("memberRemoved"), "success");
        } catch (e) {
            showToast(e instanceof Error ? e.message : tMembers("failedToRemoveMember"));
        } finally {
            setBusyKey(null);
        }
    };

    const handleChangeMemberRole = async (member: Member, roleId: number) => {
        if (member.userToken === ownerToken) return showToast(tMembers("ownerRoleCannotBeChanged"));
        setBusyKey(`member-role-${member.userToken}`);
        try {
            await updateOrganizationMemberRole(org.id, member.userToken, roleId);
            const role = roles.find((r) => r.id === roleId);
            if (!role) return;
            setMembers((prev) =>
                prev.map((m) => (m.userToken === member.userToken ? { ...m, roleId: role.id, role } : m))
            );
            showToast(tMembers("memberRoleUpdated"), "success");
        } catch (e) {
            showToast(e instanceof Error ? e.message : tMembers("failedToChangeMemberRole"));
        } finally {
            setBusyKey(null);
        }
    };

    const handleCreateRole = async () => {
        const roleName = newRole.roleName.trim();
        const errors = {
            roleName: !roleName ? "ROLE_NAME_REQUIRED" : roleName.length > 20 ? "ROLE_NAME_TOO_LONG" : !ROLE_NAME_PATTERN.test(roleName) ? "ROLE_NAME_INVALID" : undefined,
            hierarchyLevel: !Number.isInteger(newRole.hierarchyLevel) || newRole.hierarchyLevel < 0 || newRole.hierarchyLevel > 200 ? "HIERARCHY_LEVEL_INVALID" : undefined,
        };
        setRoleErrors(errors);
        if (errors.roleName || errors.hierarchyLevel) return;
        setBusyKey("create-role");
        try {
            const created = await createOrganizationRole(org.id, {
                ...newRole,
                roleName: newRole.roleName.trim(),
            });
            setRoles((prev) => [...prev, created as Role]);
            setNewRole({
                roleName: "",
                hierarchyLevel: 100,
                canManageMembers: false,
                canManageRoles: false,
                canEditInfo: false,
                canDeleteOrg: false,
                canManageOrgPageGrants: false,
                canManageOrgTagGrants: false,
            });
            showToast(tRoles("roleCreated"), "success");
        } catch (e) {
            const message = e instanceof Error ? e.message : "";
            setRoleErrors(message === "HIERARCHY_LEVEL_INVALID" ? { hierarchyLevel: message } : { roleName: message || "ROLE_CREATE_FAILED" });
        } finally {
            setBusyKey(null);
        }
    };

    const handleDeleteRole = async (role: Role) => {
        setBusyKey(`delete-role-${role.id}`);
        try {
            await deleteOrganizationRole(role.id);
            setRoles((prev) => prev.filter((r) => r.id !== role.id));
            showToast(tRoles("roleDeleted"), "success");
        } catch (e) {
            showToast(e instanceof Error ? e.message : tRoles("failedToDeleteRole"));
        } finally {
            setBusyKey(null);
        }
    };

    const handleTagRequest = async (id: number, accept: boolean) => {
        setBusyKey(`tag-request-${id}`);
        try {
            await reviewOrganizationTagRequest(id, accept);
            setTagRequests((prev) => prev.filter((request) => request.id !== id));
        } catch (e) {
            showToast(e instanceof Error ? e.message : t("permissionDenied"));
        } finally {
            setBusyKey(null);
        }
    };

    const handlePageRequest = async (id: number, accept: boolean) => {
        setBusyKey(`page-request-${id}`);
        try {
            await reviewOrganizationPageRequest(id, accept);
            setPageRequests((prev) => prev.filter((request) => request.id !== id));
        } catch (e) {
            showToast(e instanceof Error ? e.message : t("permissionDenied"));
        } finally {
            setBusyKey(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#f0e0d6]">
            <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
                <h1 className="mb-6 border-b-2 border-[#800000] pb-3 text-2xl font-semibold text-[#800000]">{org.name}</h1>

                {(tagRequests.length > 0 || pageRequests.length > 0) && (
                    <section className="mb-8 border border-[#d9bfb7] border-t-4 border-t-[#800000] bg-[#fffaf7] p-5">
                        <h2 className="mb-4 text-sm font-semibold text-[#3f2924]">{t("pendingRequests")}</h2>
                        <div className="space-y-3">
                            {tagRequests.map((request) => (
                                <div key={`tag-${request.id}`} className="flex flex-wrap items-center justify-between gap-3 border border-[#ead7d0] p-3">
                                    <span className="text-sm text-[#3f2924]">{t("tagRequest", { tag: request.tag.name, role: request.minRole.roleName, tagRole: request.tagRole?.roleName || "—", user: request.requester.username || request.requester.accountId })}</span>
                                    <div className="flex gap-2">
                                        <button disabled={busyKey === `tag-request-${request.id}`} onClick={() => handleTagRequest(request.id, true)} className="border border-green-700 px-3 py-1 text-xs text-green-800">{t("accept")}</button>
                                        <button disabled={busyKey === `tag-request-${request.id}`} onClick={() => handleTagRequest(request.id, false)} className="border border-red-700 px-3 py-1 text-xs text-red-800">{t("reject")}</button>
                                    </div>
                                </div>
                            ))}
                            {pageRequests.map((request) => (
                                <div key={`page-${request.id}`} className="flex flex-wrap items-center justify-between gap-3 border border-[#ead7d0] p-3">
                                    <span className="text-sm text-[#3f2924]">{t("pageRequest", { page: request.page.title || `#${request.page.pageId}`, role: request.minRole.roleName, user: request.requester.username || request.requester.accountId })}</span>
                                    <div className="flex gap-2">
                                        <button disabled={busyKey === `page-request-${request.id}`} onClick={() => handlePageRequest(request.id, true)} className="border border-green-700 px-3 py-1 text-xs text-green-800">{t("accept")}</button>
                                        <button disabled={busyKey === `page-request-${request.id}`} onClick={() => handlePageRequest(request.id, false)} className="border border-red-700 px-3 py-1 text-xs text-red-800">{t("reject")}</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section className="mb-8 overflow-visible border border-[#d9bfb7] border-t-4 border-t-[#800000] bg-[#fffaf7] shadow-[0_2px_8px_rgba(128,0,0,0.06)]">
                    <div className="border-b border-[#ead7d0] bg-[#f7e9e2] px-5 py-3">
                        <h2 className="text-sm font-semibold text-[#3f2924]">{tMembers("addUsers")}</h2>
                    </div>

                    <div className="space-y-3 px-5 py-4">
                        {selectedUsers.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedUsers.map((u) => (
                                    <span
                                        key={u.user_id}
                                        className="inline-flex items-center gap-2 rounded-full bg-[#f7e9e2] px-3 py-1 text-xs"
                                    >
                                        <UserAvatar accountId={u.accountId} imgLink={u.imgLink} alt={u.username || u.accountId} size={16} className="h-4 w-4 text-[8px]" />
                                        <span>{u.username || u.accountId}</span>
                    <span className="text-[#8a6b63]">@{u.accountId}</span>
                    <button onClick={() => removePickedUser(u.user_id)} className="text-[#8a6b63] hover:text-[#800000]">
                      ×
                    </button>
                  </span>
                                ))}
                            </div>
                        )}

                        <div className="relative">
                            <input
                                value={userQuery}
                                onChange={(e) => {
                                    setUserQuery(e.target.value);
                                    setShowMenu(true);
                                }}
                                onFocus={() => setShowMenu(true)}
                                placeholder={t("searchMemberPlaceholder")}
                                className="w-full border border-[#d9bfb7] bg-[#fffaf7] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#d9bfb7]"
                            />

                            {showMenu && searchResults.length > 0 && (
                                <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto border border-[#d9bfb7] bg-[#fffaf7] shadow-lg">
                                    {searchResults.map((u) => (
                                        <button
                                            key={u.user_id}
                                            type="button"
                                            onClick={() => pickUser(u)}
                                            className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[#f7e9e2]"
                                        >
                                            <UserAvatar accountId={u.accountId} imgLink={u.imgLink} alt={u.username || u.accountId} size={32} className="h-8 w-8" />
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-medium text-[#3f2924]">
                                                    {u.username || u.accountId}
                                                </div>
                                                <div className="truncate text-xs text-[#8a6b63]">@{u.accountId}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <select
                                value={memberRoleId}
                                onChange={(e) => setMemberRoleId(Number(e.target.value))}
                                className="border border-[#d9bfb7] bg-[#fffaf7] px-3 py-2 text-sm"
                            >
                                {sortedRoles.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.roleName}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={handleAddSelectedUsers}
                                disabled={busyKey === "add-members"}
                                className="bg-[#800000] px-4 py-2 text-sm font-medium text-[#fffaf7] hover:bg-[#5f0000] disabled:opacity-60"
                            >
                                {busyKey === "add-members" ? tMembers("adding") : t("addSelected", { count: selectedUsers.length })}
                            </button>
                        </div>
                    </div>
                </section>

                <section className="mb-8 overflow-hidden border border-[#d9bfb7] bg-[#fffaf7]">
                    <div className="border-b border-[#ead7d0] bg-[#f7e9e2] px-5 py-3">
                        <h2 className="text-sm font-semibold text-[#3f2924]">{tCommon("members")}</h2>
                    </div>
                    <ul className="max-h-[32rem] divide-y divide-[#ead7d0] overflow-y-auto">
                        {members.map((m) => (
                            <li key={m.userToken} className="flex min-w-0 flex-wrap items-center gap-3 px-5 py-3">
                                <div className="mr-auto flex min-w-0 items-center gap-3">
                                    <UserAvatar accountId={m.user?.accountId || m.userToken} imgLink={m.user?.imgLink} alt={m.user?.username || m.user?.accountId || m.userToken} size={32} className="h-8 w-8" />
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-medium text-[#3f2924]">
                                            {m.user?.username || m.user?.accountId || m.userToken}
                                        </div>
                                        <div className="text-xs text-[#8a6b63]">@{m.user?.accountId || m.userToken}</div>
                                    </div>
                                </div>

                                <select
                                    value={m.roleId}
                                    disabled={m.userToken === ownerToken || busyKey === `member-role-${m.userToken}`}
                                    onChange={(e) => handleChangeMemberRole(m, Number(e.target.value))}
                                    className="max-w-full min-w-0 border border-[#d9bfb7] bg-[#fffaf7] px-3 py-2 text-sm"
                                >
                                    {sortedRoles.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.roleName}
                                        </option>
                                    ))}
                                </select>

                                <button
                                    disabled={m.userToken === ownerToken || busyKey === `remove-member-${m.userToken}`}
                                    onClick={() => handleRemoveMember(m)}
                                    className="bg-[#a33a2b] px-3 py-2 text-sm font-medium text-white hover:bg-[#81291f] disabled:opacity-60"
                                >
                                    {t("remove")}
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="mb-10 overflow-hidden border border-[#d9bfb7] bg-[#fffaf7]">
                    <div className="border-b border-[#ead7d0] bg-[#f7e9e2] px-5 py-3">
                        <h2 className="text-sm font-semibold text-[#3f2924]">{tRoles("createRole")}</h2>
                    </div>
                    <div className="grid gap-3 px-5 py-4 md:grid-cols-2">
                        <input
                            value={newRole.roleName}
                            onChange={(e) => setNewRole((p) => ({ ...p, roleName: e.target.value }))}
                            placeholder={t("roleNamePlaceholder")}
                            className="border border-[#d9bfb7] bg-[#fffaf7] px-3 py-2 text-sm"
                        />
                        {roleErrors.roleName && <p className="text-xs text-[#a33a2b]">{getRoleError(roleErrors.roleName, tRoles)}</p>}
                        <input
                            type="number"
                            min={0}
                            max={200}
                            value={newRole.hierarchyLevel}
                            onChange={(e) => setNewRole((p) => ({ ...p, hierarchyLevel: Number(e.target.value) }))}
                            placeholder={t("hierarchyLevelPlaceholder")}
                            className="border border-[#d9bfb7] bg-[#fffaf7] px-3 py-2 text-sm"
                        />
                        {roleErrors.hierarchyLevel && <p className="text-xs text-[#a33a2b]">{getRoleError(roleErrors.hierarchyLevel, tRoles)}</p>}
                        <button
                            onClick={handleCreateRole}
                            disabled={busyKey === "create-role"}
                            className="w-fit bg-[#800000] px-4 py-2 text-sm font-medium text-[#fffaf7] hover:bg-[#5f0000] disabled:opacity-60"
                        >
                            {busyKey === "create-role" ? tRoles("creating") : tRoles("createRole")}
                        </button>
                    </div>

                    <div className="max-h-[28rem] space-y-2 overflow-y-auto px-5 pb-5">
                        {sortedRoles.map((r) => (
                            <div key={r.id} className="flex min-w-0 items-center justify-between gap-3 border border-[#ead7d0] px-3 py-2">
                <span className={`min-w-0 break-words rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${colorFor(r.id)}`}>
                  {r.roleName}
                </span>
                                <button
                                    onClick={() => handleDeleteRole(r)}
                                    disabled={r.roleName === "Owner" || busyKey === `delete-role-${r.id}`}
                                    className="bg-[#a33a2b] px-3 py-1 text-xs text-white disabled:opacity-60"
                                >
                                    {tCommon("delete")}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="border border-[#d9a49a] bg-[#f8e3de]">
                    <div className="flex items-center justify-between px-5 py-4">
                        <div>
                            <h2 className="text-sm font-semibold text-[#7d2117]">{t("deleteOrganization")}</h2>
                            <p className="mt-0.5 text-sm text-[#a33a2b]">
                                {t("deleteOrgWarning", { name: org.name })}
                            </p>
                        </div>
                        <button
                            disabled={isDeleting}
                            onClick={handleDeleteOrganization}
                            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                                confirmingDelete ? "bg-[#7d2117] hover:bg-[#5f1711]" : "bg-[#a33a2b] hover:bg-[#81291f]"
                            }`}
                        >
                            {isDeleting ? t("deleting") : confirmingDelete ? tCommon("clickAgainToConfirm") : t("deleteOrganization")}
                        </button>
                    </div>
                </section>
            </div>

            {toast && (
                <div
                    className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
                        toast.tone === "error" ? "bg-[#a33a2b] text-white" : "bg-[#800000] text-white"
                    }`}
                >
                    {toast.message}
                </div>
            )}
        </div>
    );
}