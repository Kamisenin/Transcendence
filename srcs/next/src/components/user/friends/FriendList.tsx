import { getFriends } from "@/actions/friendship";
import FriendCard from "./FriendCard";


type Props = {
    target_id: string;
}

export default async function FriendList({ target_id } : Props)
{
    const friendships = await getFriends(target_id);

	return (
		<div className="flex aspect-square w-64 flex-col border border-[#d9bfb7] border-t-4 border-t-[#800000] bg-[#fffaf7] p-4 shadow-[0_2px_8px_rgba(128,0,0,0.06)]">
			
			{/* Titre */}
			<h2 className="mb-4 text-xl font-bold">
				Friends ({friendships?.length ?? 0})
			</h2>

			{/* Liste des amis */}
			<div className="flex flex-1 flex-col gap-3 overflow-y-auto">
				{friendships && friendships.length > 0 ? (
					friendships.map((friendship) => {
						const friend =
							friendship.senderId === target_id
								? friendship.receiver
								: friendship.sender;

						return (
							<FriendCard
								key={friendship.id}
								friend={friend}
							/>
						);
					})
				) : (
					<p className="py-8 text-center text-sm text-muted-foreground">
						Tu n&apos;as pas encore d&apos;amis.
					</p>
				)}
			</div>

		</div>
	);
}
