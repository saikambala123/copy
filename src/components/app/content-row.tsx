"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import type { Title, WatchProgressItem } from "@/lib/types";
import { TitleCard, ContinueCard } from "@/components/app/title-card";

function ScrollButton({
  direction,
  onClick,
  side,
}: {
  direction: "left" | "right";
  onClick: () => void;
  side: "left" | "right";
}) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "left" ? "Scroll row left" : "Scroll row right"}
      className={`absolute top-[38%] z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white opacity-0 backdrop-blur-md transition-all duration-300 hover:border-rose-500/50 hover:bg-rose-500/20 focus-visible:opacity-100 md:flex group-hover/row:opacity-100 ${
        side === "left" ? "left-3" : "right-3"
      }`}
    >
      <Icon aria-hidden className="size-5" />
    </button>
  );
}

export interface ContentRowProps {
  title: string;
  items: Title[];
  variant?: "poster" | "top10";
  icon?: LucideIcon;
  onExploreAll?: () => void;
}

export function ContentRow({
  title,
  items,
  variant = "poster",
  icon: Icon,
  onExploreAll,
}: ContentRowProps) {
  const ref = useRef<HTMLDivElement>(null);
  if (!items?.length) return null;

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({
      left: dir * Math.max(el.clientWidth * 0.82, 400),
      behavior: "smooth",
    });
  };

  return (
    <section className="group/row relative" aria-label={title}>
      <div className="mb-3 flex items-center justify-between px-4 md:px-8">
        <h2 className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-foreground md:text-xl">
          {Icon && (
            <Icon aria-hidden className="size-5 text-rose-500" />
          )}
          {title}
        </h2>
        {onExploreAll && (
          <motion.button
            type="button"
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.96 }}
            onClick={onExploreAll}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            Explore all
            <ChevronRight aria-hidden className="size-3.5" />
          </motion.button>
        )}
      </div>

      <div className="relative">
        <ScrollButton direction="left" side="left" onClick={() => scroll(-1)} />
        <ScrollButton direction="right" side="right" onClick={() => scroll(1)} />
        <div
          ref={ref}
          role="list"
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 md:gap-4 md:px-8"
        >
          {items.map((t, i) => (
            <TitleCard
              key={t._id}
              title={t}
              index={i}
              rank={variant === "top10" ? i + 1 : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ContinueWatchingRow({
  items,
}: {
  items: WatchProgressItem[];
}) {
  if (!items?.length) return null;
  return (
    <section className="group/row relative" aria-label="Continue watching">
      <div className="mb-3 flex items-center justify-between px-4 md:px-8">
        <h2 className="text-lg font-bold tracking-tight text-foreground md:text-xl">
          Continue Watching
        </h2>
      </div>
      <div className="relative">
        <div
          role="list"
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 md:gap-4 md:px-8"
        >
          {items.map((item, i) => (
            <ContinueCard key={item.titleId} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
