import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers'
import { getSessionUser, getSessionCookie } from '%/lib/session';
import { resolvePage } from '%/lib/page/page_resolver';
import PageBuilder from '@/components/page/editor/PageBuilder';
import { canEditPage, getCanonicalNamespace } from '@/actions/pages'

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

    const canoNamespace = await getCanonicalNamespace(page.pageId);
    const content = page.content as { blocks: any[] } | null;

    return (
        <PageBuilder
            accountId={user.accountId}
            pageId={page.pageId}
            initialTitle={page.title}
            initialBlocks={content?.blocks ?? []}
            visibility={page.public}
            canonicalNamespace={canoNamespace ? canoNamespace.namespace : null}
        />
    );
}