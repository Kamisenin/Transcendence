"use client";

import { useState } from "react";
import Link from "next/link";

export interface TagData {
  id: number;
  name: string;
  color?: number | null;
}

export interface PageData {
  pageId: number;
  title: string;
  description?: string | null;
  img?: string | null;
  slug: string;
  namespace: string;
  tags: TagData[];
}

interface ForumCardProps {
  page: PageData;
  className?: string;
}

export default function ForumCard({ page, className = "" }: ForumCardProps) {
  const [imgError, setImgError] = useState(false);

  const formatImgSrc = (src: string) => {
    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/")) {
      return src;
    }
    return `/${src}`;
  };

  const hasValidImg = page.img && !imgError;

  return (
    <Link
      href={`/wiki/${page.namespace}/${page.slug}`}
      className={`group relative bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-500 transition-all duration-300 hover:-translate-y-1 shadow-md flex flex-col justify-between p-4 ${className}`}
    >
      {/* Container supérieur (Image + Titre + Description) */}
      <div className="flex-1 flex flex-col">
        
        {/* BLOC IMAGE : Masqué au survol (opacity 0 + height 0) */}
        <div className="overflow-hidden transition-all duration-300 group-hover:h-0 group-hover:opacity-0 group-hover:mb-0 mb-3 h-28 w-full flex-shrink-0">
          {hasValidImg ? (
            <img
              src={formatImgSrc(page.img!)}
              alt={page.title}
              onError={() => setImgError(true)}
              className="h-28 w-full object-cover rounded"
            />
          ) : (
            <div className="h-28 w-full bg-slate-700/50 rounded flex items-center justify-center text-slate-500 text-xs">
              Pas d'image
            </div>
          )}
        </div>

        {/* BLOC TITRE + DESCRIPTION */}
        <div className="flex-1 flex flex-col justify-start transition-all duration-300">
          {/* Titre : change de couleur au survol */}
          <h4 className="font-medium text-white text-sm line-clamp-2 group-hover:text-blue-400 transition-colors">
            {page.title}
          </h4>

          {/* Description : cachée par défaut, apparaît au survol */}
          <div className="max-h-0 opacity-0 group-hover:max-h-32 group-hover:opacity-100 group-hover:mt-2 transition-all duration-300 overflow-hidden">
            <p className="text-xs text-slate-400 line-clamp-4 leading-relaxed">
              {page.description || "Aucune description disponible pour ce forum."}
            </p>
          </div>
        </div>

      </div>

      {/* BLOC TAGS : Ne bouge pas, reste collé en bas */}
      <div className="flex flex-wrap gap-1 mt-3 pt-2 border-t border-slate-700/50 flex-shrink-0">
        {page.tags?.map((tag) => (
          <span
            key={tag.id}
            className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full"
          >
            #{tag.name}
          </span>
        ))}
      </div>
    </Link>
  );
}