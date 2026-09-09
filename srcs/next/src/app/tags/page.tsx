import Link from 'next/link';
import { requireUser } from '@/actions/tags';
import { getUserTags } from '%/lib/tag_permissions';
import TagsPageClient from '@/components/tags/TagsPageClient';
import { getTranslations } from 'next-intl/server';

export default async function MyTagsPage() {
    const user = await requireUser();
    const tags = await getUserTags(user.user_id);
    const t = await getTranslations('Tags');
    const tCommon = await getTranslations('Common');

    return (
        <div className="min-h-screen bg-[#f0e0d6] pt-16">
            <div className="mx-auto max-w-4xl px-6 py-10">
                <div className="mb-6 border-b-2 border-[#800000] pb-4">
                    <h1 className="text-[32px] leading-tight font-semibold text-[#800000]">{t("myTags")}</h1>
                    <p className="mt-1 text-sm text-[#8a6b63]">
                        {t("manageAndBrowse")}
                    </p>
                </div>

                <div className="mb-6">
                    <TagsPageClient />
                </div>

                {tags.length === 0 ? (
                    <div className="border border-[#d9bfb7] bg-[#fffaf7] p-6 text-sm text-[#8a6b63]">
                        {t("youDontHaveAccessToAnyTag")}
                    </div>
                ) : (
                    <div className="overflow-hidden border border-[#d9bfb7] bg-[#fffaf7]">
                        <ul className="divide-y divide-[#ead7d0]">
                            {tags.map(tag => (
                                <li key={tag.name}>
                                    <Link
                                        href={`/tags/${tag.namespace}`}
                                        className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-[#f7e9e2]"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span
                                                className="h-3 w-3 shrink-0 rounded-full border border-black/10"
                                                style={{
                                                    backgroundColor: tag.color
                                                        ? `#${tag.color.toString(16).padStart(6, '0')}`
                                                        : '#8c959f',
                                                }}
                                            />
                                            <span className="truncate font-medium text-[#800000] hover:underline">
                                                {tag.name}
                                            </span>
                                        </div>

                                        {tag.ownerToken === user.user_id && (
                                            <span className="border border-[#d9bfb7] bg-[#f7e9e2] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#8a6b63]">
                                                {tCommon("owner")}
                                            </span>
                                        )}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}