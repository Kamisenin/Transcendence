"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ForumCard, { PageData } from "@/components/ForumCard";

interface FooterProps {
  userId?: string;
}

export default function Footer({ userId }: FooterProps) {
  const [pages, setPages] = useState<PageData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchRecommendedPages() {
      try {
        setLoading(true);

        // 1. Appel à FastAPI en utilisant le userId reçu
        const recResponse = await fetch(`http://localhost:8001/recommendation?user_id=${userId}`);
        if (!recResponse.ok) throw new Error("Erreur recommandation API");

        const data = await recResponse.json();
        
        // Extraire la liste des page_id
        const pageIds: (string | number)[] = data.recommendations.map(
          (rec: { page_id: number; score: number }) => rec.page_id
        );

        if (!pageIds || pageIds.length === 0) {
          setPages([]);
          return;
        }

        // 2. Récupérer les données détaillées de chaque page SANS CACHE BROWSER
        const pagePromises = pageIds.map(async (id) => {
          // 💡 On force le navigateur à récupérer la version fraîche depuis Postgres
          const res = await fetch(`/api/pages/${id}`, { cache: "no-store" });
          if (!res.ok) return null;
          return (await res.json()) as PageData;
        });

        const results = await Promise.all(pagePromises);
        const validPages = results.filter((p: PageData | null): p is PageData => p !== null);

        setPages(validPages);
      } catch (err) {
        console.error("Erreur chargement footer recommendations:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendedPages();
  }, [userId]);

  return (
    <footer className="w-full bg-muted border-t border-border py-6 px-4 text-foreground">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Recommandés pour vous
          </h3>

          {loading ? (
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-none w-64 h-48 bg-card animate-pulse rounded-lg border border-border" />
              ))}
            </div>
          ) : pages.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Aucune recommandation pour le moment.</p>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1 items-start">
              {pages.map((page) => (
                <ForumCard key={page.pageId} page={page} userId={userId} className="flex-none w-64" />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-4 border-t border-border text-xs text-muted-foreground">
          <p>© 2026 42chan - Projet Transcendence</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:underline text-foreground">Accueil</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}