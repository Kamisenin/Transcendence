"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { removeTagOrganizationRole, setTagOrganizationRole } from "@/actions/tags";

type TagRole = { id: number; roleName: string; hierarchyLevel: number };
type OrganizationRole = { id: number; roleName: string; hierarchyLevel: number };
type Mapping = {
    orgId: number;
    tagId: number;
    roleId: number;
    tagRoleId: number | null;
    role: OrganizationRole;
    tagRole: TagRole | null;
};
type Organization = {
    id: number;
    name: string;
    roles: OrganizationRole[];
    orgTagCapability: Mapping[];
};
type Props = {
    tagId: number;
    initialData: { tagRoles: TagRole[]; organizations: Organization[] };
};

export default function TagOrganizationPermissionsPanel({ tagId, initialData }: Props) {
    const t = useTranslations("Tags.organizationPermissions");
    const [organizations, setOrganizations] = useState(initialData.organizations);
    const [organizationRoleId, setOrganizationRoleId] = useState(0);
    const [tagRoleId, setTagRoleId] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const organization = organizations[0];
    const selectedMappings = organization?.orgTagCapability ?? [];
    const assignedRoleIds = new Set(selectedMappings.map((mapping) => mapping.roleId));

    function save() {
        if (!organization || !organizationRoleId || !tagRoleId) return;
        setError(null);
        startTransition(async () => {
            try {
                const result = await setTagOrganizationRole(tagId, organization.id, organizationRoleId, tagRoleId);
                setOrganizations((current) => current.map((item) => item.id === organization.id
                    ? { ...item, orgTagCapability: [...item.orgTagCapability.filter((entry) => entry.roleId !== organizationRoleId), result as Mapping] }
                    : item
                ));
                setOrganizationRoleId(0);
                setTagRoleId(0);
            } catch (exception) {
                setError(exception instanceof Error ? exception.message : t("saveFailed"));
            }
        });
    }

    function remove(mapping: Mapping) {
        setError(null);
        startTransition(async () => {
            try {
                await removeTagOrganizationRole(tagId, mapping.orgId, mapping.roleId);
                setOrganizations((current) => current.map((item) => item.id === mapping.orgId
                    ? { ...item, orgTagCapability: item.orgTagCapability.filter((entry) => entry.roleId !== mapping.roleId) }
                    : item
                ));
            } catch (exception) {
                setError(exception instanceof Error ? exception.message : t("removeFailed"));
            }
        });
    }

    return (
        <section className="mb-6 border border-[#d9bfb7] bg-[#fffaf7] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#ead7d0] pb-4">
                <div>
                    <h2 className="text-lg font-semibold text-[#800000]">{t("title")}</h2>
                    <p className="mt-1 max-w-2xl text-sm text-[#8a6b63]">{t("description")}</p>
                </div>
                <span className="border border-[#d9bfb7] bg-[#f7e9e2] px-2 py-1 text-xs font-semibold text-[#800000]">
                    {selectedMappings.length} / {organization?.roles.length ?? 0}
                </span>
            </div>
            {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
            <div className="mt-4 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ead7d0] pb-3">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a6b63]">{t("linkedOrganization")}</p>
                        <h3 className="mt-1 font-semibold text-[#3f2924]">{organization?.name ?? t("noOrganization")}</h3>
                    </div>
                    <p className="text-xs text-[#8a6b63]">{t("assignedRoles")}</p>
                </div>
                <div className="mt-3 divide-y border border-[#ead7d0] bg-white">
                        {selectedMappings.length > 0 ? selectedMappings.map((mapping) => (
                            <div key={`${mapping.orgId}-${mapping.roleId}`} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm">
                                <span className="min-w-36 font-medium text-[#3f2924]">{mapping.role.roleName}</span>
                                <span className="text-[#8a6b63]">→</span>
                                <span className="flex-1 text-[#6f4d44]">{mapping.tagRole?.roleName ?? "—"}</span>
                                <button type="button" onClick={() => remove(mapping)} disabled={isPending} className="text-xs text-red-700 hover:underline">
                                    {t("remove")}
                                </button>
                            </div>
                        )) : (
                            <p className="px-3 py-4 text-sm text-[#8a6b63]">{t("noAssignedRoles")}</p>
                        )}
                    </div>
                <div className="mt-4 border border-[#d9bfb7] bg-[#fdf7f4] p-3">
                        <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#800000]">{t("addRole")}</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <select value={organizationRoleId} onChange={(event) => setOrganizationRoleId(Number(event.target.value))} disabled={!organization} className="border border-[#d9bfb7] bg-white px-2.5 py-1.5 text-sm disabled:opacity-50">
                                <option value={0}>{t("selectOrganizationRole")}</option>
                                {organization?.roles.filter((role) => !assignedRoleIds.has(role.id)).map((role) => <option key={role.id} value={role.id}>{role.roleName}</option>)}
                            </select>
                            <select value={tagRoleId} onChange={(event) => setTagRoleId(Number(event.target.value))} disabled={!organization} className="border border-[#d9bfb7] bg-white px-2.5 py-1.5 text-sm disabled:opacity-50">
                                <option value={0}>{t("selectTagRole")}</option>
                                {initialData.tagRoles.map((role) => <option key={role.id} value={role.id}>{role.roleName}</option>)}
                            </select>
                        </div>
                    <button type="button" onClick={save} disabled={isPending || !organization || !organizationRoleId || !tagRoleId} className="mt-2 bg-[#800000] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
                            {t("save")}
                        </button>
                </div>
            </div>
        </section>
    );
}
