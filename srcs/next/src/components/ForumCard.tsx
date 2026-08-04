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
      /* h-52 bloque la hauteur globale pour éviter le layout shift */
      className={`group relative bg-card text-card-foreground border border-border rounded-lg overflow-hidden hover:border-ring transition-all duration-300 hover:-translate-y-1 shadow-md flex flex-col justify-between p-4 h-52 ${className}`}
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* CONTAINER IMAGE */}
        <div className="transition-all duration-300 group-hover:h-0 group-hover:opacity-0 group-hover:mb-0 mb-3 h-28 w-full flex-shrink-0 overflow-hidden">
          {hasValidImg ? (
            <img
              src={formatImgSrc(page.img!)}
              alt={page.title}
              onError={() => setImgError(true)}
              className="h-28 w-full object-cover rounded"
            />
          ) : (
            <div className="h-28 w-full bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
              Pas d'image
            </div>
          )}
        </div>

        {/* TITRE + DESCRIPTION */}
        <div className="flex-1 flex flex-col justify-start overflow-hidden">
          <h4 className="font-medium text-card-foreground text-sm line-clamp-2 group-hover:text-highlight transition-colors flex-shrink-0">
            {page.title}
          </h4>

          {/* Description : apparaît au survol */}
          <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-28 group-hover:mt-2 transition-all duration-300 overflow-hidden">
            {page.description || "Aucune description disponible pour ce forum."}
          </p>
        </div>

      </div>

      {/* TAGS */}
      <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-border flex-shrink-0">
        {page.tags?.map((tag) => (
          <span
            key={tag.id}
            className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border/50"
          >
            #{tag.name}
          </span>
        ))}
      </div>
    </Link>
  );
}