"use server";

import { prisma } from '%/lib/prisma/prisma';
import { getSessionUser, getSessionCookie } from '%/lib/session';
import { redirect } from "next/navigation";
import { init_slug, syncUserSlugs, slugify, removeTagSlug, setTagSlug } from "%/lib/page/slug";
import { User } from '@prisma/client';

export async function savePage(
    pageId: number,
    title: string,
    content: any,
    canonicalNamespace?: string | null
) {
    const user = await getSessionUser(await getSessionCookie());
    if (!user) throw new Error("Unidentified user");

    await prisma.page.update({
        where: { pageId },
        data: { title, content },
    });

    await syncUserSlugs(pageId, title, user.accountId ?? "");

    // cleanup and update of page slug
    if (canonicalNamespace && canonicalNamespace.trim()) {
        await setTagSlug(pageId, title, canonicalNamespace.trim());
    } else {
        await removeTagSlug(pageId);
    }
}

export async function canEditPage(user: User | null = null, page_id: number): Promise<boolean> {
    if (!user)
        user = await getSessionUser(await getSessionCookie());
    if (!user) throw new Error("Unidentified user");

    // TODO check if user can explicitly edit or has a tag role/organization role that allows him to edit the page
    return true;
}

export async function createPage() {
    const user = await getSessionUser(await getSessionCookie());

    if (!user) throw new Error("Unidentified user");

    const page = await prisma.page.create({
        data: {
            title : '',
            ownerId: user.user_id,
            content: { blocks: [] },
        },
    });

    await init_slug(user.accountId, page.pageId);
    redirect(`/wiki/${user.accountId}/${page.pageId}/edit`);
}

export async function checkTitleAvailability(pageId: number, title: string): Promise<{ available: boolean; slug: string }> {
    const user = await getSessionUser(await getSessionCookie());
    if (!user) return { available: false, slug: '' };

    const titleSlug = slugify(title);
    if (!titleSlug) return { available: true, slug: '' };

    const existing = await prisma.pageSlug.findFirst({
        where: {
            namespace: user.accountId,
            slug: titleSlug,
            NOT: { pageId: pageId }
        }
    });

    return {
        available: !existing,
        slug: titleSlug
    };
}

