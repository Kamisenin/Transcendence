import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma/prisma";

// 💡 Force Next.js à ne JAMAIS mettre cette route en cache
export const dynamic = "force-dynamic"; 
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
        description: true,
        img: true,
        slugs: {
          select: { slug: true, namespace: true, isCanonical: true },
          orderBy: { isCanonical: "desc" },
          take: 1,
        },
        tagPages: {
          select: {
            tag: { select: { id: true, name: true, color: true } },
          },
        },
      },
    });

    if (!page) {
      return NextResponse.json({ error: "Page non trouvée" }, { status: 404 });
    }

    const currentSlug = page.slugs[0];

    const tags = page.tagPages
      .filter((tp) => tp.tag !== null)
      .map((tp) => ({
        id: tp.tag.id,
        name: tp.tag.name,
        color: tp.tag.color,
      }));

    return NextResponse.json({
      pageId: page.pageId,
      title: page.title,
      description: page.description || "",
      img: page.img || null,
      slug: currentSlug?.slug || "",
      namespace: currentSlug?.namespace || "",
      tags: tags,
    });
  } catch (error) {
    console.error("Erreur API Page:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}