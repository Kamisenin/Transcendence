import { User } from "@prisma/client";
import { getUserTags } from "%/lib/tag_permissions";
import TagCard from "./TagCard";

type Props = {
    target: User;
};

export default async function TagList({ target }: Props) {
    const tags = await getUserTags(target.user_id);

    return (
        <section className="flex h-[400px] flex-col border border-[#d9bfb7] border-t-4 border-t-[#800000] bg-[#fffaf7] p-4 shadow-[0_2px_8px_rgba(128,0,0,0.08)]">
            <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-[#ead7d0] pb-3">
                <h2 className="text-xl font-bold text-[#3f2924]">Tags</h2>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#9b6b5d]">
                    {tags.length}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
                {tags.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                        {tags.map((tag) => (
                            <TagCard key={tag.id} tag={tag} />
                        ))}
                    </div>
                ) : (
                    <p className="py-8 text-center text-sm text-[#8a6b63]">
                        Cet utilisateur ne fait partie d&apos;aucun tag.
                    </p>
                )}
            </div>
        </section>
    );
}
