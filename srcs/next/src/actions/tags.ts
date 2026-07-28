"use server";

import { prisma } from '%/lib/prisma/prisma';
import { getSessionUser, getSessionCookie } from '%/lib/session';
import { intToHex, hexToInt } from "%/lib/hex_utils"

export async function checkTagNamespaceAvailability(namespace: string): Promise<{ available: boolean; message?: string }> {
    const cleanNamespace = namespace.trim();
    if (!cleanNamespace) return { available: true };

    const existingUser = await prisma.user.findFirst({
        where: { accountId: cleanNamespace }
    });

    if (existingUser) {
        return { available: false, message: "This namespace is already used." };
    }

    const existingTag = await prisma.tag.findFirst({
        where: { namespace: cleanNamespace }
    });

    if (existingTag) {
        return { available: false, message: "This namespace is already used." };
    }

    return { available: true };
}

export async function createTagAction(data: { name: string; namespace?: string; colorHex?: string }) {
    const user = await getSessionUser(await getSessionCookie());
    if (!user) throw new Error("Utilisateur non identifié");

    const name = data.name.trim();
    if (!name) throw new Error("Le nom du tag est obligatoire.");

    const existingName = await prisma.tag.findUnique({
        where: { name }
    });
    if (existingName) {
        throw new Error("Un tag avec ce nom existe déjà.");
    }

    const cleanNamespace = data.namespace?.trim() || null;
    if (cleanNamespace) {
        const check = await checkTagNamespaceAvailability(cleanNamespace);
        if (!check.available) {
            throw new Error(check.message || "Namespace indisponible.");
        }
    }

    const colorInt = data.colorHex ? hexToInt(data.colorHex) : hexToInt("#3b82f6");

    const newTag = await prisma.tag.create({
        data: {
            name,
            namespace: cleanNamespace,
            color: colorInt,
            ownerToken: user.user_id,
        }
    });

    return {
        id: newTag.id.toString(),
        name: newTag.name,
        namespace: newTag.namespace,
        color: intToHex(newTag.color)
    };
}

export async function getTagsAction(query?: string) {
    const search = query?.trim();

    const tags = await prisma.tag.findMany({
        where: search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { namespace: { contains: search, mode: 'insensitive' } },
                ],
            }
            : undefined,
        orderBy: { name: 'asc' },
        take: 30, //limit for the autocomplete
    });

    return tags.map((t) => ({
        id: t.id.toString(),
        name: t.name,
        namespace: t.namespace,
        color: intToHex(t.color),
    }));
}

