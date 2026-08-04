import { notFound, redirect } from 'next/navigation';
import { resolvePage } from '%/lib/page/page_resolver';
import { canViewPage } from '@/actions/pages';
import PageViewer from '@/components/page/PageViewer';

type Params = {
    params: Promise<{
        namespace: string;
        slug: string;
    }>;
};

export default async function WikiViewPage({ params }: Params) {
    const { namespace, slug } = await params;
    const result = await resolvePage(namespace, slug);

    if (!result) notFound();

    const { page, redirectTo } = result;
    if (redirectTo) redirect(redirectTo);

    try {
        if (!page.public && !await canViewPage(page.pageId)) notFound();
    } catch (e) {
        notFound();
    }

    const content = page.content as { blocks: any[] } | null;
    const blocks = content?.blocks ?? [];

    return (
        <PageViewer
            title={page.title}
            blocks={blocks}
        />
    );
}