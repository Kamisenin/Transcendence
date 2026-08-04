import { NextResponse } from "next/server";
import { prisma } from "%/lib/prisma/prisma";

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
    const page = await prisma.page.findUnique({
      where: { pageId: numericId },
      select: {
        pageId: true,
        title: true,
        description: true, // <-- À vérifier/ajouter dans Prisma
        img: true, // 1. Récupération du lien de l'image (String?)
        slugs: {
          select: {
            slug: true,
            namespace: true,
            isCanonical: true,
          },
          orderBy: {
            isCanonical: "desc",
          },
          take: 1,
        },
        // 2. Récupération des tags via la relation intermédiaire TagPage, ne fonctionne pas donc on vas attendre que les tag soit terminer avent de le retravailler
        tagPages: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    if (!page) {
      return NextResponse.json({ error: "Page non trouvée" }, { status: 404 });
    }

    const currentSlug = page.slugs[0];

    // Formatage propre du tableau de tags pour le frontend
    const tags = page.tagPages.map((tp) => tp.tag);

    return NextResponse.json({
      pageId: page.pageId,
      title: page.title,
      description: page.description || "", 
      img: page.img || null, // Image renvoyée au frontend (null si vide)
      slug: currentSlug?.slug || "",
      namespace: currentSlug?.namespace || "",
      tags: tags, // Tableau de tags ex: [{ id: 1, name: "forum", color: 0xff0000 }, a revoir car j ai pas compris ton organisation
    });
  } catch (error) {
    console.error("Erreur API Page:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}