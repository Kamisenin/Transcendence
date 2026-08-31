import React from "react";
import { getOrganization, userHasOrgPermission } from "@/actions/orgs";
import OrgManageClient from "@/components/orgs/OrgManage";
import { getSessionUser, getSessionCookie } from "%/lib/session";

type Props = { params: Promise<{ orgName: string }> };

export default async function OrgManagePage({ params }: Props) {
    const { orgName } = await params;
    const org = await getOrganization(orgName);
    if (!org) return <div>Organization not found</div>;

    const sessionUser = await getSessionUser(await getSessionCookie());
    const canManage =
        (await userHasOrgPermission(org.id, "canManageMembers", sessionUser)) ||
        org.ownerToken === sessionUser?.user_id;

    return (
        <main className="p-6 pt-20 min-h-screen">
            <OrgManageClient org={org} canManage={Boolean(canManage)} />
        </main>
    );
}