"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Award,
  Flame,
  Play,
  Sparkles,
  Star,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { HomePayload } from "@/lib/types";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { EASE, ErrorState } from "@/components/app/bits";
import { ContentRow, ContinueWatchingRow } from "@/components/app/content-row";
import { HeroCarousel } from "@/components/app/hero-carousel";
import { BrowseSkeleton } from "@/components/app/skeletons";
import { Button } from "@/components/ui/button";

function rowIcon(key: string): LucideIcon | undefined {
  if (key.includes("trending")) return Flame;
  if (key.includes("new")) return Sparkles;
  if (key.includes("top-rated")) return Star;
  if (key.includes("acclaimed")) return Award;
  if (key.includes("genre")) return undefined;
  return undefined;
}

export function BrowseView() {
  const user = useAppStore((s) => s.user);
  const setView = useAppStore((s) => s.setView);
  const openAuth = useAppStore((s) => s.openAuth);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["home"],
    queryFn: () => api<HomePayload>("/api/home"),
    retry: 1,
  });

  if (isLoading) return <BrowseSkeleton />;

  if (error || !data) {
    return (
      <div className="px-4 pb-16 pt-28 md:px-8">
        <ErrorState
          message={
            error instanceof Error
              ? error.message
              : "Home content is unavailable."
          }
          onRetry={refetch}
        />
      </div>
    );
  }

  const genreOf = (rowKey: string, rowTitle: string) =>
    rowKey.startsWith("genre")
      ? rowKey.replace(/^genre[:-]/, "") || rowTitle
      : undefined;

  const exploreAllFor = (row: { key: string; title: string; items: { type: "movie" | "series" }[] }) => {
    const type = row.items[0]?.type === "series" ? "series" : "movies";
    setView(type, genreOf(row.key, row.title) ? { genre: genreOf(row.key, row.title) } : undefined);
  };

  return (
    <div>
      <HeroCarousel titles={data.hero} />

      <div className="relative z-10 -mt-14 space-y-10 pb-16 md:-mt-20">
        {/* continue watching (users) or guest CTA */}
        {user ? (
          data.continueWatching.length > 0 && (
            <ContinueWatchingRow items={data.continueWatching} />
          )
        ) : (
          <section aria-label="Continue watching" className="px-4 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: EASE }}
              className="glass relative flex flex-col items-start gap-5 overflow-hidden rounded-2xl p-6 sm:flex-row sm:items-center md:p-8"
            >
              <div
                aria-hidden
                className="absolute -right-10 -top-16 size-44 rounded-full bg-rose-600/20 blur-3xl"
              />
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-[0_0_30px_-8px_rgba(244,63,94,0.7)]">
                <Play aria-hidden className="size-6 translate-x-0.5 fill-current" />
              </div>
              <div className="relative flex-1">
                <h2 className="text-lg font-bold tracking-tight text-foreground md:text-xl">
                  Continue watching across devices
                </h2>
                <p className="mt-1 max-w-lg text-sm text-muted-foreground">
                  Sign in to pick up where you left off, sync your list and get
                  personalized recommendations.
                </p>
              </div>
              <div className="relative flex shrink-0 gap-2.5">
                <Button
                  onClick={() => openAuth("login")}
                  className="h-11 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-6 font-semibold shadow-[0_0_30px_-10px_rgba(244,63,94,0.6)] hover:from-rose-400 hover:to-rose-500"
                >
                  Sign In
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => openAuth("register")}
                  className="h-11 rounded-full px-5 text-zinc-300 hover:bg-white/10 hover:text-white"
                >
                  Create account
                </Button>
              </div>
            </motion.div>
          </section>
        )}

        {/* rows */}
        {data.rows.map((row, i) => (
          <div key={row.key}>
            <ContentRow
              title={row.title}
              items={row.items}
              icon={rowIcon(row.key)}
              onExploreAll={() => exploreAllFor(row)}
            />
            {/* insert Top 10 after the first row */}
            {i === 0 && data.top10?.length > 0 && (
              <div className="mt-10">
                <ContentRow
                  title="Top 10 on NOVA"
                  items={data.top10}
                  variant="top10"
                  icon={TrendingUp}
                  onExploreAll={() => setView("movies")}
                />
              </div>
            )}
          </div>
        ))}

        {/* top10 fallback when no rows */}
        {data.rows.length === 0 && data.top10?.length > 0 && (
          <ContentRow
            title="Top 10 on NOVA"
            items={data.top10}
            variant="top10"
            icon={TrendingUp}
            onExploreAll={() => setView("movies")}
          />
        )}
      </div>
    </div>
  );
}
