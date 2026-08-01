"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PageData {
  pageId: string;
  title: string;
  slug: string;
  namespace: string;
}

export default function Footer() {
  const [pages, setPages] = useState<PageData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchRecommendedPages() {
      try {
        setLoading(true);

        // // 1. Appel à API de recommandation qui renvoie la liste d'IDs
        // // Exemple de réponse attendue: ["id-1", "id-2", "id-3"]
        // const recResponse = await fetch("/api/recommendations");
        // if (!recResponse.ok) throw new Error("Erreur recommandation");
        // const pageIds: string[] = await recResponse.json();

        // -------------------------------------------------------------
        // TEMPORAIRE : remplace l api recommandation, pour des test
        // -------------------------------------------------------------
        const pageIds: string[] = [
          "1",
          "2",
          "6"
        ];
        // -------------------------------------------------------------

        if (!pageIds || pageIds.length === 0) {
          setPages([]);
          return;
        }

        // 2. Pour chaque ID, on récupère le titre depuis la BDD (table "page")
        const pagePromises = pageIds.map(async (id) => {
          const res = await fetch(`/api/pages/${id}`);
          if (!res.ok) return null;
          return (await res.json()) as PageData;
        });

        const results = await Promise.all(pagePromises);
        // Filtrer les éventuelles pages introuvables ou erreurs
        const validPages = results.filter((p): p is PageData => p !== null);

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
        
        {/* Section Magazine */}
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
                <Link
                  key={page.pageId}
                  // Redirection vers la route de la page du forum
                  href={`/wiki/${page.namespace}/${page.slug}`}
                  className="group flex-none w-64 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-500 transition-all hover:-translate-y-1 shadow-md flex flex-col justify-between p-4"
                >
                  {/* Placeholder visuel temporaire pour l'image */}
                  <div className="h-28 w-full bg-slate-700/50 rounded flex items-center justify-center text-slate-500 text-xs mb-3">
                    [Image à venir]
                  </div>

                  {/* Titre dynamique venant de la BDD */}
                  <h4 className="font-medium text-white text-sm line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {page.title}
                  </h4>

                  {/* Placeholder temporaire pour les tags */}
                  <div className="flex gap-1 mt-3">
                    <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
                      #forum
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Bas de footer standard */}
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






// // src/components/Footer.tsx
// "use client";

// import Link from "next/link";
// import Image from "next/image";

// // 1. Structure d'un article
// interface Article {
//   id: string;
//   title: string;
//   imageUrl: string;
//   tags: string[];
//   url: string;
// }

// // 2. Exemples d'articles fictifs pour le test
// const DUMMY_ARTICLES: Article[] = [
//   {
//     id: "1",
//     title: "Guide ultime du Pong 3D",
//     imageUrl: "https://picsum.photos/300/150?random=1",
//     tags: ["Jeu", "3D", "Guide", "Tuto", "Pong"],
//     url: "/game/pong-guide",
//   },
//   {
//     id: "2",
//     title: "Mise à jour v2.0 disponible !",
//     imageUrl: "https://picsum.photos/300/150?random=2",
//     tags: ["Patch", "Update", "Info"],
//     url: "/news/v2",
//   },
//   {
//     id: "3",
//     title: "Tournoi 42chan ce week-end",
//     imageUrl: "https://picsum.photos/300/150?random=3",
//     tags: ["Event", "Tournoi", "Community"],
//     url: "/events/tournament",
//   },
//   {
//     id: "4",
//     title: "Comment personnaliser son avatar",
//     imageUrl: "https://picsum.photos/300/150?random=4",
//     tags: ["Profil", "Custom", "Avatar"],
//     url: "/profile/settings",
//   },
//   {
//     id: "5",
//     title: "Classement de la saison",
//     imageUrl: "https://picsum.photos/300/150?random=5",
//     tags: ["Leaderboard", "Rang"],
//     url: "/leaderboard",
//   },
// ];

// export default function Footer() {
//   return (
//     <footer className="w-full bg-slate-900 border-t border-slate-700 py-6 px-4 text-slate-300">
//       <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
//         {/* Section Magazine (Scroll horizontal) */}
//         <div>
//           <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
//             Recommandés pour vous
//           </h3>

//           {/* Le conteneur scrollable horizontalement */}
//           <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-slate-700">
//             {DUMMY_ARTICLES.map((article) => {
//               // On garde seulement les 3 premiers tags
//               const visibleTags = article.tags.slice(0, 3);

//               return (
//                 <Link
//                   key={article.id}
//                   href={article.url}
//                   className="group flex-none w-64 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-500 transition-all hover:-translate-y-1 shadow-md"
//                 >
//                   {/* Image de l'article */}
//                   <div className="relative h-32 w-full bg-slate-700 overflow-hidden">
//                     {/* Utilisation de <img> simple pour le test (facile sans config Next image) */}
//                     <img
//                       src={article.imageUrl}
//                       alt={article.title}
//                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
//                     />
//                   </div>

//                   {/* Infos de l'article */}
//                   <div className="p-3 flex flex-col justify-between">
//                     <h4 className="font-medium text-white text-sm line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors">
//                       {article.title}
//                     </h4>

//                     {/* Tags (3 max) */}
//                     <div className="flex flex-wrap gap-1">
//                       {visibleTags.map((tag, idx) => (
//                         <span
//                           key={idx}
//                           className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full"
//                         >
//                           #{tag}
//                         </span>
//                       ))}
//                     </div>
//                   </div>
//                 </Link>
//               );
//             })}
//           </div>
//         </div>

//         {/* Bas de footer standard */}
//         <div className="flex flex-col md:flex-row justify-between items-center pt-4 border-t border-slate-800 text-xs text-slate-500">
//           <p>© 2026 42chan - Projet Transcendence</p>
//           <div className="flex gap-4">
//             <Link href="/" className="hover:underline">Accueil</Link>
//             <Link href="/privacy" className="hover:underline">Confidentialité</Link>
//           </div>
//         </div>

//       </div>
//     </footer>
//   );
// }