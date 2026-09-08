import ForumCard, { PageData } from "@/components/ForumCard";
import { filterPages, getAccessiblePages, getEditablePages} from "@/actions/pages";
import { getCurrentUser } from "%/lib/session";
import { getUser } from "%/lib/prisma/prisma-utils";
import { notFound } from "next/navigation";
import FriendList from "@/components/friends/FriendList";

type Params = {
  params: Promise<{
    namespace: string;
  }>;
};

export default async function UserWikiPage({ params }: Params) {
  const { namespace } = await params;

  const target = await getUser(namespace);

  if (!target)
    notFound();

  const currentUser = await getCurrentUser();

  const ownedPages = await getEditablePages(namespace);

  const filteredPages = await filterPages(currentUser?.user_id, ownedPages)

  return (
    <div className="grid grid-cols-3 gap-6 w-full mx-auto p-6 pt-22 items-start">
      <section className="bg-card text-card-foreground border border-border rounded-lg p-4 shadow-md">
        <h2 className="text-xl font-bold mb-4">
          Pages créées par {target.username} ({filteredPages.length})
        </h2>


        <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4 scrollbar-thin">
          {filteredPages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPages.map((page) => (
                <ForumCard
                  key={page.pageId}
                  page={page}
                  userId={currentUser?.user_id}
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
      <section className="bg-card text-card-foreground border border-border rounded-lg p-4 shadow-md">
          <div/>
      </section>
       <section className="bg-card text-card-foreground border border-border rounded-lg p-4 shadow-md">
          <div/>
      </section>
    </div>
  );
}