"use client";
import React from 'react';
import { useTranslations } from 'next-intl';
import OrgCard from './OrgCard';
import type { OrgSummary } from './orgTypes';

export default function OrgList({ orgs }: { orgs: OrgSummary[] }) {
    const t = useTranslations('Orgs');

    if (!orgs || orgs.length === 0) {
            return <div className="text-sm text-gray-500">{t('noOrganizationsFound')}</div>;
        }
    return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orgs.map(o => (
                        <OrgCard key={o.id} org={o} />
                    ))}
                </div>
        );
}