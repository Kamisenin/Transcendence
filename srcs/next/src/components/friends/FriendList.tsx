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
        <div className="aspect-square overflow-y-auto w-64 rounded-2xl border-2 border-green"> 
            { friendships.map((friendship) => {
                const friend =
                    friendship.senderId === target_id
                    ? friendship.receiver
                    : friendship.sender;

                return <FriendCard key={friendship.id} friend={friend} />;
            })}
        </div>
    );
}