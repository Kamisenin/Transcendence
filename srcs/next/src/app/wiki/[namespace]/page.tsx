import ForumCard, { PageData } from "@/components/ForumCard";
import { getOwnedPages } from "@/actions/pages";
import { getUserOrgs } from "@/actions/orgs";
import { getCurrentUser } from "%/lib/session";

export default function UserWikiPage() {
	return (
		<div className="grid grid-cols-3 gap-6 w-full mx-auto p-6 pt-22 items-start">
			<ListPages />

			<ListTags />

			<ListOrgs />
		</div>
	);
}

async function ListPages() {
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
		<section className="bg-card text-card-foreground border border-border rounded-lg p-4 shadow-md h-[600px] flex flex-col">
			<h2 className="text-xl font-bold mb-4">
				Pages créées par {currentUser.username} ({formattedPages.length})
			</h2>

			<div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin">
				{formattedPages.length > 0 ? (
					<div className="grid grid-cols-1 gap-4">
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
	);
}

async function ListTags() {
	return (
			<section className="bg-card text-card-foreground border border-border rounded-lg p-4 shadow-md h-[600px] flex flex-col">
				<h2 className="text-xl font-bold mb-4">Tags</h2>
				<div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
					{/* contenu des tags */}
				</div>
			</section>
	);
}

async function ListOrgs() {
	const orgs = await getUserOrgs();

	return (
		<section className="bg-card text-card-foreground border border-border rounded-lg p-4 shadow-md h-[600px] flex flex-col">
			<h2 className="text-xl font-bold mb-4">
				Organisations ({orgs?.length ?? 0})
			</h2>

			<div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin">
				{orgs && orgs.length > 0 ? (
					<div className="grid grid-cols-1 gap-4">
						{/* affichage de tes orgs ici */}
					</div>
				) : (
					<p className="text-sm text-muted-foreground py-8 text-center">
						Aucune organisation trouvée.
					</p>
				)}
			</div>
		</section>
	);
}
