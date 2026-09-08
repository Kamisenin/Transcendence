import { notFound } from 'next/navigation';
import { prisma } from '%/lib/prisma/prisma';
import TagOverview from '@/components/tags/TagOverview';

type Params = {
    params: Promise<{ tagName: string }>;
};

export default async function TagPage({ params }: Params) {
    const { tagName } = await params;

    const tag = await prisma.tag.findUnique({where: {name: tagName,}});
    if (!tag) notFound();

    const members = await prisma.tagMember.findMany({
        where: {tagId: tag.id},
        include: { user: { select: { user_id: true, username: true, imgLink: true}}, role: true}});

    return (
        <TagOverview
            tag={{
                name: tag.name,
                description: tag.description,
                color: tag.color,
                namespace: tag.namespace,
            }}
            members={members}
            pages={[]}/>
    );
}