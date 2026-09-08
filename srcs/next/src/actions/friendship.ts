"use server";

import { Organization, Page, User, Friendship, FriendshipStatus } from "@prisma/client";
import { prisma } from "@/app/lib/prisma/prisma";

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

    await prisma.friendship.create({
        data: {
            senderId,
            receiverId
        }
    })
}

export async function acceptFriend(shipId : string) {

    const relation = await prisma.friendship.findUnique( {
        where : { id:shipId }
    });

    if (!relation)
        throw new Error("Logic error, cannot go there");

    await prisma.friendship.update({
        where: { id:shipId },
        data: { status : FriendshipStatus.ACCEPTED }
    })
}

export async function refuseFriend(shipId : string) {

    const relation = await prisma.friendship.findUnique( {
        where : { id:shipId }
    });

    if (!relation)
        throw new Error("Logic error, cannot go there");

    await prisma.friendship.delete({
        where: { id:shipId }
    })
}