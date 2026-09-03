import { notFound, redirect } from 'next/navigation';
import { resolvePage } from '%/lib/page/page_resolver';
import PageViewer from '@/components/page/PageViewer';

import FooterRecommendations from "@/components/FooterRecommendations";
import { getCurrentUser } from "@/app/lib/session";
import { prisma } from "%/lib/prisma/prisma";

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

    // Vérifier si la page possède au moins un tag associé
    const pageTags = await prisma.tagPage.findMany({
        where: {
            pageId: page.pageId
        },
        select: {
            tagId: true
        }
    });

    const hasTags = pageTags.length > 0;

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
                hasTags={hasTags}
            />
        </div>
    );
}