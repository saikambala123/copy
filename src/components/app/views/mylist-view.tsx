"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { Bookmark, Compass, LogIn } from "lucide-react";
import type { Title } from "@/lib/types";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { EASE, EmptyState, ErrorState } from "@/components/app/bits";
import { TitleCard } from "@/components/app/title-card";
import { GridSkeleton } from "@/components/app/skeletons";
import { Button } from "@/components/ui/button";
import { useWatchlist } from "@/components/app/bits";
import { motion } from "framer-motion";

export function MyListView() {
  const user = useAppStore((s) => s.user);
  const openAuth = useAppStore((s) => s.openAuth);
  const setView = useAppStore((s) => s.setView);
  const { toggle, pending } = useWatchlist();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => api<{ titles: Title[] }>("/api/watchlist"),
    enabled: !!user,
    retry: 0,
  });

  /* guests */
  if (!user) {
    return (
      <section className="mx-auto max-w-3xl px-4 pb-16 pt-24 md:px-8 md:pt-32">
        <EmptyState
          icon={LogIn}
          title="Sign in to see your list"
          description="Your watchlist syncs across all your devices — save films and series to binge later."
          action={
            <Button
              onClick={() => openAuth("login")}
              className="h-12 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-7 font-bold shadow-[0_0_36px_-10px_rgba(244,63,94,0.6)] hover:from-rose-400 hover:to-rose-500"
            >
              Sign In
            </Button>
          }
        />
      </section>
    );
  }

  return (
    <section
      aria-label="My list"
      className="mx-auto max-w-7xl px-4 pb-16 pt-24 md:px-8 md:pt-28"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="mb-6"
      >
        <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-foreground md:text-4xl">
          <Bookmark aria-hidden className="size-8 text-rose-500" />
          My List
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {isLoading
            ? "Loading your list…"
            : `${data?.titles.length ?? 0} title${(data?.titles.length ?? 0) === 1 ? "" : "s"} saved`}
        </p>
      </motion.div>

      {isLoading ? (
        <GridSkeleton count={12} />
      ) : error ? (
        <ErrorState
          message={error instanceof Error ? error.message : "Watchlist unavailable."}
          onRetry={refetch}
        />
      ) : !data?.titles.length ? (
        <EmptyState
          icon={Compass}
          title="Your list is empty"
          description="Tap the + on any title to save it here. Explore what's trending to get started."
          action={
            <Button
              onClick={() => setView("browse")}
              className="h-12 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-7 font-bold shadow-[0_0_36px_-10px_rgba(244,63,94,0.6)] hover:from-rose-400 hover:to-rose-500"
            >
              Browse titles
            </Button>
          }
        />
      ) : (
        <div
          role="list"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5 xl:grid-cols-6"
        >
          {data.titles.map((t, i) => (
            <TitleCard
              key={t._id}
              title={t}
              index={i}
              fluid
              showCaption
              onRemove={pending ? undefined : () => toggle(t)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/** kept for tree-shaking friendliness — used by account view */
export function useInvalidateWatchlist() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["watchlist"] });
}
