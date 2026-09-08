
import { filterPages, getEditablePages } from "@/actions/pages";
import { User } from "@prisma/client";
import ForumCard from "../ForumCard";


type Props = {
  target: User;
  currentUserId?: string;
};

export default async function PagesList({ target, currentUserId }: Props)
{
  const editablePages = await getEditablePages(target.user_id);

    const filteredpages = await filterPages(currentUserId, editablePages);

    return (
        <section className="bg-card text-card-foreground border border-border rounded-lg p-4 shadow-md h-[600px] flex flex-col">
            <h2 className="text-xl font-bold mb-4">
                Pages créées par {target.username} ({filteredpages.length})
            </h2>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin">
                {filteredpages.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredpages.map((page) => (
                            <ForumCard
                                key={page.pageId}
                                page={page}
                                userId={currentUserId}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                        Aucune page trouvée pour cet utilisateur.
                    </p>
                )}
            </div>
        </section>
    );
}