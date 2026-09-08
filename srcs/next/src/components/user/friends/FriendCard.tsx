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
    const isOnline = new Date(friend.lastSeen).getTime() > new Date().getTime() - 2 * 60 * 1000;

    return (
        <Link
            href={`/wiki/${friend.accountId}`}
            className="flex w-full max-w-sm items-center gap-3 border border-[#d9bfb7] bg-[#fffaf7] p-3 transition-shadow duration-200 hover:border-[#800000] hover:shadow-md"
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
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#fffaf7] ${
                        isOnline ? "bg-[#4f8f52]" : "bg-[#a89088]" }`}
                    title={isOnline ? t("online") : t("offline")}
                    aria-label={isOnline ? t("online") : t("offline")}
                />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate font-semibold text-[#3f2924]">
                    {friend.username}
                </span>
                <span className="truncate text-xs text-[#8a6b63]">
                    @{friend.accountId}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-[#8a6b63]">
                    {isOnline ? t("online") : t("offline")}
                </span>
            </div>
        </Link>
    );
}