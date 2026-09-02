"use client";

import { useState } from "react";
import Link from "next/link";

export interface TagData {
  id: number;
  name: string;
  color?: string | number | null;
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
  userId?: string;
  className?: string;
}

function formatTagColor(color?: string | number | null): string | undefined {
  if (color === null || color === undefined) return undefined;
  if (typeof color === "number") {
    return `#${color.toString(16).padStart(6, "0")}`;
  }
  if (typeof color === "string" && !color.startsWith("#")) {
    return `#${color}`;
  }
  return color;
}

export default function ForumCard({ page, userId, className = "" }: ForumCardProps) {
  const [imgError, setImgError] = useState(false);

  const formatImgSrc = (src: string) => {
    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/")) {
      return src;
    }
    return `/${src}`;
  };

  const hasValidImg = page.img && !imgError;

  const handleClick = () => {
      console.log("ForumCard click", {
    userId,
    pageId: page.pageId,
  });

  if (!userId) return;

    fetch("http://localhost:8001/recommendation/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        page_id: page.pageId,
        event: "visit",
      }),
    }).catch((err) => console.error("Erreur envoi event:", err));
  };

  return (
    <Link
      href={`/wiki/${page.namespace}/${page.slug}`}
      onClick={handleClick}
      className={`group relative bg-card text-card-foreground border border-border rounded-lg overflow-hidden hover:border-ring transition-all duration-300 hover:-translate-y-1 shadow-md flex flex-col justify-between p-4 h-56 ${className}`}
    >
      <div className="flex-1 flex flex-col min-h-0">
        
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

        <div className="flex-1 flex flex-col justify-start min-h-0 pb-1">
          <h4 className="font-semibold text-card-foreground text-base leading-snug line-clamp-2 flex-shrink-0">
            {page.title}
          </h4>

          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-24 group-hover:mt-2 transition-all duration-300 overflow-hidden">
            {page.description || ""}
          </p>
        </div>

      </div>

      <div className="flex flex-wrap items-center gap-1 mt-2 pt-2 border-t border-border flex-shrink-0 overflow-hidden max-h-7">
        {(() => {
          const MAX_CHARS = 35;
          let currentChars = 0;
          const visibleTags = [];

          if (!page.tags) return null;

          for (let i = 0; i < page.tags.length; i++) {
            const tag = page.tags[i];
            const tagLen = tag.name.length;

            if (currentChars + tagLen > MAX_CHARS && visibleTags.length > 0) {
              break;
            }

            visibleTags.push(tag);
            currentChars += tagLen;

            if (currentChars >= MAX_CHARS) {
              break;
            }
          }

          return visibleTags.map((tag) => {
            const bgHex = formatTagColor(tag.color);
            return (
              <span
                key={tag.id}
                style={
                  bgHex
                    ? { backgroundColor: bgHex, color: "#ffffff" }
                    : undefined
                }
                className={`text-[10px] px-2 py-0.5 rounded-full border border-border/50 truncate max-w-[120px] ${
                  !bgHex ? "bg-muted text-muted-foreground" : ""
                }`}
              >
                #{tag.name}
              </span>
            );
          });
        })()}
      </div>
    </Link>
  );
}