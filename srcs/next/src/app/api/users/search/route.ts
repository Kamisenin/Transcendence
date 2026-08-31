import { prisma } from '%/lib/prisma/prisma';
import { getSessionUser, getSessionCookie } from '%/lib/session';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const user = await getSessionUser(await getSessionCookie());
    if (!user) {
        return NextResponse.json({ error: 'Unidentified User' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
        return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
        where: {
            OR: [
                { username: { contains: query, mode: 'insensitive' } },
                { accountId: { contains: query, mode: 'insensitive' } },
            ],
        },
        select: {
            user_id: true,
            username: true,
            accountId: true,
            imgLink: true,
        },
        take: 8,
    });

    return NextResponse.json({ users });
}