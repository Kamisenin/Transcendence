import { getUser } from "%/lib/prisma/prisma-utils";
import { getCurrentUser } from "%/lib/session";
import { notFound } from "next/navigation";
import PagesList from "@/components/user/PagesList";
import OrgsList from "@/components/user/OrgsList";
import FriendList from "@/components/user/friends/FriendList";
import FriendButtons from "@/components/user/friends/FriendButtons";
import Image from 'next/image'

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

	const isOnline =
		target.lastSeen &&
		Date.now() - new Date(target.lastSeen).getTime() < 60 * 1000;

	return (
		<div className="pt-20">
			<div className="flex flex-col md:flex-row items-center md:items-stretch justify-center gap-6">
				<div className="aspect-[5/3] w-full md:w-3/9 mx-auto border rounded-2xl p-6 flex flex-col items-center justify-center">
					<div className="relative w-28 h-28">
						<div className="w-28 h-28 rounded-full overflow-hidden shadow-md ring-4 ring-gray-100">
							<Image
								src={target.imgLink || "/defaultUserProfilePicture.svg"}
								alt="Profile picture"
								width={112}
								height={112}
								className="w-full h-full object-cover"
							/>
						</div>
						<div
							className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-white ${
								isOnline ? "bg-green-500" : "bg-gray-400"
							}`}
						/>
					</div>
					<div className="mt-4 text-center">
						<h2 className="text-lg font-semibold text-gray-900">
							{target.firstName} {target.lastName}
						</h2>

						<p className="text-sm text-gray-500 mt-1">
							@{target.username}
						</p>
					</div>
				</div>
				<div className="flex flex-col gap-4 w-full md:w-auto">
					<FriendList target_id={target.user_id} />

					{currentUser && (
						<FriendButtons
							target_id={target.user_id}
							user_id={currentUser.user_id}
						/>
					)}
				</div>
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full mx-auto p-6 items-start">
				<PagesList target={target} currentUserId={currentUser?.user_id}/>

				<ListTags />

				<OrgsList target={target}/>
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
 
