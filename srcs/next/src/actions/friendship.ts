"use server";

import { Friendship, FriendshipStatus, NotificationType } from "@prisma/client";
import { prisma } from "@/app/lib/prisma/prisma";
import { notifyFriendRequest } from "./notifications";
import { revalidatePath } from "next/dist/server/web/spec-extension/revalidate";

export async function getRelation(senderId : string, receiverId : string) : Promise<Friendship | null> {
    const relation = await prisma.friendship.findFirst({
    where: {
      OR: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    },
  });
  return (relation);
}

export async function getFriends(userId : string) {
    const friends = await prisma.friendship.findMany({
    where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [
        { senderId: userId },
        { receiverId: userId }
        ]
    },
    include: {
        sender: true,
        receiver: true,
    }
    });
    return (friends);
}

export async function addFriends(senderId : string, receiverId : string)
{
    if (senderId === receiverId) {
        throw new Error("Cannot add yourself");
    }

    const existing = await getRelation(senderId, receiverId);
    if (existing) {
        throw new Error("Friendship already exists");
    }

      const friendship = await prisma.friendship.create({
        data: {
            senderId,
            receiverId
        }
    })

    await notifyFriendRequest(friendship.id, senderId, receiverId);
    revalidatePath("/wiki/${receiver_id}");
}

export async function acceptFriend(shipId : string) {

    const relation = await prisma.friendship.findUnique( { where : { id:shipId } });

    if (!relation)
        throw new Error("Logic error, cannot go there");

    await prisma.friendship.update({
        where: { id:shipId },
        data: { status : FriendshipStatus.ACCEPTED }
    })

    await prisma.notification.deleteMany({
        where: { friendshipId: shipId, type: NotificationType.FRIEND_REQUEST },
    });
}

export async function refuseFriend(shipId : string) {

    const relation = await prisma.friendship.findUnique( { where : { id:shipId } });

    if (!relation)
        throw new Error("Logic error, cannot go there");

    await prisma.friendship.delete({ where: { id:shipId }})
}