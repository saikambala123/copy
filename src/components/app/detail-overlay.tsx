"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Check,
  Info,
  Play,
  Plus,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { Title } from "@/lib/types";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import {
  EASE,
  ErrorState,
  formatDuration,
  formatSeasons,
  formatViews,
  GradientAvatar,
  MaturityBadge,
  MetaPills,
  StarRating,
  useWatchlist,
} from "@/components/app/bits";
import { ContentRow } from "@/components/app/content-row";
import { DetailSkeleton } from "@/components/app/skeletons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type TitleQuery = UseQueryResult<{ title: Title; similar: Title[] }, Error>;

export function DetailOverlay() {
  const detailId = useAppStore((s) => s.detailId);
  const closeDetail = useAppStore((s) => s.closeDetail);

  const query = useQuery({
    queryKey: ["title", detailId],
    queryFn: () =>
      api<{ title: Title; similar: Title[] }>(`/api/titles/${detailId}`),
    enabled: !!detailId,
    retry: 1,
  });

  return (
    <Dialog
      open={!!detailId}
      onOpenChange={(o) => {
        if (!o) closeDetail();
      }}
    >
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="max-w-5xl gap-0 overflow-hidden rounded-2xl border-white/10 bg-card p-0"
      >
        <DialogTitle className="sr-only">Title details</DialogTitle>
        {detailId && (
          <DetailBody
            key={detailId}
            titleId={detailId}
            query={query}
            closeDetail={closeDetail}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** keyed by titleId so local state resets per title */
function DetailBody({
  titleId,
  query,
  closeDetail,
}: {
  titleId: string;
  query: TitleQuery;
  closeDetail: () => void;
}) {
  const { data, isLoading, error, refetch } = query;
  const setView = useAppStore((s) => s.setView);
  const user = useAppStore((s) => s.user);
  const openAuth = useAppStore((s) => s.openAuth);
  const qc = useQueryClient();
  const { isIn, toggle } = useWatchlist();

  const [trailerPlaying, setTrailerPlaying] = useState(false);
  const [trailerMuted, setTrailerMuted] = useState(true);
  const [myRating, setMyRating] = useState(0);

  const ratingMutation = useMutation({
    mutationFn: (value: number) =>
      api<{ ok: boolean; average: number; count: number }>("/api/ratings", {
        json: { titleId, value },
      }),
    onSuccess: (res) => {
      toast.success(`Rated ${myRating}/5`, {
        description: `Community average is now ${res.average?.toFixed(1)} from ${res.count} rating${res.count === 1 ? "" : "s"}.`,
      });
      qc.invalidateQueries({ queryKey: ["title", titleId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const title = data?.title;
  const inList = title ? isIn(title._id) : false;

  return (
    <motion.div
      initial={{ scale: 0.94, opacity: 0, y: 28 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 26, stiffness: 300 }}
      className="relative max-h-[92vh] overflow-y-auto overscroll-contain"
    >
          {/* close */}
          <button
            type="button"
            onClick={closeDetail}
            aria-label="Close details"
            className="absolute right-4 top-4 z-20 flex size-10 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur transition hover:border-rose-500/60 hover:text-rose-400"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          {isLoading && <DetailSkeleton />}

          {!isLoading && (error || !title) && (
            <div className="p-6">
              <ErrorState
                message={
                  error instanceof Error
                    ? error.message
                    : "This title could not be found."
                }
                onRetry={refetch}
              />
            </div>
          )}

          {!isLoading && title && (
            <>
              {/* backdrop / trailer */}
              <div className="relative aspect-video w-full overflow-hidden bg-black">
                {trailerPlaying ? (
                  <video
                    key={`trailer-${title._id}`}
                    src={title.trailer || title.video}
                    autoPlay
                    loop
                    playsInline
                    muted={trailerMuted}
                    className="h-full w-full object-cover"
                    aria-label={`${title.title} trailer`}
                  />
                ) : (
                  <>
                    <img
                      src={title.backdrop || title.poster}
                      alt={`${title.title} backdrop`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-black/30 to-transparent" />
                    <motion.button
                      type="button"
                      onClick={() => setTrailerPlaying(true)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.92 }}
                      aria-label={`Play ${title.title} trailer`}
                      className="absolute inset-0 m-auto flex size-20 items-center justify-center rounded-full border border-white/30 bg-black/50 text-white backdrop-blur-md transition-colors hover:border-rose-500 hover:bg-rose-500/80"
                    >
                      <span className="absolute inset-0 rounded-full border border-white/20" />
                      <Play aria-hidden className="size-8 translate-x-1 fill-current" />
                    </motion.button>
                    <span className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-zinc-300 backdrop-blur">
                      Trailer
                    </span>
                  </>
                )}
                {trailerPlaying && (
                  <button
                    type="button"
                    onClick={() => setTrailerMuted((m) => !m)}
                    aria-label={trailerMuted ? "Unmute trailer" : "Mute trailer"}
                    className="absolute bottom-4 left-4 flex size-11 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur transition hover:border-rose-500/60"
                  >
                    {trailerMuted ? (
                      <VolumeX aria-hidden className="size-5" />
                    ) : (
                      <Volume2 aria-hidden className="size-5" />
                    )}
                  </button>
                )}
              </div>

              <div className="space-y-7 p-4 sm:p-6 md:p-8">
                {/* header */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-foreground md:text-4xl">
                        {title.title}
                      </h2>
                      <div className="mt-3">
                        <MetaPills title={title} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Button
                        onClick={() => {
                          closeDetail();
                          setView("watch", { titleId: title._id });
                        }}
                        className="h-12 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-6 font-bold shadow-[0_0_36px_-10px_rgba(244,63,94,0.6)] hover:from-rose-400 hover:to-rose-500"
                      >
                        <Play aria-hidden className="size-5 fill-current" />
                        {title.type === "series" ? "Play S1:E1" : "Watch Now"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => toggle(title)}
                        aria-label={inList ? "Remove from My List" : "Add to My List"}
                        className="h-12 w-12 rounded-full border-white/15 bg-white/5 p-0 hover:border-rose-500/60 hover:text-rose-400"
                      >
                        {inList ? (
                          <Check aria-hidden className="size-5" />
                        ) : (
                          <Plus aria-hidden className="size-5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-400">
                    <span className="tabular-nums">
                      {formatViews(title.views)} views
                    </span>
                    <span>Language: {title.language}</span>
                    <span>
                      Director:{" "}
                      <span className="font-medium text-zinc-200">
                        {title.director || "—"}
                      </span>
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      {title.genres.map((g) => (
                        <span
                          key={g}
                          className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-zinc-300"
                        >
                          {g}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>

                {/* description */}
                <p className="max-w-3xl text-sm leading-relaxed text-zinc-300 md:text-base">
                  {title.description}
                </p>

                {/* rating */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {myRating ? "Your rating" : "Rate this title"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Help others discover great stories.
                    </p>
                  </div>
                  <StarRating
                    value={myRating}
                    onChange={(v) => {
                      if (!user) {
                        openAuth("login");
                        toast.info("Sign in to rate titles");
                        return;
                      }
                      setMyRating(v);
                      ratingMutation.mutate(v);
                    }}
                  />
                </div>

                {/* cast */}
                {title.cast?.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-400">
                      <Users aria-hidden className="size-4" />
                      Cast
                    </h3>
                    <div className="flex flex-wrap gap-2.5">
                      {title.cast.map((person) => (
                        <div
                          key={person}
                          className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-4"
                        >
                          <GradientAvatar
                            name={person}
                            gradient={
                              ["rose", "amber", "emerald", "violet", "cyan", "orange", "pink"][
                                person.length % 7
                              ]
                            }
                            className="size-8 text-xs"
                          />
                          <span className="text-sm font-medium text-zinc-200">
                            {person}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* seasons */}
                {title.type === "series" && title.seasons?.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-400">
                      Episodes
                    </h3>
                    <Accordion
                      type="single"
                      collapsible
                      defaultValue="s-1"
                      className="rounded-2xl border border-white/10 bg-white/[0.02] px-4"
                    >
                      {title.seasons.map((season) => (
                        <AccordionItem
                          key={season.season}
                          value={`s-${season.season}`}
                          className="border-white/10"
                        >
                          <AccordionTrigger className="py-4 text-left text-sm font-bold text-foreground hover:no-underline">
                            Season {season.season}
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              {season.episodes.length} episodes
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4">
                            <ul className="space-y-2">
                              {season.episodes.map((ep) => (
                                <li
                                  key={ep.n}
                                  className="group flex cursor-pointer items-center gap-4 rounded-xl border border-white/5 bg-white/[0.03] p-3 transition hover:border-rose-500/30 hover:bg-rose-500/5"
                                  onClick={() => {
                                    closeDetail();
                                    setView("watch", { titleId: title._id });
                                  }}
                                >
                                  <span className="w-6 shrink-0 text-center text-sm font-bold text-zinc-500 tabular-nums">
                                    {ep.n}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-foreground">
                                      {ep.title}
                                    </p>
                                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                      {ep.summary}
                                    </p>
                                  </div>
                                  <span className="shrink-0 text-xs text-zinc-500 tabular-nums">
                                    {ep.durationMinutes}m
                                  </span>
                                  <Play
                                    aria-hidden
                                    className="size-4 shrink-0 text-zinc-600 transition group-hover:text-rose-500"
                                  />
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}

                {/* similar */}
                {(data?.similar?.length ?? 0) > 0 && (
                  <div className="-mx-4 sm:-mx-6 md:-mx-8">
                    <ContentRow
                      title="More Like This"
                      items={data?.similar ?? []}
                      icon={Info}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
  );
}
