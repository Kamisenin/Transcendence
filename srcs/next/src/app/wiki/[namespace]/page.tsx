import { getUser } from "%/lib/prisma/prisma-utils";
import { getOwnedPages } from "@/actions/pages";
import { getUserOrgs } from "@/actions/orgs";
import { getCurrentUser } from "%/lib/session";
import { notFound } from "next/navigation";
import PagesList from "@/components/user/PagesList";
import FriendList from "@/components/friends/FriendList";

type Params = {
  params: Promise<{
    namespace: string;
  }>;
};

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

	return (
    <div>
      <FriendList target_id={target.user_id}/>
      <div className="grid grid-cols-3 gap-6 w-full mx-auto p-6 pt-22 items-start">
        <PagesList target={target} currentUserId={currentUser?.user_id}/>

        <ListTags />

        <ListOrgs />
      </div>
    </div>
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
