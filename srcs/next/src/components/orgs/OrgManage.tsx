"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
    addOrganizationMembers,
    createOrganizationRole,
    deleteOrganization,
    deleteOrganizationRole,
    removeOrganizationMember,
    searchUsersForOrgMemberAdd,
    updateOrganizationMemberRole,
} from "@/actions/orgs";
import { OrgPermissionError } from "%/lib/errors";

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

export default function OrgManageClient({ org, canManage }: { org: any; canManage: boolean }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [toast, setToast] = useState<{ message: string; tone: "error" | "success" } | null>(null);
    const [roles, setRoles] = useState<Role[]>(org.roles ?? []);
    const [members, setMembers] = useState<Member[]>(org.members ?? []);
    const [busyKey, setBusyKey] = useState<string | null>(null);

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

    const [memberRoleId, setMemberRoleId] = useState<number>(0);
    const [userQuery, setUserQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [showMenu, setShowMenu] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<SearchUser[]>([]);

    const confirmTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = (message: string, tone: "error" | "success" = "error") => {
        setToast({ message, tone });
        setTimeout(() => setToast(null), 3500);
    };

    const initials = (name: string) =>
        name
            ?.split(" ")
            .map((p: string) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase() ?? "?";

    const roleColors = [
        "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
        "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
        "bg-amber-50 text-amber-700 ring-amber-600/20",
        "bg-sky-50 text-sky-700 ring-sky-600/20",
        "bg-rose-50 text-rose-700 ring-rose-600/20",
        "bg-violet-50 text-violet-700 ring-violet-600/20",
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
        if (!memberRoleId && sortedRoles.length) setMemberRoleId(sortedRoles[0].id);
    }, [sortedRoles, memberRoleId]);

    useEffect(() => {
        const t = setTimeout(async () => {
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
        return () => clearTimeout(t);
    }, [userQuery, selectedUsers]);

    if (!canManage) {
        return <div className="p-6">You don't have access</div>;
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
        if (!selectedUsers.length) return showToast("Select at least one user");
        if (!memberRoleId) return showToast("Please select a role");

        setBusyKey("add-members");
        try {
            const created = await addOrganizationMembers(
                org.id,
                selectedUsers.map((u) => ({ accountId: u.accountId, roleId: memberRoleId }))
            );

            setMembers((prev) => {
                const map = new Map(prev.map((m) => [m.userToken, m]));
                for (const m of created as any[]) map.set(m.userToken, m);
                return Array.from(map.values());
            });

            setSelectedUsers([]);
            setUserQuery("");
            setSearchResults([]);
            showToast("Users added", "success");
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Failed to add users");
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
            if (e instanceof OrgPermissionError) showToast("Permission denied");
            else showToast("Delete failed");
            setIsDeleting(false);
        }
    };

    const handleRemoveMember = async (member: Member) => {
        if (member.userToken === ownerToken) return showToast("Owner cannot be removed");
        setBusyKey(`remove-member-${member.userToken}`);
        try {
            await removeOrganizationMember(org.id, member.userToken);
            setMembers((prev) => prev.filter((m) => m.userToken !== member.userToken));
            showToast("Member removed", "success");
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Failed to remove member");
        } finally {
            setBusyKey(null);
        }
    };

    const handleChangeMemberRole = async (member: Member, roleId: number) => {
        if (member.userToken === ownerToken) return showToast("Owner role cannot be changed");
        setBusyKey(`member-role-${member.userToken}`);
        try {
            await updateOrganizationMemberRole(org.id, member.userToken, roleId);
            const role = roles.find((r) => r.id === roleId);
            if (!role) return;
            setMembers((prev) =>
                prev.map((m) => (m.userToken === member.userToken ? { ...m, roleId: role.id, role } : m))
            );
            showToast("Member role updated", "success");
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Failed to change member role");
        } finally {
            setBusyKey(null);
        }
    };

    const handleCreateRole = async () => {
        if (!newRole.roleName.trim()) return showToast("Role name is required");
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
            showToast("Role created", "success");
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Failed to create role");
        } finally {
            setBusyKey(null);
        }
    };

    const handleDeleteRole = async (role: Role) => {
        setBusyKey(`delete-role-${role.id}`);
        try {
            await deleteOrganizationRole(role.id);
            setRoles((prev) => prev.filter((r) => r.id !== role.id));
            showToast("Role deleted", "success");
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Failed to delete role");
        } finally {
            setBusyKey(null);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto max-w-5xl px-6 py-10">
                <h1 className="mb-6 text-2xl font-semibold">{org.name}</h1>

                <section className="mb-8 overflow-visible rounded-xl border border-slate-200">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                        <h2 className="text-sm font-semibold text-slate-900">Add users</h2>
                    </div>

                    <div className="space-y-3 px-5 py-4">
                        {selectedUsers.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedUsers.map((u) => (
                                    <span
                                        key={u.user_id}
                                        className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs"
                                    >
                    {u.imgLink ? (
                        <img src={u.imgLink} alt={u.accountId} className="h-4 w-4 rounded-full" />
                    ) : (
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-300 text-[10px]">
                        {initials(u.username || u.accountId)}
                      </span>
                    )}
                                        <span>{u.username || u.accountId}</span>
                    <span className="text-slate-500">@{u.accountId}</span>
                    <button onClick={() => removePickedUser(u.user_id)} className="text-slate-500 hover:text-slate-900">
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
                                placeholder="Search by accountId or username"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
                            />

                            {showMenu && searchResults.length > 0 && (
                                <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                                    {searchResults.map((u) => (
                                        <button
                                            key={u.user_id}
                                            type="button"
                                            onClick={() => pickUser(u)}
                                            className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50"
                                        >
                                            {u.imgLink ? (
                                                <img src={u.imgLink} alt={u.accountId} className="h-8 w-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs">
                                                    {initials(u.username || u.accountId)}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-medium text-slate-900">
                                                    {u.username || u.accountId}
                                                </div>
                                                <div className="truncate text-xs text-slate-500">@{u.accountId}</div>
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
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
                                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                            >
                                {busyKey === "add-members" ? "Adding..." : `Add selected (${selectedUsers.length})`}
                            </button>
                        </div>
                    </div>
                </section>

                <section className="mb-8 overflow-hidden rounded-xl border border-slate-200">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                        <h2 className="text-sm font-semibold text-slate-900">Members</h2>
                    </div>
                    <ul className="divide-y divide-slate-100">
                        {members.map((m) => (
                            <li key={m.userToken} className="flex flex-wrap items-center gap-3 px-5 py-3">
                                <div className="mr-auto flex items-center gap-3">
                                    {m.user?.imgLink ? (
                                        <img src={m.user.imgLink} alt={m.user.accountId} className="h-8 w-8 rounded-full" />
                                    ) : (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs text-white">
                                            {initials(m.user?.username || m.user?.accountId || m.userToken)}
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-sm font-medium text-slate-800">
                                            {m.user?.username || m.user?.accountId || m.userToken}
                                        </div>
                                        <div className="text-xs text-slate-500">@{m.user?.accountId || m.userToken}</div>
                                    </div>
                                </div>

                                <select
                                    value={m.roleId}
                                    disabled={m.userToken === ownerToken || busyKey === `member-role-${m.userToken}`}
                                    onChange={(e) => handleChangeMemberRole(m, Number(e.target.value))}
                                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
                                    className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                                >
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="mb-10 overflow-hidden rounded-xl border border-slate-200">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                        <h2 className="text-sm font-semibold text-slate-900">Create role</h2>
                    </div>
                    <div className="grid gap-3 px-5 py-4 md:grid-cols-2">
                        <input
                            value={newRole.roleName}
                            onChange={(e) => setNewRole((p) => ({ ...p, roleName: e.target.value }))}
                            placeholder="Role name"
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        <input
                            type="number"
                            value={newRole.hierarchyLevel}
                            onChange={(e) => setNewRole((p) => ({ ...p, hierarchyLevel: Number(e.target.value) || 100 }))}
                            placeholder="Hierarchy level"
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        <button
                            onClick={handleCreateRole}
                            disabled={busyKey === "create-role"}
                            className="w-fit rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                        >
                            {busyKey === "create-role" ? "Creating..." : "Create role"}
                        </button>
                    </div>

                    <div className="space-y-2 px-5 pb-5">
                        {sortedRoles.map((r) => (
                            <div key={r.id} className="flex items-center justify-between rounded border border-slate-200 px-3 py-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${colorFor(r.id)}`}>
                  {r.roleName}
                </span>
                                <button
                                    onClick={() => handleDeleteRole(r)}
                                    disabled={r.roleName === "Owner" || busyKey === `delete-role-${r.id}`}
                                    className="rounded bg-red-600 px-3 py-1 text-xs text-white disabled:opacity-60"
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-xl border border-red-200 bg-red-50/40">
                    <div className="flex items-center justify-between px-5 py-4">
                        <div>
                            <h2 className="text-sm font-semibold text-red-900">Delete organization</h2>
                            <p className="mt-0.5 text-sm text-red-700/80">
                                This will permanently remove {org.name} and cannot be undone.
                            </p>
                        </div>
                        <button
                            disabled={isDeleting}
                            onClick={handleDeleteOrganization}
                            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                                confirmingDelete ? "bg-red-800 hover:bg-red-900" : "bg-red-600 hover:bg-red-700"
                            }`}
                        >
                            {isDeleting ? "Deleting…" : confirmingDelete ? "Click again to confirm" : "Delete organization"}
                        </button>
                    </div>
                </section>
            </div>

            {toast && (
                <div
                    className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
                        toast.tone === "error" ? "bg-red-600 text-white" : "bg-slate-900 text-white"
                    }`}
                >
                    {toast.message}
                </div>
            )}
        </div>
    );
}