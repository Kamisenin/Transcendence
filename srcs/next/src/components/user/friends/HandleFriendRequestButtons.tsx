"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { acceptFriend, refuseFriend } from "@/actions/friendship";

type Props = {
    friendship_id: string;
};

export default function HandleFriendRequestButtons({ friendship_id }: Props) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const t = useTranslations("Notifications");

    const handleRequest = (action: typeof acceptFriend | typeof refuseFriend) => {
        startTransition(async () => {
            await action(friendship_id);
            router.refresh();
        });
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={() => handleRequest(acceptFriend)}
                disabled={isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
                {t("accept")}
            </button>
            <button
                onClick={() => handleRequest(refuseFriend)}
                disabled={isPending}
                className="px-4 py-2 bg-zinc-200 text-zinc-800 rounded-md hover:bg-red-300 disabled:opacity-50 transition-colors"
            >
                {t("refuse")}
            </button>
        </div>
    );
}