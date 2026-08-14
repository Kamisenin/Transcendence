'use client';
import React, { useState } from 'react';

export default function OrgManageClient({ org, canManage }: { org: any; canManage: boolean }) {
    const [editing, setEditing] = useState(false);
    if (!canManage) {
        return <div>You are not allowed to manage this organization</div>;
    }

    return (
        <div>
            <h1 className="text-xl font-bold">Manage {org.name}</h1>

            <section className="mt-4">
                <h2 className="font-semibold">Members</h2>
                <ul>
                    {org.members?.map((m: any) => <li key={m.user.user_id}>{m.user.username} — {m.role.roleName}</li>)}
                </ul>
            </section>

            <section className="mt-4">
                <h2 className="font-semibold">Rôles</h2>
                <ul>
                    {org.roles?.map((r: any) => <li key={r.id}>{r.roleName}</li>)}
                </ul>
            </section>

            <section className="mt-6">
                <button className="btn-danger" onClick={() => {
                    if (!confirm('Delete this Organization ? This action is irreversible')) return;
                    // TODO: appeler action serveur deleteOrganization via fetch / server action
                }}>
                    Delete Organization
                </button>
            </section>
        </div>
    );
}