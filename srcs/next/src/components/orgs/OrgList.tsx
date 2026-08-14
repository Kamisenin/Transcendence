import React from 'react';
import OrgCard from './OrgCard';
import type { OrgSummary } from './orgTypes';

export default function OrgList({ orgs }: { orgs: OrgSummary[] }) {
    if (!orgs || orgs.length === 0) {
        return <div>No organization found</div>;
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orgs.map(o => <OrgCard key={o.id} org={o} />)}
        </div>
    );
}