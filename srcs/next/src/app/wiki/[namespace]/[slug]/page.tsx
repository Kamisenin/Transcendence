import { notFound, redirect } from 'next/navigation';
import { resolvePage } from '%/lib/page/page_resolver';
import PageViewer from '@/components/page/PageViewer';

import FooterRecommendations from "@/components/FooterRecommendations";
import { getCurrentUser } from "@/app/lib/session";

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
    if (!page)
        notFound();

    const content = page.content as { blocks: any[] } | null;
    const blocks = content?.blocks ?? [];

    const user = await getCurrentUser();

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-grow">
                <PageViewer
                    title={page.title}
                    blocks={blocks}
                />
            </main>

            <FooterRecommendations
                userId={user?.user_id}
                currentPageId={page.pageId}
            />
        </div>
    );
}