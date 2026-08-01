import { NextResponse } from "next/server";
import { prisma } from "%/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Récupération de l'ID depuis l'URL
  const { id } = await params;

  // 2. Conversion en entier (car pageId est Int dans ta BDD)
  const numericId = parseInt(id, 10);

  if (isNaN(numericId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  try {
    // 3. Requête Prisma avec le champ 'slugs' issu de ton schema.prisma
    const page = await prisma.page.findUnique({
      where: { pageId: numericId },
      select: {
        pageId: true,
        title: true,
        slugs: {
          select: {
            slug: true,
            namespace: true,
            isCanonical: true,
          },
          orderBy: {
            isCanonical: "desc", // On prend le slug principal (canonical) en premier
          },
          take: 1,
        },
      },
    });

    if (!page) {
      return NextResponse.json({ error: "Page non trouvée" }, { status: 404 });
    }

    const currentSlug = page.slugs[0];

    return NextResponse.json({
      pageId: page.pageId,
      title: page.title,
      slug: currentSlug?.slug || "",
      namespace: currentSlug?.namespace || "",
    });
  } catch (error) {
    console.error("Erreur API Page:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
