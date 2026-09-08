import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

type FriendInfos = {
    accountId : string;
    username : string;
    imgLink : string;
    lastSeen : Date;
}

interface FriendCardProps {
  friend: FriendInfos;
}


export default async function FriendCard({ friend } : FriendCardProps)
{
    const t = await getTranslations("Common");
    const isOnline = Date.now() - new Date(friend.lastSeen).getTime() < 2 * 60 * 1000;

    return (
        <Link
            href={`/wiki/${friend.accountId}`}
            className="flex items-center gap-3 p-3 bg-white border border-gray-200 
                rounded-xl hover:shadow-md transition-shadow duration-200 w-full max-w-sm"
        >
            <div className="relative flex-shrink-0">
                <Image
                    src={friend.imgLink || "/defaultUserProfilePicture.svg"}
                    alt={friend.username}
                    width={48}
                    height={48}
                    className="rounded-full object-cover w-12 h-12"
                />
                <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        isOnline ? "bg-green-500" : "bg-gray-400" }`}
                    title={isOnline ? t("online") : t("offline")}
                    aria-label={isOnline ? t("online") : t("offline")}
                />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
                <span className="font-semibold text-gray-900 truncate">
                    {friend.username}
                </span>
                <span className="text-xs text-gray-500 truncate">
                    @{friend.accountId}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-gray-500">
                    {isOnline ? t("online") : t("offline")}
                </span>
            </div>
        </Link>
    );
}