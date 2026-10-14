"use client";

import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronDown, Clapperboard, Loader2, Tv } from "lucide-react";
import type { Title } from "@/lib/types";
import { api, type TitlesResponse } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { EASE, ErrorState, GENRES_FALLBACK } from "@/components/app/bits";
import { TitleCard } from "@/components/app/title-card";
import { GridSkeleton } from "@/components/app/skeletons";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SortKey = "popular" | "new" | "rating" | "year";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "popular", label: "Popular" },
  { value: "new", label: "New" },
  { value: "rating", label: "Rating" },
  { value: "year", label: "Year" },
];

const PAGE_SIZE = 24;

export function CatalogView({ type }: { type: "movie" | "series" }) {
  const viewParams = useAppStore((s) => s.viewParams);
  const [genre, setGenre] = useState<string | undefined>(viewParams.genre);
  const [sort, setSort] = useState<SortKey>("popular");

  /* re-sync filters whenever navigation params change */
  useEffect(() => {
    setGenre(viewParams.genre);
  }, [viewParams]);

  const query = useInfiniteQuery({
    queryKey: ["titles", { type, genre, sort }],
    queryFn: ({ pageParam }) =>
      api<TitlesResponse>(
        `/api/titles?type=${type}` +
          (genre ? `&genre=${encodeURIComponent(genre)}` : "") +
          `&sort=${sort}&limit=${PAGE_SIZE}&page=${pageParam}`
      ),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.total ? last.page + 1 : undefined,
    retry: 1,
  });

  const titles: Title[] = useMemo(
    () => query.data?.pages.flatMap((p) => p.titles) ?? [],
    [query.data]
  );

  const genreOptions = useMemo(() => {
    const found = new Set<string>();
    titles.forEach((t) => t.genres?.forEach((g) => found.add(g)));
    return Array.from(found).sort();
  }, [titles]);

  const total = query.data?.pages[0]?.total ?? 0;

  const heading = type === "movie" ? "Movies" : "Series";
  const HeadingIcon = type === "movie" ? Clapperboard : Tv;

  return (
    <section
      aria-label={`${heading} catalog`}
      className="px-4 pb-16 pt-24 md:px-8 md:pt-28"
    >
      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="mb-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-foreground md:text-4xl">
              <HeadingIcon aria-hidden className="size-8 text-rose-500" />
              {heading}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {query.isLoading
                ? "Loading catalog…"
                : `${total} title${total === 1 ? "" : "s"} • ${genre ?? "All genres"}`}
            </p>
          </div>

          {/* sort */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Sort by
            </span>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger
                aria-label="Sort titles"
                className="h-11 w-36 rounded-full border-white/10 bg-white/5"
              >
                <SelectValue />
                <ChevronDown aria-hidden className="size-4 opacity-50" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-popover">
                {SORTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* genre pills */}
        <div
          role="group"
          aria-label="Filter by genre"
          className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1"
        >
          <GenrePill
            active={!genre}
            onClick={() => setGenre(undefined)}
            label="All"
          />
          {(genreOptions.length ? genreOptions : GENRES_FALLBACK).map((g) => (
            <GenrePill
              key={g}
              active={genre === g}
              onClick={() => setGenre(g)}
              label={g}
            />
          ))}
        </div>
      </motion.div>

      {/* grid */}
      {query.isLoading ? (
        <GridSkeleton count={18} />
      ) : query.isError ? (
        <ErrorState
          message={
            query.error instanceof Error
              ? query.error.message
              : "Catalog unavailable."
          }
          onRetry={() => query.refetch()}
        />
      ) : titles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <p className="text-lg font-semibold text-foreground">
            No {heading.toLowerCase()} found
            {genre ? ` in ${genre}` : ""}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different genre or check back soon.
          </p>
          {genre && (
            <Button
              variant="outline"
              onClick={() => setGenre(undefined)}
              className="mt-4 rounded-full"
            >
              Clear genre filter
            </Button>
          )}
        </div>
      ) : (
        <>
          <div
            role="list"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5 xl:grid-cols-6"
          >
            {titles.map((t, i) => (
              <TitleCard
                key={t._id}
                title={t}
                index={i % PAGE_SIZE}
                fluid
                showCaption
              />
            ))}
          </div>

          {/* load more */}
          <div className="mt-8 flex flex-col items-center gap-3">
            {query.hasNextPage ? (
              <Button
                variant="outline"
                size="lg"
                onClick={() => query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
                className="h-12 w-full max-w-sm rounded-full border-white/15 bg-white/5 text-base font-semibold hover:border-rose-500/50 hover:bg-rose-500/10"
              >
                {query.isFetchingNextPage ? (
                  <>
                    <Loader2 aria-hidden className="size-4 animate-spin" />
                    Loading…
                  </>
                ) : (
                  "Load more titles"
                )}
              </Button>
            ) : (
              <p className="text-xs text-zinc-500">
                You&apos;ve reached the end — {titles.length} title
                {titles.length === 1 ? "" : "s"} loaded.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function GenrePill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-11 shrink-0 rounded-full border px-5 text-sm font-medium transition-all active:scale-95",
        active
          ? "border-transparent bg-gradient-to-r from-rose-500 to-rose-600 font-semibold text-white shadow-[0_0_24px_-8px_rgba(244,63,94,0.7)]"
          : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/25 hover:text-white"
      )}
    >
      {label}
    </button>
  );
}
