import { getTranslations } from 'next-intl/server';
import OrgCard from './OrgCard';
import type { OrgSummary } from './orgTypes';

export default async function OrgList({ orgs }: { orgs: OrgSummary[] }) {
    const t = await getTranslations('Orgs');

    if (!orgs || orgs.length === 0) {
            return <div className="text-sm text-[#8a6b63]">{t('noOrganizationsFound')}</div>;
        }
    return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orgs.map(o => (
                        <OrgCard key={o.id} org={o} />
                    ))}
                </div>
        );
}