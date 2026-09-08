"use server";

import { prisma } from "@/app/lib/prisma/prisma";
import { NotificationType } from "@prisma/client";

type NotifyInput = {
    recipientId: string;
    actorId?: string | null;
    pageId?: number | null;
    friendshipId?: string | null;
    type: NotificationType;
};

export async function notify({ recipientId, actorId, pageId, friendshipId, type }: NotifyInput) {
    if (actorId && actorId === recipientId) return null;

    return prisma.notification.create({
        data: { recipientId, actorId, pageId, friendshipId, type },
    });
}

export async function notifyFriendRequest(friendshipId: string, senderId: string, receiverId: string) {
    return notify({
        recipientId: receiverId,
        actorId: senderId,
        friendshipId,
        type: NotificationType.FRIEND_REQUEST,
    });
}