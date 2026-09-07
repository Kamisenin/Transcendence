import ForumCard, { PageData } from "@/components/ForumCard";
import { getOwnedPages } from "@/actions/pages";
import { getCurrentUser } from "%/lib/session";

type Params = {
  params: Promise<{
    username: string;
  }>;
};

export default async function UserWikiPage({ params }: Params) {
  const { username } = await params;

 
  const currentUser = await getCurrentUser();

  const ownedPages = await getOwnedPages();


  const formattedPages: PageData[] = ownedPages.map((p) => ({
    pageId: p.pageId,
    title: p.title,
    description: null,
    img: p.preview || null,
    slug: p.canonicalSlug?.slug || "",
    namespace: p.canonicalSlug?.namespace || "",
    tags: [], 
  }));

  return (
    <div className="min-h-screen container mx-auto p-6">
      
      {/* ==========================================
          CONTENEUR 1 : Liste avec défilement vertical
         ========================================== */}
      <section className="bg-card text-card-foreground border border-border rounded-lg p-4 shadow-md">
        <h2 className="text-xl font-bold mb-4">
          Pages créées par {username} ({formattedPages.length})
        </h2>

        {/* Zone à défilement vertical (overflow-y-auto) */}
        <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4 scrollbar-thin">
          {formattedPages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formattedPages.map((page) => (
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