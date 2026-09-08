import { getUser } from "%/lib/prisma/prisma-utils";
import { getCurrentUser } from "%/lib/session";
import { notFound } from "next/navigation";
import PagesList from "@/components/user/PagesList";
import OrgsList from "@/components/user/OrgsList";
import FriendList from "@/components/user/friends/FriendList";
import FriendButtons from "@/components/user/friends/FriendButtons";
import TagList from "@/components/user/TagList";
import Image from "next/image";

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
		<div className="min-h-screen bg-[#f0e0d6] px-4 pb-12 pt-20 text-[#3f2924]">
			<div className="mx-auto max-w-7xl">
				<div className="mb-6 border-b-2 border-[#800000] pb-3">
					<p className="font-mono text-xs uppercase tracking-[0.2em] text-[#8a6b63]">User profile</p>
					<h1 className="mt-1 text-2xl font-bold text-[#800000]">{target.username}</h1>
				</div>
				<div className="flex flex-col items-center justify-center gap-6 md:flex-row md:items-stretch">
				<div className="flex aspect-[5/3] w-full flex-col items-center justify-center border border-[#d9bfb7] border-t-4 border-t-[#800000] bg-[#fffaf7] p-6 shadow-[0_2px_8px_rgba(128,0,0,0.08)] md:w-3/9">
					<div className="relative w-28 h-28">
						<div className="h-28 w-28 overflow-hidden rounded-full shadow-md ring-4 ring-[#f0e0d6]">
							<Image
								src={target.imgLink || "/defaultUserProfilePicture.svg"}
								alt="Profile picture"
								width={112}
								height={112}
								className="w-full h-full object-cover"
							/>
						</div>
						<div
							className={`absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-[#fffaf7] ${
								isOnline ? "bg-[#4f8f52]" : "bg-[#a89088]"
							}`}
						/>
					</div>
					<div className="mt-4 text-center">
						<h2 className="text-lg font-semibold text-[#3f2924]">
							{target.firstName} {target.lastName}
						</h2>

						<p className="mt-1 text-sm text-[#8a6b63]">
							@{target.username}
						</p>
					</div>
				</div>
				<div className="flex w-full flex-col gap-4 md:w-auto">
					<FriendList target_id={target.user_id} />

					{currentUser && (
						<FriendButtons
							target_id={target.user_id}
							user_id={currentUser.user_id}
						/>
					)}
				</div>
			</div>
			<div className="mt-6 grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-3">
				<PagesList target={target} currentUserId={currentUser?.user_id}/>

				<TagList target={target} />

				<OrgsList target={target}/>
			</div>
		</div>
		</div>
	);
}
 
