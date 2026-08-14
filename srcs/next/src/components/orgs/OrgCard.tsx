'use client';
import Link from 'next/link';
import React from 'react';

export type OrgSummary = {
    id: number;
    name: string;
    createdAt?: string;
    isOwner?: boolean;
};

export default function OrgCard({ org }: { org: OrgSummary }) {
    return (
        <div className="border rounded p-4">
            <h3 className="text-lg font-medium">{org.name}</h3>
            <p className="text-sm text-gray-500">Created at {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : ''}</p>
            <div className="mt-2 flex gap-2">
                <Link href={`/orgs/${org.name}`} className="btn">
                    View
                </Link>
                <Link href={`/orgs/${org.name}/manage`} className="btn-outline">
                    Manage
                </Link>
            </div>
        </div>
    );
}