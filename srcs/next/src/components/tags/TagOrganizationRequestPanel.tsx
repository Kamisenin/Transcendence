"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { getOrganizationsForTagRequest, requestOrganizationTagAccess } from "@/actions/orgs";

type OrganizationData = Awaited<ReturnType<typeof getOrganizationsForTagRequest>>;
type Organization = OrganizationData["organizations"][number];

export default function TagOrganizationRequestPanel({ tagId }: { tagId: number }) {
    const t = useTranslations("Tags.organizationRequests");
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [tagRoles, setTagRoles] = useState<OrganizationData["tagRoles"]>([]);
    const [query, setQuery] = useState("");
    const [organizationId, setOrganizationId] = useState<number | null>(null);
    const [organizationRoleId, setOrganizationRoleId] = useState<number | null>(null);
    const [tagRoleId, setTagRoleId] = useState<number | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const selectedOrganization = organizations.find((organization) => organization.id === organizationId);
    const filteredOrganizations = organizations.filter((organization) =>
        organization.name.toLowerCase().includes(query.trim().toLowerCase())
    );

    function loadOrganizations() {
        if (organizations.length) return;
        startTransition(async () => {
            try {
                const result = await getOrganizationsForTagRequest(tagId);
                setOrganizations(result.organizations);
                setTagRoles(result.tagRoles);
            } catch (error) {
                setMessage(error instanceof Error ? error.message : t("loadFailed"));
            }
        });
    }

    function submit() {
        if (!organizationId || !organizationRoleId || !tagRoleId) return;
        setMessage(null);
        startTransition(async () => {
            try {
                const result = await requestOrganizationTagAccess(organizationId, tagId, organizationRoleId, tagRoleId);
                setMessage(result.accepted ? t("accessAdded") : t("requestSent"));
            } catch (error) {
                setMessage(error instanceof Error ? error.message : t("requestFailed"));
            }
        });
    }

    return (
        <section className="border border-[#d9bfb7] bg-[#fffaf7] p-4 shadow-[0_2px_8px_rgba(128,0,0,0.06)]">
            <h2 className="text-lg font-semibold text-[#800000]">{t("title")}</h2>
            <p className="mt-1 text-sm text-[#8a6b63]">{t("description")}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-[1.2fr_1fr_1fr]">
                <div className="relative sm:col-span-1">
                    <input
                        value={selectedOrganization?.name ?? query}
                        onFocus={loadOrganizations}
                        onChange={(event) => {
                            setOrganizationId(null);
                            setOrganizationRoleId(null);
                            setTagRoleId(null);
                            setQuery(event.target.value);
                        }}
                        placeholder={t("searchOrganization")}
                        className="w-full border border-[#d9bfb7] bg-white px-2.5 py-1.5 text-sm"
                    />
                    {!selectedOrganization && query.trim() && filteredOrganizations.length > 0 && (
                        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto border border-[#d9bfb7] bg-[#fffaf7] shadow-lg">
                            {filteredOrganizations.map((organization) => (
                                <button
                                    key={organization.id}
                                    type="button"
                                    onClick={() => {
                                        setOrganizationId(organization.id);
                                        setQuery("");
                                        setOrganizationRoleId(null);
                                        setTagRoleId(null);
                                    }}
                                    className="block w-full px-2.5 py-1.5 text-left text-sm text-[#3f2924] hover:bg-[#f7e9e2]"
                                >
                                    {organization.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <select
                    value={organizationRoleId ?? ""}
                    disabled={!selectedOrganization}
                    onChange={(event) => setOrganizationRoleId(Number(event.target.value) || null)}
                    className="border border-[#d9bfb7] bg-white px-2.5 py-1.5 text-sm disabled:opacity-50"
                >
                    <option value="">{t("selectOrganizationRole")}</option>
                    {selectedOrganization?.roles.map((role) => (
                        <option key={role.id} value={role.id}>{role.roleName}</option>
                    ))}
                </select>
                <select
                    value={tagRoleId ?? ""}
                    disabled={!selectedOrganization}
                    onChange={(event) => setTagRoleId(Number(event.target.value) || null)}
                    className="border border-[#d9bfb7] bg-white px-2.5 py-1.5 text-sm"
                >
                    <option value="">{t("selectTagRole")}</option>
                    {tagRoles.map((role) => (
                        <option key={role.id} value={role.id}>{role.roleName}</option>
                    ))}
                </select>
            </div>
            {selectedOrganization && (
                <button
                    type="button"
                    onClick={() => { setOrganizationId(null); setOrganizationRoleId(null); setTagRoleId(null); setQuery(""); }}
                    className="mt-2 text-xs text-[#800000] hover:underline"
                >
                    {t("changeOrganization")}
                </button>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={submit}
                    disabled={isPending || !organizationId || !organizationRoleId || !tagRoleId}
                    className="border border-[#800000] px-3 py-1.5 text-sm font-semibold text-[#800000] transition hover:bg-[#f7e9e2] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isPending
                        ? t("sending")
                        : selectedOrganization?.canManageTagGrants
                            ? t("addAccess")
                            : t("send")}
                </button>
            </div>
            {message && <p className="mt-3 text-sm text-[#6f4d44]">{message}</p>}
        </section>
    );
}