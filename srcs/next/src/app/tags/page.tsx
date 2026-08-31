import Link from 'next/link';
import { requireUser } from '@/actions/tags';
import { getUserTags } from '%/lib/tag_permissions';
import TagsPageClient from '@/components/tags/TagsPageClient';

export default async function MyTagsPage() {
    const user = await requireUser();
    const tags = await getUserTags(user.user_id);

    return (
        <div className="min-h-screen bg-[#f6f8fa] pt-16">
            <div className="mx-auto max-w-4xl px-6 py-10">
                <div className="mb-6 border-b border-[#d0d7de] pb-4">
                    <h1 className="text-[32px] leading-tight font-semibold text-[#24292f]">My tags</h1>
                    <p className="mt-1 text-sm text-[#57606a]">
                        Manage and browse tags you can access.
                    </p>
                </div>

                <div className="mb-6">
                    <TagsPageClient />
                </div>

                {tags.length === 0 ? (
                    <div className="rounded-md border border-[#d0d7de] bg-white p-6 text-sm text-[#57606a]">
                        You don&apos;t have access to any tag at the moment.
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-md border border-[#d0d7de] bg-white">
                        <ul className="divide-y divide-[#d8dee4]">
                            {tags.map(tag => (
                                <li key={tag.name}>
                                    <Link
                                        href={`/tags/${tag.name}`}
                                        className="flex items-center justify-between px-4 py-3 hover:bg-[#f6f8fa] transition-colors"
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
                                            <span className="truncate font-medium text-[#0969da] hover:underline">
                                                {tag.name}
                                            </span>
                                        </div>

                                        {tag.ownerToken === user.user_id && (
                                            <span className="rounded-full border border-[#d0d7de] bg-[#f6f8fa] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#57606a]">
                                                Owner
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