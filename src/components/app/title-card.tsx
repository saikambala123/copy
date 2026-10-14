"use client";

import { motion } from "framer-motion";
import { Check, Play, Plus, Star, X } from "lucide-react";
import type { Title, WatchProgressItem } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import {
  EASE,
  formatClock,
  matchPercent,
  useWatchlist,
} from "@/components/app/bits";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* poster body shared by standard + top10 cards                        */
/* ------------------------------------------------------------------ */

function PosterBody({
  title,
  inList,
  onPlay,
  onToggle,
  onRemove,
  highlightTerm,
}: {
  title: Title;
  inList: boolean;
  onPlay: () => void;
  onToggle: () => void;
  onRemove?: () => void;
  highlightTerm?: string;
}) {
  return (
    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-zinc-800/70 to-zinc-950">
      <img
        src={title.poster}
        alt={`${title.title} (${title.year}) poster`}
        loading="lazy"
        className="h-full w-full object-cover"
        draggable={false}
      />

      {title.isNew && (
        <span className="absolute left-2 top-2 rounded bg-gradient-to-r from-rose-600 to-rose-500 px-1.5 py-0.5 text-[10px] font-black tracking-widest text-white shadow-lg">
          NEW
        </span>
      )}
      {title.quality === "4K" && (
        <span className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-black tracking-wider text-amber-400 backdrop-blur-sm">
          4K
        </span>
      )}

      {/* quick info overlay */}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/95 via-black/50 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
        <p className="line-clamp-2 text-sm font-semibold leading-tight text-white">
          {highlightTerm ? (
            <Highlight text={title.title} term={highlightTerm} />
          ) : (
            title.title
          )}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-300">
          <span className="font-semibold text-emerald-400">
            {matchPercent(title._id)}
          </span>
          <span>{title.year}</span>
          <span className="flex items-center gap-0.5 font-semibold text-amber-400">
            <Star aria-hidden className="size-3 fill-amber-400" />
            {title.rating?.toFixed(1)}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            aria-label={`Play ${title.title}`}
            className="flex size-9 items-center justify-center rounded-full bg-white text-black transition hover:bg-rose-500 hover:text-white active:scale-90"
          >
            <Play aria-hidden className="size-4 fill-current" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            aria-label={inList ? `Remove ${title.title} from My List` : `Add ${title.title} to My List`}
            className="flex size-9 items-center justify-center rounded-full border border-white/30 bg-black/50 text-white backdrop-blur transition hover:border-rose-500 hover:bg-rose-500/20 active:scale-90"
          >
            {inList ? (
              <Check aria-hidden className="size-4" />
            ) : (
              <Plus aria-hidden className="size-4" />
            )}
          </button>
          {onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              aria-label={`Remove ${title.title} from this list`}
              className="ml-auto flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/50 text-zinc-300 backdrop-blur transition hover:border-red-500/60 hover:text-red-400 active:scale-90"
            >
              <X aria-hidden className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Highlight({ text, term }: { text: string; term: string }) {
  const t = term.trim().toLowerCase();
  if (!t) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(t);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-rose-500/30 px-0.5 text-rose-200">
        {text.slice(idx, idx + term.trim().length)}
      </mark>
      {text.slice(idx + term.trim().length)}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* title card                                                          */
/* ------------------------------------------------------------------ */

export interface TitleCardProps {
  title: Title;
  index?: number;
  /** top-10 rank (renders giant outlined numeral) */
  rank?: number;
  /** fluid width for grids (default: fixed row widths) */
  fluid?: boolean;
  /** show caption below the poster */
  showCaption?: boolean;
  highlightTerm?: string;
  onRemove?: () => void;
  className?: string;
}

export function TitleCard({
  title,
  index = 0,
  rank,
  fluid = false,
  showCaption = false,
  highlightTerm,
  onRemove,
  className,
}: TitleCardProps) {
  const openDetail = useAppStore((s) => s.openDetail);
  const setView = useAppStore((s) => s.setView);
  const { isIn, toggle } = useWatchlist();
  const inList = isIn(title._id);

  const open = () => openDetail(title._id);
  const play = () => setView("watch", { titleId: title._id });

  /* -------- top 10 variant -------- */
  if (rank !== undefined) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.5), ease: EASE }}
        role="button"
        tabIndex={0}
        aria-label={`#${rank} — ${title.title}`}
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
          }
        }}
        className={cn(
          "group relative aspect-[2/3] shrink-0 snap-start outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:cursor-pointer",
          fluid ? "w-full" : "w-[190px] sm:w-[215px] md:w-[245px]",
          className
        )}
      >
        <span
          aria-hidden
          className="number-outline pointer-events-none absolute inset-y-0 left-0 flex items-end pb-2 font-black leading-none tracking-tighter"
          style={{ fontSize: "clamp(4.5rem, 14vw, 8.5rem)" }}
        >
          {rank}
        </span>
        <motion.div
          whileHover={{ scale: 1.06, y: -6 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="absolute inset-y-0 right-0 z-10 w-[118px] md:w-[150px]"
        >
          <PosterBody
            title={title}
            inList={inList}
            onPlay={play}
            onToggle={() => toggle(title)}
          />
        </motion.div>
      </motion.div>
    );
  }

  /* -------- standard card -------- */
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.5), ease: EASE }}
      role="button"
      tabIndex={0}
      aria-label={`${title.title} (${title.year})`}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
      className={cn(
        "group shrink-0 snap-start outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:cursor-pointer",
        fluid ? "w-full" : "w-[132px] sm:w-[150px] md:w-[170px] lg:w-[185px]",
        className
      )}
    >
      <motion.div
        whileHover={{ scale: 1.06, y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        <PosterBody
          title={title}
          inList={inList}
          onPlay={play}
          onToggle={() => toggle(title)}
          onRemove={onRemove}
          highlightTerm={highlightTerm}
        />
      </motion.div>
      {showCaption && (
        <p className="mt-2 line-clamp-1 text-sm font-medium text-zinc-200">
          {highlightTerm ? (
            <Highlight text={title.title} term={highlightTerm} />
          ) : (
            title.title
          )}
        </p>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* continue watching card (landscape)                                  */
/* ------------------------------------------------------------------ */

export function ContinueCard({
  item,
  index = 0,
}: {
  item: WatchProgressItem;
  index?: number;
}) {
  const setView = useAppStore((s) => s.setView);
  const openDetail = useAppStore((s) => s.openDetail);
  const pct =
    item.durationSeconds > 0
      ? Math.min(100, (item.progressSeconds / item.durationSeconds) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.5), ease: EASE }}
      className="group w-[240px] shrink-0 snap-start sm:w-[270px] md:w-[300px]"
    >
      <motion.div
        whileHover={{ scale: 1.04, y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        role="button"
        tabIndex={0}
        aria-label={`Resume ${item.title.title}`}
        onClick={() => setView("watch", { titleId: item.titleId })}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setView("watch", { titleId: item.titleId });
          }
        }}
        className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-zinc-800/70 to-zinc-950 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <img
          src={item.title.backdrop || item.title.poster}
          alt={`${item.title.title} backdrop`}
          loading="lazy"
          className="h-full w-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        {/* center play */}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-12 items-center justify-center rounded-full border border-white/40 bg-black/50 text-white opacity-90 backdrop-blur transition group-hover:scale-110 group-hover:border-rose-500 group-hover:bg-rose-500">
            <Play aria-hidden className="size-5 translate-x-0.5 fill-current" />
          </span>
        </span>
        <p className="absolute inset-x-3 bottom-2.5 line-clamp-1 text-sm font-semibold text-white">
          {item.title.title}
        </p>
      </motion.div>
      <div className="mt-2 px-0.5">
        <Progress value={pct} className="h-1.5" aria-label={`${Math.round(pct)}% watched`} />
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-400">
          <span className="tabular-nums">
            {formatClock(item.progressSeconds)} /{" "}
            {formatClock(item.durationSeconds)}
          </span>
          <button
            type="button"
            onClick={() => openDetail(item.titleId)}
            className="rounded px-1.5 py-0.5 text-zinc-400 transition hover:text-white"
          >
            Details
          </button>
        </div>
      </div>
    </motion.div>
  );
}
