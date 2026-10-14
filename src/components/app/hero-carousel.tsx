"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Info, Play, Plus } from "lucide-react";
import type { Title } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { EASE, MetaPills, useWatchlist } from "@/components/app/bits";
import { cn } from "@/lib/utils";

const ROTATE_MS = 6000;

export function HeroCarousel({ titles }: { titles: Title[] }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const setView = useAppStore((s) => s.setView);
  const openDetail = useAppStore((s) => s.openDetail);
  const { isIn, toggle } = useWatchlist();

  useEffect(() => {
    if (paused || titles.length < 2) return;
    const t = setInterval(
      () => setIdx((i) => (i + 1) % titles.length),
      ROTATE_MS
    );
    return () => clearInterval(t);
  }, [paused, titles.length]);

  if (!titles.length) return null;
  const current = titles[Math.min(idx, titles.length - 1)];
  const inList = isIn(current._id);

  return (
    <section
      aria-label="Featured titles"
      className="relative h-[78vh] min-h-[540px] w-full overflow-hidden md:h-[86vh]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* crossfading backdrops */}
      <AnimatePresence>
        <motion.div
          key={current._id}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: EASE }}
        >
          <img
            src={current.backdrop || current.poster}
            alt={`${current.title} backdrop`}
            className="h-full w-full object-cover"
            draggable={false}
          />
          {/* animated gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-background/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/40 to-transparent" />
          <motion.div
            aria-hidden
            className="absolute -bottom-40 -left-40 size-[36rem] rounded-full bg-rose-600/20 blur-[140px]"
            animate={{ opacity: [0.5, 0.85, 0.5] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </AnimatePresence>

      {/* text block */}
      <div className="relative z-10 flex h-full max-w-3xl flex-col justify-end px-4 pb-20 md:px-12 md:pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={current._id}
            initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-rose-400 backdrop-blur">
              {current.type === "series" ? "Series" : "Featured Film"}
            </span>
            <h1 className="max-w-2xl text-4xl font-black leading-[1.05] tracking-tight text-white drop-shadow-2xl sm:text-5xl md:text-6xl lg:text-7xl">
              {current.title}
            </h1>
            <div className="mt-4">
              <MetaPills title={current} />
            </div>
            <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-relaxed text-zinc-300 md:text-base">
              {current.description}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {/* pulsing play CTA */}
              <motion.button
                type="button"
                onClick={() => setView("watch", { titleId: current._id })}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                aria-label={`Play ${current.title}`}
                className="relative flex h-12 items-center gap-2.5 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-7 text-base font-bold text-white shadow-[0_0_40px_-10px_rgba(244,63,94,0.6)] transition-colors hover:from-rose-400 hover:to-rose-500"
              >
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full border border-rose-400/60"
                  animate={{ scale: [1, 1.25], opacity: [0.7, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                />
                <Play aria-hidden className="size-5 fill-current" />
                Play
              </motion.button>

              <motion.button
                type="button"
                onClick={() => openDetail(current._id)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="glass flex h-12 items-center gap-2.5 rounded-full px-7 text-base font-semibold text-white transition-colors hover:bg-white/15"
              >
                <Info aria-hidden className="size-5" />
                More Info
              </motion.button>

              <motion.button
                type="button"
                onClick={() => toggle(current)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                aria-label={
                  inList
                    ? `Remove ${current.title} from My List`
                    : `Add ${current.title} to My List`
                }
                className="glass flex size-12 items-center justify-center rounded-full text-white transition-colors hover:border-rose-500/60 hover:text-rose-400"
              >
                {inList ? (
                  <Check aria-hidden className="size-5" />
                ) : (
                  <Plus aria-hidden className="size-5" />
                )}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* progress dots */}
      <div className="absolute bottom-6 right-4 z-10 flex items-center gap-2 md:right-12">
        {titles.map((t, i) => (
          <button
            key={t._id}
            type="button"
            onClick={() => setIdx(i)}
            aria-label={`Show featured ${i + 1}: ${t.title}`}
            aria-current={i === idx}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === idx
                ? "w-9 bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]"
                : "w-4 bg-white/25 hover:bg-white/60"
            )}
          />
        ))}
      </div>
    </section>
  );
}
