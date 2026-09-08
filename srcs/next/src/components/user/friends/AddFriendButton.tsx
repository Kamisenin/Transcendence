"use client";

import { useTransition } from "react";
import { addFriends } from "@/actions/friendship";
import { useTranslations } from "next-intl";

type Props = {
    receiver_id: string;
    sender_id: string;
};

export default function AddFriendButton({ receiver_id, sender_id }: Props) {
    const [isPending, startTransition] = useTransition();
    const t = useTranslations("Friend");

    const handleAddFriend = () => {
        startTransition(async () => {
            await addFriends(sender_id, receiver_id);
        });
    };

    return (
        <button
            onClick={handleAddFriend}
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
            {isPending ? t("sending") : t("addFriend")}
        </button>
    );
}