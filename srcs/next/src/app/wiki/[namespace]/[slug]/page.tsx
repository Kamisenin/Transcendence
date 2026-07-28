import { notFound, redirect } from 'next/navigation';
import { resolvePage } from '%/lib/page/page_resolver';
// On importe le client component qu'on vient de créer
import PageViewer from '@/components/page/PageViewer';

type Params = {
    params: Promise<{
        namespace: string;
        slug: string;
    }>;
};

export default async function WikiViewPage({ params }: Params) {
    // 1. Récupération des données côté serveur (Prisma)
    const { namespace, slug } = await params;
    const result = await resolvePage(namespace, slug);

    if (!result) notFound();

    const { page, redirectTo } = result;
    if (redirectTo) redirect(redirectTo);

    const content = page.content as { blocks: any[] } | null;
    const blocks = content?.blocks ?? [];

    // 2. On passe les données pures au composant client
    return (
        <PageViewer
            title={page.title}
            blocks={blocks}
        />
    );
}