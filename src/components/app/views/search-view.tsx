"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Clapperboard, History, Search, SearchX, Tv, X } from "lucide-react";
import type { Title } from "@/lib/types";
import { api, type TitlesResponse } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import {
  EASE,
  ErrorState,
  GENRES_FALLBACK,
  useDebounced,
} from "@/components/app/bits";
import { TitleCard } from "@/components/app/title-card";
import { GridSkeleton } from "@/components/app/skeletons";
import { cn } from "@/lib/utils";

const RECENTS_KEY = "nova-recent-searches";

type TypeFilter = "all" | "movie" | "series";

export function SearchView() {
  const viewParams = useAppStore((s) => s.viewParams);
  const [q, setQ] = useState(viewParams.query ?? "");
  const [type, setType] = useState<TypeFilter>("all");
  const [genre, setGenre] = useState<string | undefined>(viewParams.genre);
  /* this view never renders during hydration (initial view is browse) */
  const [recents, setRecents] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(RECENTS_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const debouncedQ = useDebounced(q, 300);

  /* re-sync filters whenever navigation params change (render-time) */
  const [prevParams, setPrevParams] = useState(viewParams);
  if (viewParams !== prevParams) {
    setPrevParams(viewParams);
    setQ(viewParams.query ?? "");
    setGenre(viewParams.genre);
  }

  const commitRecent = (term: string) => {
    const t = term.trim();
    if (!t) return;
    setRecents((prev) => {
      const next = [t, ...prev.filter((r) => r !== t)].slice(0, 8);
      try {
        localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["titles", { q: debouncedQ, type, genre, scope: "search" }],
    queryFn: () =>
      api<TitlesResponse>(
        `/api/titles?q=${encodeURIComponent(debouncedQ.trim())}` +
          (type !== "all" ? `&type=${type}` : "") +
          (genre ? `&genre=${encodeURIComponent(genre)}` : "") +
          `&limit=48`
      ),
    placeholderData: keepPreviousData,
    retry: 1,
  });

  const titles: Title[] = data?.titles ?? [];
  const genreOptions = useMemo(() => {
    const found = new Set<string>();
    titles.forEach((t) => t.genres?.forEach((g) => found.add(g)));
    return Array.from(found).sort();
  }, [titles]);

  const showEmptyArt = !isLoading && !isError && debouncedQ.trim() && titles.length === 0;

  return (
    <section
      aria-label="Search"
      className="mx-auto max-w-7xl px-4 pb-16 pt-24 md:px-8 md:pt-28"
    >
      {/* big input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
      >
        <h1 className="sr-only">Search titles</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            commitRecent(q);
          }}
          className="glass flex h-14 items-center gap-3 rounded-2xl px-5 transition-colors focus-within:border-rose-500/50 md:h-16"
        >
          <Search aria-hidden className="size-5 shrink-0 text-rose-500" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search for movies, series, genres…"
            aria-label="Search query"
            className="h-full w-full bg-transparent text-base text-foreground placeholder:text-zinc-500 focus:outline-none md:text-lg"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear search"
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-white/10 hover:text-white"
            >
              <X aria-hidden className="size-4" />
            </button>
          )}
          <button
            type="submit"
            className="hidden h-11 shrink-0 items-center rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-6 text-sm font-bold text-white transition hover:from-rose-400 hover:to-rose-500 sm:flex"
          >
            Search
          </button>
        </form>

        {/* filter chips */}
        <div
          role="group"
          aria-label="Filters"
          className="mt-4 flex flex-wrap items-center gap-2"
        >
          <FilterChip
            active={type === "all"}
            onClick={() => setType("all")}
            label="All"
          />
          <FilterChip
            active={type === "movie"}
            onClick={() => setType("movie")}
            label="Movies"
            icon={Clapperboard}
          />
          <FilterChip
            active={type === "series"}
            onClick={() => setType("series")}
            label="Series"
            icon={Tv}
          />
          <span aria-hidden className="mx-1 hidden h-6 w-px bg-white/10 sm:block" />
          <FilterChip
            active={!genre}
            onClick={() => setGenre(undefined)}
            label="Any genre"
          />
          {(genreOptions.length ? genreOptions : GENRES_FALLBACK)
            .slice(0, 10)
            .map((g) => (
              <FilterChip
                key={g}
                active={genre === g}
                onClick={() => setGenre(genre === g ? undefined : g)}
                label={g}
              />
            ))}
        </div>

        {/* recent searches */}
        {!q && recents.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <History aria-hidden className="size-3.5" />
              Recent
            </span>
            {recents.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setQ(r)}
                className="h-9 rounded-full border border-white/10 bg-white/5 px-4 text-xs font-medium text-zinc-300 transition hover:border-rose-500/40 hover:text-white"
              >
                {r}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setRecents([]);
                try {
                  localStorage.removeItem(RECENTS_KEY);
                } catch {
                  /* ignore */
                }
              }}
              className="h-9 rounded-full px-3 text-xs text-zinc-500 transition hover:text-rose-400"
            >
              Clear
            </button>
          </div>
        )}
      </motion.div>

      {/* results */}
      <div className="mt-8">
        {isLoading ? (
          <GridSkeleton count={12} />
        ) : isError ? (
          <ErrorState
            message={
              error instanceof Error ? error.message : "Search is unavailable."
            }
            onRetry={refetch}
          />
        ) : showEmptyArt ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-12 text-center"
          >
            <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/15 to-amber-500/10 text-rose-400">
              <SearchX aria-hidden className="size-7" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">
                No results for &ldquo;{debouncedQ.trim()}&rdquo;
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try different keywords or remove filters.
              </p>
            </div>
          </motion.div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
              {debouncedQ.trim()
                ? `${titles.length} result${titles.length === 1 ? "" : "s"} for “${debouncedQ.trim()}”`
                : titles.length
                  ? "Popular on NOVA right now"
                  : ""}
            </p>
            <div
              role="list"
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5 xl:grid-cols-6"
            >
              {titles.map((t, i) => (
                <TitleCard
                  key={t._id}
                  title={t}
                  index={i}
                  fluid
                  showCaption
                  highlightTerm={debouncedQ.trim()}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: typeof Tv;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-all active:scale-95",
        active
          ? "border-transparent bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-[0_0_24px_-8px_rgba(244,63,94,0.7)]"
          : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/25 hover:text-white"
      )}
    >
      {Icon && <Icon aria-hidden className="size-4" />}
      {label}
    </button>
  );
}
