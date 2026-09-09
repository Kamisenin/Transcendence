import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers'
import { getSessionUser, getSessionCookie } from '%/lib/session';
import { resolvePage } from '%/lib/page/page_resolver';
import PageBuilder from '@/components/page/editor/PageBuilder';
import { canEditPage, getCanonicalNamespace, getPagePermissions, getPageTagStatus } from '@/actions/pages'
import { prisma } from '%/lib/prisma/prisma';

type Params = {
    params: Promise<{
        namespace: string;
        slug: string;
    }>;
};

export default async function WikiEditPage({ params }: Params) {
    const user = await getSessionUser(await getSessionCookie());
    if (!user) redirect('/login');

    const { namespace, slug } = await params;

    const resolved = await resolvePage(namespace, slug);

    if (!resolved) {
        notFound();
    }

    const { page } = resolved;

    if (!page) notFound();
    if (!await canEditPage(page.pageId, user.user_id)) {
        redirect(`/wiki/${namespace}/${slug}`);
    }

    const { pendingTagIds } = await getPageTagStatus(page.pageId);
    const canoNamespace = await getCanonicalNamespace(page.pageId);
    const rawContent = page.content as { blocks: any[] } | null;
    const blocks = (rawContent?.blocks ?? []).map((block: any) =>
        block.type === 'infobox' && block.infoboxData
            ? {
                ...block,
                infoboxData: {
                    ...block.infoboxData,
                    tags: (block.infoboxData.tags ?? []).map((tag: any) => ({
                        ...tag,
                        pending: pendingTagIds.has(Number(tag.id)),
                    })),
                },
            }
            : block
    );

    const isOwner = page.ownerId === user.user_id;
    const owner = await prisma.user.findUnique({ where: { user_id: page.ownerId }, select: { accountId: true } });
    const permissions = isOwner ? await getPagePermissions(page.pageId) : [];

    return (
        <PageBuilder
            accountId={user.accountId}
            pageId={page.pageId}
            initialTitle={page.title}
            initialBlocks={blocks}
            visibility={page.public}
            canonicalNamespace={canoNamespace ? canoNamespace.namespace : null}
            isOwner={isOwner}
            ownerAccountId={owner?.accountId}
            initialPermissions={permissions as any}
        />
    );
}