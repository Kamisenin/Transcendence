import { getRelation } from "@/actions/friendship";
import AddFriendButton from "./AddFriendButton";
import RemoveFriendButton from "./RemoveFriendButton";
import HandleFriendRequestButtons from "./HandleFriendRequestButtons";
import { FriendshipStatus } from "@prisma/client";
import { getTranslations } from "next-intl/server";


type Props = {
    target_id : string;
    user_id : string
}

export default async function FriendButtons({ target_id, user_id } : Props)
{
    const t = await getTranslations("Friend");

    if (user_id === target_id)
        return null;
    const relation = await getRelation(user_id, target_id);
    if (!relation)
        return (<AddFriendButton sender_id={user_id} receiver_id={target_id}/>)
    if (relation.status === FriendshipStatus.PENDING ) {
        if (relation.senderId === target_id && relation.receiverId === user_id) {
            return <HandleFriendRequestButtons friendship_id={relation.id} />;
        }

        return (
            <button
                disabled
                className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-md cursor-not-allowed opacity-80"
            >
                {t("sent")}
            </button>
        );
    }
    return <RemoveFriendButton friendship_id={relation.id} />;
}