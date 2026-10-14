"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Lock,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  RotateCw,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { Title, WatchProgressItem } from "@/lib/types";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { EASE, ErrorState, formatClock } from "@/components/app/bits";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function WatchView() {
  const viewParams = useAppStore((s) => s.viewParams);
  const titleId = viewParams.titleId;

  if (!titleId) {
    return <MissingTitle />;
  }

  return <WatchLoader titleId={titleId} />;
}

function MissingTitle() {
  const setView = useAppStore((s) => s.setView);
  useEffect(() => {
    const t = setTimeout(() => setView("browse"), 1200);
    return () => clearTimeout(t);
  }, [setView]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <p className="text-sm text-muted-foreground">
        No title selected — returning to browse…
      </p>
    </div>
  );
}

function WatchLoader({ titleId }: { titleId: string }) {
  const user = useAppStore((s) => s.user);
  const openAuth = useAppStore((s) => s.openAuth);
  const promptedRef = useRef(false);

  useEffect(() => {
    if (!user && !promptedRef.current) {
      promptedRef.current = true;
      openAuth("login");
    }
  }, [user, openAuth]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["title", titleId],
    queryFn: () =>
      api<{ title: Title; similar: Title[] }>(`/api/titles/${titleId}`),
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black">
        <Loader2 aria-hidden className="size-10 animate-spin text-rose-500" />
        <p className="text-sm font-medium text-zinc-400">
          Preparing your stream…
        </p>
      </div>
    );
  }

  if (error || !data?.title) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-6">
        <div className="w-full max-w-md">
          <ErrorState
            message={
              error instanceof Error
                ? error.message
                : "This title could not be loaded."
            }
            onRetry={refetch}
          />
        </div>
      </div>
    );
  }

  if (!user) return <WatchGate />;

  return <Player title={data.title} titleId={titleId} />;
}

/* ------------------------------------------------------------------ */
/* sign-in gate                                                        */
/* ------------------------------------------------------------------ */

function WatchGate() {
  const openAuth = useAppStore((s) => s.openAuth);
  const setView = useAppStore((s) => s.setView);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="glass w-full max-w-md rounded-2xl p-8 text-center"
      >
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-[0_0_40px_-10px_rgba(244,63,94,0.7)]">
          <Lock aria-hidden className="size-7" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
          Sign in to watch
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          NOVA members stream instantly on any device. New here? Create an
          account in seconds.
        </p>
        <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-400">
          Demo account:{" "}
          <span className="font-semibold text-zinc-200">demo@nova.stream</span>{" "}
          / <span className="font-semibold text-zinc-200">Demo@123</span>
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Button
            onClick={() => openAuth("login")}
            className="h-12 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 text-base font-bold shadow-[0_0_40px_-10px_rgba(244,63,94,0.6)] hover:from-rose-400 hover:to-rose-500"
          >
            Sign In
          </Button>
          <Button
            variant="ghost"
            onClick={() => setView("browse")}
            className="h-12 rounded-full text-zinc-300 hover:bg-white/10 hover:text-white"
          >
            Back to browsing
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* the player                                                          */
/* ------------------------------------------------------------------ */

function Player({ title, titleId }: { title: Title; titleId: string }) {
  const setView = useAppStore((s) => s.setView);
  const previousView = useAppStore((s) => s.previousView);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedSeconds = useRef(0);
  const appliedResume = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [seekHover, setSeekHover] = useState<{ x: number; time: number } | null>(null);
  const [episodeIdx, setEpisodeIdx] = useState(0);
  const [started, setStarted] = useState(false);

  /* series episode list (flattened) */
  const episodes = useMemo(() => {
    if (title.type !== "series") return [];
    return title.seasons.flatMap((s) =>
      s.episodes.map((e) => ({ ...e, season: s.season }))
    );
  }, [title]);
  const currentEp = episodes[episodeIdx];
  const nextEp = episodes[episodeIdx + 1];
  const nearEnd = duration > 0 && currentTime / duration >= 0.9;

  /* resume position */
  const { data: progressData } = useQuery({
    queryKey: ["progress"],
    queryFn: () => api<{ items: WatchProgressItem[] }>("/api/progress"),
    retry: 0,
  });
  const resumeItem = progressData?.items.find((i) => i.titleId === titleId);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || appliedResume.current || !resumeItem || started) return;
    appliedResume.current = true;
    if (resumeItem.progressSeconds > 5) {
      /* seeking fires a timeupdate that syncs React state */
      v.currentTime = resumeItem.progressSeconds;
    }
  }, [progressData, resumeItem, started]);

  /* progress persistence */
  const saveProgress = useCallback(
    (force = false) => {
      const v = videoRef.current;
      if (!v || !v.duration || Number.isNaN(v.duration)) return;
      const secs = Math.floor(v.currentTime);
      if (!force && Math.abs(secs - savedSeconds.current) < 5) return;
      savedSeconds.current = secs;
      api("/api/progress", {
        json: {
          titleId,
          progressSeconds: secs,
          durationSeconds: Math.floor(v.duration),
        },
      }).catch(() => {
        /* silent — progress saving is best-effort */
      });
    },
    [titleId]
  );

  useEffect(() => {
    const interval = setInterval(() => saveProgress(), 10_000);
    const onLeave = () => saveProgress(true);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", onLeave);
      saveProgress(true);
    };
  }, [saveProgress]);

  /* controls auto-hide (2.5s idle while playing) */
  const poke = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      const v = videoRef.current;
      if (v && !v.paused) setControlsVisible(false);
    }, 2500);
  }, []);

  useEffect(() => {
    /* start the initial hide countdown (controls default to visible) */
    hideTimer.current = setTimeout(() => {
      const v = videoRef.current;
      if (v && !v.paused) setControlsVisible(false);
    }, 2500);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  /* fullscreen tracking */
  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  /* core actions */
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => toast.error("Playback blocked"));
    else v.pause();
    poke();
  }, [poke]);

  const seekBy = useCallback(
    (delta: number) => {
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
      poke();
    },
    [poke]
  );

  const seekTo = useCallback((t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, t));
    setCurrentTime(v.currentTime);
  }, []);

  const setVolume = useCallback((val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    v.muted = val === 0;
    setVolumeState(val);
    setMuted(val === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted && v.volume === 0) {
      v.volume = 0.5;
      setVolumeState(0.5);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen().catch(() => toast.error("Fullscreen unavailable"));
    poke();
  }, [poke]);

  const enterPiP = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await v.requestPictureInPicture();
    } catch {
      toast.error("Picture-in-Picture is not available here");
    }
  }, []);

  const goBack = useCallback(() => {
    saveProgress(true);
    const target =
      previousView === "watch" || previousView === "admin" ? "browse" : previousView;
    setView(target);
  }, [previousView, saveProgress, setView]);

  const playNextEpisode = useCallback(() => {
    if (!nextEp) return;
    saveProgress(true);
    setEpisodeIdx((i) => i + 1);
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
    toast.success(`Now playing S${nextEp.season}:E${nextEp.n}`, {
      description: nextEp.title,
    });
  }, [nextEp, saveProgress]);

  /* keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowleft":
          e.preventDefault();
          seekBy(-10);
          break;
        case "arrowright":
          e.preventDefault();
          seekBy(10);
          break;
        case "arrowup":
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case "arrowdown":
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case "f":
          toggleFullscreen();
          break;
        case "m":
          toggleMute();
          break;
        default:
          return;
      }
      poke();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, seekBy, toggleFullscreen, toggleMute, setVolume, volume, poke]);

  /* video event handlers */
  const onLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration || 0);
    v.playbackRate = speed;
    if (
      resumeItem &&
      resumeItem.progressSeconds > 5 &&
      resumeItem.progressSeconds < v.duration - 15
    ) {
      v.currentTime = resumeItem.progressSeconds;
      appliedResume.current = true;
    }
  };

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    if (v.buffered.length > 0) {
      setBuffered(v.buffered.end(v.buffered.length - 1));
    }
  };

  const onEnded = () => {
    setPlaying(false);
    setControlsVisible(true);
    saveProgress(true);
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-screen flex-col bg-black"
      onMouseMove={poke}
      onTouchStart={poke}
      onClick={poke}
      onDoubleClick={toggleFullscreen}
    >
      {/* video */}
      <video
        ref={videoRef}
        key={`${title._id}-${episodeIdx}`}
        src={title.video || title.trailer}
        autoPlay
        muted
        playsInline
        preload="metadata"
        aria-label={`Now playing: ${title.title}`}
        className="absolute inset-0 h-full w-full bg-black object-contain"
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onPlay={() => {
          setPlaying(true);
          setStarted(true);
          poke();
        }}
        onPause={() => {
          setPlaying(false);
          setControlsVisible(true);
          saveProgress();
        }}
        onEnded={onEnded}
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
      />

      {/* click-to-toggle surface (padding around video) */}
      <button
        type="button"
        aria-label={playing ? "Pause" : "Play"}
        onClick={togglePlay}
        className="absolute inset-0 cursor-default bg-transparent"
        tabIndex={-1}
      />

      {/* center pause indicator */}
      <AnimatePresence>
        {!playing && started && (
          <motion.button
            key="center-play"
            type="button"
            onClick={togglePlay}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            aria-label={playing ? "Pause" : "Play"}
            className="absolute left-1/2 top-1/2 z-20 flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/60 text-white backdrop-blur-md transition hover:border-rose-500 hover:bg-rose-500/70"
          >
            <Play aria-hidden className="size-9 translate-x-1 fill-current" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* unmute hint */}
      {muted && (
        <button
          type="button"
          onClick={() => {
            const v = videoRef.current;
            if (!v) return;
            v.muted = false;
            setMuted(false);
            if (v.volume === 0) setVolume(0.8);
          }}
          className="absolute left-4 top-20 z-20 flex h-11 items-center gap-2 rounded-full border border-amber-500/40 bg-black/70 px-4 text-sm font-semibold text-amber-300 backdrop-blur transition hover:bg-amber-500/20"
        >
          <VolumeX aria-hidden className="size-4" />
          Tap to unmute
        </button>
      )}

      {/* next episode card */}
      <AnimatePresence>
        {nextEp && nearEnd && (
          <motion.div
            key="next-ep"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            className="absolute bottom-28 right-4 z-20 w-72 rounded-2xl border border-white/10 bg-black/85 p-4 backdrop-blur-xl md:right-8"
          >
            <p className="text-[11px] font-bold uppercase tracking-widest text-rose-400">
              Next episode
            </p>
            <p className="mt-1.5 line-clamp-1 text-base font-bold text-white">
              S{nextEp.season}:E{nextEp.n} · {nextEp.title}
            </p>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-400">
              {nextEp.summary}
            </p>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                playNextEpisode();
              }}
              className="mt-3 h-11 w-full rounded-full bg-gradient-to-r from-rose-500 to-rose-600 font-bold hover:from-rose-400 hover:to-rose-500"
            >
              <SkipForward aria-hidden className="size-4 fill-current" />
              Play next
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* top bar */}
      <AnimatePresence>
        {controlsVisible && (
          <motion.div
            key="top-bar"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-x-0 top-0 z-20 flex items-center gap-3 bg-gradient-to-b from-black/80 to-transparent p-4 md:p-6"
          >
            <button
              type="button"
              onClick={goBack}
              aria-label="Back"
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur transition hover:border-rose-500/60 hover:text-rose-400"
            >
              <ArrowLeft aria-hidden className="size-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-tight text-white md:text-xl">
                {title.title}
              </h1>
              {currentEp && (
                <p className="truncate text-xs text-zinc-400">
                  S{currentEp.season}:E{currentEp.n} · {currentEp.title}
                </p>
              )}
            </div>
            <span className="ml-auto hidden shrink-0 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs font-semibold text-zinc-300 backdrop-blur sm:block">
              {title.quality}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* bottom controls */}
      <AnimatePresence>
        {controlsVisible && (
          <motion.div
            key="controls"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pb-4 pt-14 md:px-8 md:pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* seek bar */}
            <div
              role="slider"
              tabIndex={0}
              aria-label="Seek"
              aria-valuemin={0}
              aria-valuemax={Math.round(duration)}
              aria-valuenow={Math.round(currentTime)}
              className="group/seek relative flex h-7 cursor-pointer touch-none items-center"
              onPointerDown={(e) => {
                (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = Math.min(
                  1,
                  Math.max(0, (e.clientX - rect.left) / rect.width)
                );
                seekTo(ratio * duration);
              }}
              onPointerMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = Math.min(
                  1,
                  Math.max(0, (e.clientX - rect.left) / rect.width)
                );
                setSeekHover({ x: e.clientX - rect.left, time: ratio * duration });
              }}
              onPointerLeave={() => setSeekHover(null)}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") seekBy(-10);
                if (e.key === "ArrowRight") seekBy(10);
              }}
            >
              <div className="relative h-1.5 w-full rounded-full bg-white/20 transition-all group-hover/seek:h-2.5">
                {/* buffered */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white/30"
                  style={{ width: `${bufferedPct}%` }}
                />
                {/* progress */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-rose-600 to-rose-400"
                  style={{ width: `${progressPct}%` }}
                />
                {/* thumb */}
                <div
                  className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.9)] transition-transform group-hover/seek:scale-125"
                  style={{ left: `${progressPct}%` }}
                />
              </div>
              {/* hover time preview */}
              {seekHover && duration > 0 && (
                <div
                  className="pointer-events-none absolute -top-8 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-black/90 px-2 py-1 text-[11px] font-semibold tabular-nums text-white"
                  style={{ left: seekHover.x }}
                >
                  {formatClock(seekHover.time)}
                </div>
              )}
            </div>

            {/* buttons row */}
            <div className="mt-1 flex items-center gap-1.5 md:gap-2.5">
              <ControlButton
                onClick={togglePlay}
                ariaLabel={playing ? "Pause" : "Play"}
              >
                {playing ? (
                  <Pause aria-hidden className="size-6 fill-current" />
                ) : (
                  <Play aria-hidden className="size-6 fill-current" />
                )}
              </ControlButton>

              <ControlButton onClick={() => seekBy(-10)} ariaLabel="Rewind 10 seconds">
                <span className="relative">
                  <RotateCcw aria-hidden className="size-5" />
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black">
                    10
                  </span>
                </span>
              </ControlButton>

              <ControlButton onClick={() => seekBy(10)} ariaLabel="Forward 10 seconds">
                <span className="relative">
                  <RotateCw aria-hidden className="size-5" />
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black">
                    10
                  </span>
                </span>
              </ControlButton>

              {/* volume */}
              <ControlButton onClick={toggleMute} ariaLabel={muted ? "Unmute" : "Mute"}>
                <VolumeIcon aria-hidden className="size-5" />
              </ControlButton>
              <div className="hidden w-24 items-center sm:flex">
                <Slider
                  value={[muted ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.05}
                  onValueChange={([v]) => setVolume(v)}
                  aria-label="Volume"
                  className="cursor-pointer **:data-[slot=slider-thumb]:size-3.5 **:data-[slot=slider-thumb]:border-rose-400 **:data-[slot=slider-thumb]:bg-rose-500 **:data-[slot=slider-range]:bg-rose-500"
                />
              </div>

              {/* time */}
              <p className="ml-1.5 select-none text-xs font-semibold tabular-nums text-zinc-200 md:text-sm">
                {formatClock(currentTime)}{" "}
                <span className="text-zinc-500">/ {formatClock(duration)}</span>
              </p>

              <div className="ml-auto flex items-center gap-1.5 md:gap-2.5">
                {/* speed */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Playback speed"
                      className="flex h-11 min-w-11 items-center justify-center rounded-lg px-2 text-sm font-bold text-white transition hover:bg-white/10"
                    >
                      {speed}×
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="border-white/10 bg-popover/95 backdrop-blur-xl"
                  >
                    <DropdownMenuLabel className="text-xs uppercase tracking-wider text-zinc-400">
                      Playback speed
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    {SPEEDS.map((s) => (
                      <DropdownMenuItem
                        key={s}
                        onClick={() => {
                          setSpeed(s);
                          const v = videoRef.current;
                          if (v) v.playbackRate = s;
                          toast.success(`Speed: ${s}×`);
                        }}
                        className={cn(
                          "cursor-pointer justify-between rounded-lg",
                          speed === s && "text-rose-400 focus:bg-rose-500/10"
                        )}
                      >
                        {s}×
                        {speed === s && (
                          <span className="size-1.5 rounded-full bg-rose-500" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* PiP */}
                <ControlButton onClick={enterPiP} ariaLabel="Picture in picture">
                  <PictureInPicture2 aria-hidden className="size-5" />
                </ControlButton>

                {/* fullscreen */}
                <ControlButton
                  onClick={toggleFullscreen}
                  ariaLabel={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {fullscreen ? (
                    <Minimize aria-hidden className="size-5" />
                  ) : (
                    <Maximize aria-hidden className="size-5" />
                  )}
                </ControlButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ControlButton({
  children,
  onClick,
  ariaLabel,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-lg text-white transition hover:bg-white/10 active:scale-90",
        className
      )}
    >
      {children}
    </button>
  );
}
