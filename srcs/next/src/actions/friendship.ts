"use server";

import { Friendship, FriendshipStatus, NotificationType } from "@prisma/client";
import { prisma } from "@/app/lib/prisma/prisma";
import { notifyFriendRequest } from "./notifications";
import { revalidatePath } from "next/dist/server/web/spec-extension/revalidate";
import { getCurrentUser } from "%/lib/session";

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

export async function isFriends(senderId : string, receiver : string)
{
    const relation = await getRelation(senderId, receiver);

    if (!relation)
        return (false);
    return (relation.status === FriendshipStatus.ACCEPTED);
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

export async function removeFriend(shipId : string) {
    const relation = await prisma.friendship.findUnique({ where: { id: shipId } });

    if (!relation)
        throw new Error("Friendship not found");

    await prisma.friendship.delete({ where: { id: shipId } });
}

export type SearchFriendUser = {
    user_id: string;
    username: string | null;
    accountId: string;
    imgLink: string | null;
    isFriend: boolean;
    hasPendingRequest: boolean;
};

export async function searchUsersForFriends(query: string): Promise<SearchFriendUser[]> {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];

    const q = query.trim();
    if (!q) return [];

    const users = await prisma.user.findMany({
        where: {
            OR: [
                { accountId: { contains: q, mode: "insensitive" } },
                { username: { contains: q, mode: "insensitive" } },
            ],
            NOT: {
                user_id: currentUser.user_id,
            },
        },
        select: {
            user_id: true,
            username: true,
            accountId: true,
            imgLink: true,
            sentFriendships: {
                where: { receiverId: currentUser.user_id },
                select: { status: true },
            },
            receivedFriendships: {
                where: { senderId: currentUser.user_id },
                select: { status: true },
            },
        },
        orderBy: { accountId: "asc" },
        take: 20,
    });

    return users.map((u) => {
        const friendship = u.sentFriendships[0] || u.receivedFriendships[0];

        return {
            user_id: u.user_id,
            username: u.username,
            accountId: u.accountId,
            imgLink: u.imgLink,
            isFriend: friendship?.status === "ACCEPTED",
            hasPendingRequest: friendship?.status === "PENDING",
        };
    });
}
