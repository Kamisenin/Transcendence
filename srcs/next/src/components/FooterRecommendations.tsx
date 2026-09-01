
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ForumCard, { PageData } from "@/components/ForumCard";

interface FooterProps {
  userId?: string;
  currentPageId: number;
}

type Mode = "recommendations" | "favorites";

export default function Footer({
  userId,
  currentPageId,
}: FooterProps) {
  const [mode, setMode] = useState<Mode>("recommendations");
  const [pages, setPages] = useState<PageData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [reaction, setReaction] = useState<"favorite" | "dislike" | null>(null);
  const [animationDirection, setAnimationDirection] = useState<
  "left" | "right"
>("right");

const handleReaction = async (event: "favorite" | "dislike") => {
  if (!userId) return;

  try {
    if (reaction === event) {
      const cancelEvent =
        event === "favorite"
          ? "cancel_favorite"
          : "cancel_dislike";

      const response = await fetch(
        "http://localhost:8001/recommendation/event",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            page_id: currentPageId,
            event: cancelEvent,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Cancel reaction API error");
      }

      setReaction(null);
      return;
    }

    const response = await fetch(
      "http://localhost:8001/recommendation/event",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          page_id: currentPageId,
          event,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();

      console.error(
        "Reaction API error:",
        response.status,
        errorData
      );

      return;
    }

    setReaction(event);

  } catch (error) {
    console.error("Error handling reaction:", error);
  }
};


const handleModeChange = (newMode: Mode) => {
  if (newMode === mode) return;

  if (mode === "recommendations" && newMode === "favorites") {
    setAnimationDirection("right");
  } else {
    setAnimationDirection("left");
  }

  setMode(newMode);
};

  useEffect(() => {
    if (!userId) {
      setReaction(null);
      return;
    }

    async function fetchReaction() {
      try {
        const response = await fetch(
          `http://localhost:8001/recommendation/reaction?user_id=${userId}&page_id=${currentPageId}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Reaction API error");
        }

        const data = await response.json();

        if (data.reaction === "FAVORITE") {
          setReaction("favorite");
        } else if (data.reaction === "DISLIKE") {
          setReaction("dislike");
        } else {
          setReaction(null);
        }
      } catch (error) {
        console.error("Error loading reaction:", error);
        setReaction(null);
      }
    }

    fetchReaction();
  }, [userId, currentPageId]);


  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchPages() {
      try {
        setLoading(true);

        let pageIds: number[] = [];

        // ========================================================
        // RECOMMENDATIONS
        // ========================================================
        if (mode === "recommendations") {
          const recResponse = await fetch(
            `http://localhost:8001/recommendation?user_id=${userId}&page_id=${currentPageId}`,
            {
              cache: "no-store",
            }
          );

          if (!recResponse.ok) {
            throw new Error("Recommendation API error");
          }

          const data = await recResponse.json();

          pageIds = data.recommendations.map(
            (rec: { page_id: number; score: number }) => rec.page_id
          );
        }

        // ========================================================
        // FAVORITES
        // ========================================================
        if (mode === "favorites") {
          const response = await fetch(
            `http://localhost:8001/recommendation/favorites?user_id=${userId}`,
            {
              cache: "no-store",
            }
          );

          if (!response.ok) {
            throw new Error("Favorites API error");
          }

          const data = await response.json();

          pageIds = data.favorites;
        }

        // Ne pas afficher la page actuellement ouverte
        pageIds = pageIds.filter(
          (pageId) => pageId !== currentPageId
        );

        if (pageIds.length === 0) {
          setPages([]);
          return;
        }

        // ========================================================
        // LOAD PAGE DATA
        // ========================================================
        const pagePromises = pageIds.map(async (id) => {
          const response = await fetch(`/api/pages/${id}`, {
            cache: "no-store",
          });

          if (!response.ok) {
            return null;
          }

          return (await response.json()) as PageData;
        });

        const results = await Promise.all(pagePromises);

        const validPages = results.filter(
          (page: PageData | null): page is PageData =>
            page !== null
        );

        setPages(validPages);
      } catch (error) {
        console.error(
          "Error loading footer pages:",
          error
        );
        setPages([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPages();
  }, [userId, currentPageId, mode]);

  return (
    <footer className="relative w-full bg-muted border-t border-border py-6 px-4 text-foreground">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">

    {userId && (
      <div className="absolute left-4 -top-14 flex gap-2">

        {/* FAVORITE */}
        <button
          type="button"
          onClick={() => handleReaction("favorite")}
          disabled={reaction === "dislike"}
          className={`favorite-button w-11 h-11 shrink-0 rounded-full bg-card border border-border shadow-md
                      flex items-center justify-center
                      text-muted-foreground hover:text-foreground
                      ${reaction === "favorite" ? "active" : ""}
                      ${reaction === "dislike" ? "reaction-hidden" : ""}`}
          title={
            reaction === "favorite"
              ? "Remove from favorites"
              : "Add to favorites"
          }
        >
          <span
            className={`favorite-icon ${
              reaction === "favorite" ? "pop active" : ""
            }`}
          >
            ♥
          </span>
        </button>

        {/* DISLIKE */}
        <button
          type="button"
          onClick={() => handleReaction("dislike")}
          disabled={reaction === "favorite"}
          className={`dislike-button w-11 h-11 shrink-0 rounded-full bg-card border border-border shadow-md
                      flex items-center justify-center
                      text-muted-foreground hover:text-foreground
                      ${reaction === "dislike" ? "active" : ""}
                      ${reaction === "favorite" ? "reaction-hidden" : ""}`}
          title={
            reaction === "dislike"
              ? "Remove dislike"
              : "Dislike"
          }
        >
          <span
            className={`dislike-icon ${
              reaction === "dislike" ? "pop active" : ""
            }`}
          >
            ×
          </span>
        </button>

      </div>
    )}
        <div>
          <div className="flex justify-start mb-4">
            <div className="inline-flex rounded-full bg-card border border-border p-1">

              <button
                type="button"
                onClick={() => handleModeChange("recommendations")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  mode === "recommendations"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Recommendations
              </button>

              <button
                type="button"
                onClick={() => handleModeChange("favorites")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  mode === "favorites"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Favorites
              </button>

            </div>
          </div>

          {pages.length === 0 && loading ? (
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex-none w-64 h-48 bg-card animate-pulse rounded-lg border border-border"
                />
              ))}
            </div>
          ) : pages.length === 0 ? (
            <p className="text-xs text-muted-foreground italic text-center">
              {mode === "favorites"
                ? "No favorites yet."
                : "No recommendations available."}
            </p>
          ) : (
            <div className="relative overflow-hidden min-h-[224px]">
              <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1 items-start">
                {pages.map((page, index) => (
                  <div
                    key={`${mode}-${page.pageId}`}
                    className={
                      animationDirection === "right"
                        ? "recommendation-card-from-right"
                        : "recommendation-card-from-left"
                    }
                  style={{
                    animationDelay: `${(pages.length - 1 - index) * 20}ms`,
                    animationDuration: "900ms",
                    animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                    animationFillMode: "both",
                  }}
                  >
                    <ForumCard
                      page={page}
                      userId={userId}
                      className="flex-none w-64"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>


        <div className="flex flex-col md:flex-row justify-between items-center pt-4 border-t border-border text-xs text-muted-foreground">
          <p>© 2026 42chan - Transcendence Project</p>

          <div className="flex gap-4">
            <Link
              href="/"
              className="hover:underline text-foreground"
            >
              Home
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
