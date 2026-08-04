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
        
        // CORRECTION ICI : Typer explicitement 'p' pour supprimer l'erreur 'implicitly has an any type'
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
    <footer className="w-full bg-slate-900 border-t border-slate-700 py-6 px-4 text-slate-300">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Recommandés pour vous
          </h3>

          {loading ? (
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-none w-64 h-48 bg-slate-800 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : pages.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Aucune recommandation pour le moment.</p>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-slate-700">
              {pages.map((page) => (
                <ForumCard key={page.pageId} page={page} className="flex-none w-64" />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-4 border-t border-slate-800 text-xs text-slate-500">
          <p>© 2026 42chan - Projet Transcendence</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:underline">Accueil</Link>
            <Link href="/privacy" className="hover:underline">Confidentialité</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}