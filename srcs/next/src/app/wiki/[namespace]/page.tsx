import ForumCard, { PageData } from "@/components/ForumCard";
import { filterPages, getEditablePages } from "@/actions/pages";
import { getUser } from "%/lib/prisma/prisma-utils";
import { getOwnedPages } from "@/actions/pages";
import { getUserOrgs } from "@/actions/orgs";
import { getCurrentUser } from "%/lib/session";
import { notFound } from "next/navigation";

export default function UserWikiPage({ params }: Params) {
	return (
		
		<div className="grid grid-cols-3 gap-6 w-full mx-auto p-6 pt-22 items-start">
			<ListPages params={params}/>

			<ListTags />

			<ListOrgs />
		</div>
	);
}

async function ListPages({ params }: Params) {
	const { namespace } = await params;

	const target = await getUser(namespace);

	if (!target)
		notFound();

	const currentUser = await getCurrentUser();

	const ownedPages = await getEditablePages(namespace);

	const filteredPages = await filterPages(currentUser?.user_id, ownedPages)
	return (
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
