import { getFriends } from "@/actions/friendship";
import { Prisma } from "@prisma/client"
import FriendCard from "./FriendCard";


type Props = {
    target_id: string;
}

export default async function FriendList({ target_id } : Props)
{
    const friendships = await getFriends(target_id);

	return (
		<div className="flex aspect-square w-64 flex-col rounded-2xl border-2 border-blue-500 p-4">
			
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
						T'as pas d'amis Mdrr
					</p>
				)}
			</div>

		</div>
	);
}
