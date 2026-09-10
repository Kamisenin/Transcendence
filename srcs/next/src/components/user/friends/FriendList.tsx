import { getTranslations } from "next-intl/server";
import { getFriends } from "@/actions/friendship";
import FriendCard from "./FriendCard";
import FriendSearch from "./FriendSearch";

type Props = {
    target_id: string;
    isSelf?: boolean;
    currentUserId?: string;
};

export default async function FriendList({ target_id, isSelf, currentUserId }: Props) {
    const t = await getTranslations("Friend");
    const friendships = await getFriends(target_id);

    return (
        <div className="flex aspect-square w-64 flex-col border border-[#d9bfb7] border-t-4 border-t-[#800000] bg-[#fffaf7] p-4 shadow-[0_2px_8px_rgba(128,0,0,0.06)]">
            <h2 className="mb-3 text-xl font-bold">
                {t("title")} ({friendships?.length ?? 0})
            </h2>

            {isSelf && currentUserId && (
                <FriendSearch currentUserId={currentUserId} />
            )}

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
                        {t("noFriends")}
                    </p>
                )}
            </div>
        </div>
    );
}