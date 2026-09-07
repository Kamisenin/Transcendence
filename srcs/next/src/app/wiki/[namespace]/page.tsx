import ForumCard, { PageData } from "@/components/ForumCard";
import { filterPages, getAccessiblePages, getEditablePages} from "@/actions/pages";
import { getCurrentUser } from "%/lib/session";
import { getUser } from "@/app/lib/prisma/prisma-utils";
import { notFound } from "next/navigation";

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
    <div className="min-h-screen container mx-auto p-6 pt-20">
      
      <section className="bg-card text-card-foreground border border-border rounded-lg p-4 shadow-md">
        <h2 className="text-xl font-bold mb-4">
          Pages créées par {namespace} ({filteredPages.length})
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

    </div>
  );
}