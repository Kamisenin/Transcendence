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
        <div className="min-h-screen bg-[#f0e0d6] pt-16 text-[#3f2924]">
            <div className="mx-auto max-w-4xl px-6 py-10">
                <div className="mb-6 border-b-2 border-[#800000] pb-4">
                    <div className="flex items-center gap-3">
                        <span
                            className="h-4 w-4 shrink-0 rounded-full border border-black/10"
                            style={{ backgroundColor: colorHex }}/>
                        <h1 className="text-[32px] leading-tight font-semibold text-[#800000]">
                            {tag.name}
                        </h1>
                        {tag.namespace && (
                            <span className="rounded-md border border-[#d9bfb7] bg-[#f7e9e2] px-2 py-1 text-xs font-mono text-[#8a6b63]">
                                {tag.namespace}
                            </span>
                        )}
                        { isOwnerOrManager && (
                            <Link
                                href={`/tags/${tag.namespace}/manage`}
                                className="ml-auto rounded-md border border-[#d9bfb7] bg-[#fffaf7] px-3 py-1.5 text-sm font-semibold text-[#800000] transition hover:bg-[#f7e9e2]">
                                {t("Manage")}
                            </Link>
                        )
                        }
                    </div>
                    {tag.description && (
                        <p className="mt-2 text-sm text-[#8a6b63]">{tag.description}</p>)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#57606a]">
                            {t("pages")} <span className="text-[#8c959f] font-normal">({pages.length})</span>
                        </h2>
                        {pages.length === 0 ? (
                            <div className="rounded-md border border-[#d9bfb7] bg-[#fffaf7] p-6 text-sm text-[#8a6b63]">
                                {t("noPageWithTag")}
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-md border border-[#d9bfb7] bg-[#fffaf7]">
                                <ul className="divide-y divide-[#ead7d0]">
                                    {pages.map((page) => {
                                        const href = page.canonicalSlug
                                            ? `/wiki/${page.canonicalSlug.namespace}/${page.canonicalSlug.slug}`
                                            : `/wiki/${page.ownerAccount}/${page.pageId}`;
                                        return (
                                            <li key={page.pageId}>
                                                <Link
                                                    href={href}
                                                    className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-[#f7e9e2]">
                                                    <span className="truncate font-medium text-[#800000] hover:underline">
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
                            <div className="rounded-md border border-[#d9bfb7] bg-[#fffaf7] p-4 text-sm text-[#8a6b63]">
                                {t("noMemberYet")}
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-md border border-[#d9bfb7] bg-[#fffaf7]">
                                <ul className="divide-y divide-[#ead7d0]">
                                    {members.map((member) => (
                                        <li key={member.userToken} className="flex items-center gap-2.5 px-3 py-2.5">
                                            <UserAvatar accountId={member.user.accountId} imgLink={member.user.imgLink} alt={member.user.username} size={28} className="h-7 w-7" />
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-[#3f2924]">
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