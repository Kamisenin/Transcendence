"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { removeFriend } from "@/actions/friendship";

type Props = {
	friendship_id: string;
};

export default function RemoveFriendButton({ friendship_id }: Props) {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();
	const t = useTranslations("Friend");

	const handleRemoveFriend = () => {
		startTransition(async () => {
			await removeFriend(friendship_id);
			router.refresh();
		});
	};

	return (
		<button
			onClick={handleRemoveFriend}
			disabled={isPending}
			className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
		>
			{isPending ? t("removing") : t("removeFriend")}
		</button>
	);
}
