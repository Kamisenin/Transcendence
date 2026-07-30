import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers'
import { getSessionUser, getSessionCookie } from '%/lib/session';
import { resolvePage } from '%/lib/page/page_resolver';
import PageBuilder from '@/components/page/editor/PageBuilder';
import { canEditPage } from '@/actions/pages'

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

    const { page } = await resolvePage(namespace, slug);
    if (!page) notFound();
    if (!await canEditPage(page.pageId, user)) {
        redirect(`/wiki/${namespace}/${slug}`);
    }


    const content = page.content as { blocks: any[] } | null;

    return (
        <PageBuilder
            pageId={page.pageId}
            initialTitle={page.title}
            initialBlocks={content?.blocks ?? []}
        />
    );
}