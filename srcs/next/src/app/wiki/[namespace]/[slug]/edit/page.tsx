import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers'
import { getSessionUser, getSessionCookie } from '%/lib/session';
import { resolvePage } from '%/lib/page/page_resolver';
import PageBuilder from '@/components/page/editor/PageBuilder';

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

    const result = await resolvePage(namespace, slug);
    if (!result) notFound();

    // En mode édition, on ne redirige PAS vers le canonique —
    // on veut que l'utilisateur puisse éditer via n'importe quel slug valide.
    const { page } = result;
    console.log(result);

    // TODO (étape ultérieure) : vérifier canEditPage(session.user.token, page.pageId)
    // et notFound() ou redirect vers une page d'erreur si pas les droits.

    const content = page.content as { blocks: any[] } | null;


    return (
        <PageBuilder
            pageId={page.pageId}
            initialTitle={page.title}
            initialBlocks={content?.blocks ?? []}
        />
    );
}