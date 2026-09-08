import Link from "next/link";
import { getTranslations } from "next-intl/server";
import UserAvatar from "@/components/UserAvatar";
import { isDefaultTitle } from "@/app/lib/page/title";

type Member = {
    userToken: string;
    user: { user_id: string; accountId: string; username: string; imgLink: string | null };
    role: { roleName: string };
};

type PageItem = {
    pageId: number;
    title: string;
    ownerAccount?: string;
    canonicalSlug?: { namespace: string; slug: string } | null;
};

type TagOverviewProps = {
    tag: {
        name: string;
        description: string | null;
        color: number | null;
        namespace: string | null;
    };
    members: Member[];
    pages: PageItem[];
    isOwnerOrManager?: boolean;
};

export default async function TagOverview({ tag, members, pages, isOwnerOrManager }: TagOverviewProps) {
    const t = await getTranslations("Tags");
    const r = await getTranslations("Tags.requests");

    const colorHex = tag.color
        ? `#${tag.color.toString(16).padStart(6, "0")}`
        : "#8c959f";

    return (
        <div className="min-h-screen bg-[#f6f8fa] pt-16">
            <div className="mx-auto max-w-4xl px-6 py-10">
                <div className="mb-6 border-b border-[#d0d7de] pb-4">
                    <div className="flex items-center gap-3">
                        <span
                            className="h-4 w-4 shrink-0 rounded-full border border-black/10"
                            style={{ backgroundColor: colorHex }}/>
                        <h1 className="text-[32px] leading-tight font-semibold text-[#24292f]">
                            {tag.name}
                        </h1>
                        {tag.namespace && (
                            <span className="rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-2 py-1 text-xs font-mono text-[#57606a]">
                                {tag.namespace}
                            </span>
                        )}
                        <Link
                            href={`/tags/${tag.name}/manage`}
                            className="ml-auto text-sm text-[#0969da] hover:underline">
                            {t("Manage")}
                        </Link>
                    </div>
                    {tag.description && (
                        <p className="mt-2 text-sm text-[#57606a]">{tag.description}</p>)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#57606a]">
                            {t("pages")} <span className="text-[#8c959f] font-normal">({pages.length})</span>
                        </h2>
                        {pages.length === 0 ? (
                            <div className="rounded-md border border-[#d0d7de] bg-white p-6 text-sm text-[#57606a]">
                                {t("noPageWithTag")}
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-md border border-[#d0d7de] bg-white">
                                <ul className="divide-y divide-[#d8dee4]">
                                    {pages.map((page) => {
                                        const href = page.canonicalSlug
                                            ? `/wiki/${page.canonicalSlug.namespace}/${page.canonicalSlug.slug}`
                                            : `/wiki/${page.ownerAccount}/${page.pageId}`;
                                        return (
                                            <li key={page.pageId}>
                                                <Link
                                                    href={href}
                                                    className="flex items-center justify-between px-4 py-3 hover:bg-[#f6f8fa] transition-colors">
                                                    <span className="truncate font-medium text-[#0969da] hover:underline">
                                                        {isDefaultTitle(page.title) ? r("untitled") : page.title}
                                                    </span>
                                                    {page.ownerAccount && (
                                                        <span className="text-xs text-[#8c959f] shrink-0 ml-3">
                                                            @{page.ownerAccount}
                                                        </span>
                                                    )}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#57606a]">
                            {t("member")} <span className="text-[#8c959f] font-normal">({members.length})</span>
                        </h2>
                        {members.length === 0 ? (
                            <div className="rounded-md border border-[#d0d7de] bg-white p-4 text-sm text-[#57606a]">
                                {t("noMemberYet")}
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-md border border-[#d0d7de] bg-white">
                                <ul className="divide-y divide-[#d8dee4]">
                                    {members.map((member) => (
                                        <li key={member.userToken} className="flex items-center gap-2.5 px-3 py-2.5">
                                            <UserAvatar accountId={member.user.accountId} imgLink={member.user.imgLink} alt={member.user.username} size={28} className="h-7 w-7" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-[#24292f] truncate">
                                                    {member.user.username}
                                                </p>
                                                <p className="text-xs text-[#8c959f] truncate">{member.role.roleName}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}