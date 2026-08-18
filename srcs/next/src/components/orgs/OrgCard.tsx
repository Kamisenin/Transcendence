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
        <article
            className="bg-white border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-shadow p-4">
            <header className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Created {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : '—'}
                    </p>
                </div>
                <div className="text-right">
                    {org.isOwner && (
                        <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                        Owner
                    </span>
                    )}
                </div>
            </header>

            <div className="mt-4 flex gap-2">
                <Link
                    href={`/orgs/${encodeURIComponent(org.name)}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200"
                    aria-label={`View ${org.name}`}
                >
                    View
                </Link>

                <Link
                    href={`/orgs/${encodeURIComponent(org.name)}/manage`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-white border border-blue-100 rounded hover:bg-blue-50"
                    aria-label={`Manage ${org.name}`}
                >
                    Manage
                </Link>
            </div>
        </article>
    );
}