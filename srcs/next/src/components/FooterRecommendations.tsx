"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ForumCard, { PageData } from "@/components/ForumCard";

export default function Footer() {
  const [pages, setPages] = useState<PageData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchRecommendedPages() {
      try {

        // // 1. Appel à API de recommandation qui renvoie la liste d'IDs
        // // Exemple de réponse attendue: ["id-1", "id-2", "id-3"]
        // const recResponse = await fetch("/api/recommendations");
        // if (!recResponse.ok) throw new Error("Erreur recommandation");
        // const pageIds: string[] = await recResponse.json();

        // -------------------------------------------------------------
        // TEMPORAIRE : remplace l api recommandation, pour des test
        // -------------------------------------------------------------

        setLoading(true);
        const pageIds: string[] = ["1", "2", "8","10"];

        if (!pageIds || pageIds.length === 0) {
          setPages([]);
          return;
        }

        const pagePromises = pageIds.map(async (id) => {
          const res = await fetch(`/api/pages/${id}`);
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
  }, []);

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
                    <ForumCard key={page.pageId} page={page} className="flex-none w-64" />
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