"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import type { Title, TitleType } from "@/lib/types";
import { api } from "@/lib/api";
import { EASE, ErrorState, formatViews } from "@/components/app/bits";
import { TableSkeleton } from "@/components/app/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const MATURITY = ["G", "PG", "PG-13", "R", "TV-14", "TV-MA"];

interface FormState {
  title: string;
  slug: string;
  type: TitleType;
  year: string;
  maturity: string;
  rating: string;
  durationMinutes: string;
  genres: string;
  description: string;
  cast: string;
  director: string;
  language: string;
  poster: string;
  backdrop: string;
  trailer: string;
  video: string;
  featured: boolean;
  trending: boolean;
  isNew: boolean;
  quality: "HD" | "4K";
}

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  type: "movie",
  year: String(new Date().getFullYear()),
  maturity: "PG-13",
  rating: "7.5",
  durationMinutes: "110",
  genres: "",
  description: "",
  cast: "",
  director: "",
  language: "English",
  poster: "",
  backdrop: "",
  trailer: "",
  video: "",
  featured: false,
  trending: false,
  isNew: false,
  quality: "HD",
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

export function AdminTitles() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TitleType>("all");
  const [editing, setEditing] = useState<Title | "new" | null>(null);
  const [deleting, setDeleting] = useState<Title | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "titles", q, typeFilter],
    queryFn: () =>
      api<{ titles: Title[] }>(
        `/api/admin/titles?q=${encodeURIComponent(q)}` +
          (typeFilter !== "all" ? `&type=${typeFilter}` : "")
      ),
    retry: 1,
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["admin", "titles"] });
    qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    qc.invalidateQueries({ queryKey: ["home"] });
    qc.invalidateQueries({ queryKey: ["titles"] });
    qc.invalidateQueries({ queryKey: ["title"] });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api<{ ok: boolean }>(`/api/admin/titles/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidateAll();
      toast.success("Title deleted");
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const titles = data?.titles ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
            Content manager
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${titles.length} titles in catalog`}
          </p>
        </div>
        <Button
          onClick={() => setEditing("new")}
          className="h-11 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-5 font-bold shadow-[0_0_30px_-10px_rgba(244,63,94,0.6)] hover:from-rose-400 hover:to-rose-500"
        >
          <Plus aria-hidden className="size-4" />
          Add Title
        </Button>
      </div>

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="glass flex h-11 min-w-56 flex-1 items-center gap-2.5 rounded-full px-4">
          <Search aria-hidden className="size-4 shrink-0 text-zinc-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title or slug…"
            aria-label="Search titles"
            className="h-full w-full bg-transparent text-sm text-foreground placeholder:text-zinc-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "movie", "series"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              aria-pressed={typeFilter === t}
              className={cn(
                "h-11 rounded-full border px-4 text-sm font-medium capitalize transition",
                typeFilter === t
                  ? "border-transparent bg-gradient-to-r from-rose-500 to-rose-600 text-white"
                  : "border-white/10 bg-white/5 text-zinc-300 hover:text-white"
              )}
            >
              {t === "all" ? "All types" : `${t}s`}
            </button>
          ))}
        </div>
      </div>

      {/* table */}
      {isLoading ? (
        <TableSkeleton rows={7} cols={7} />
      ) : error ? (
        <ErrorState
          message={error instanceof Error ? error.message : "Titles unavailable."}
          onRetry={refetch}
        />
      ) : titles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
          <p className="text-sm font-semibold text-foreground">
            No titles match your filters
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first title or clear the search.
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="overflow-x-auto rounded-2xl border border-white/10 bg-card"
        >
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-zinc-500">
                <th scope="col" className="p-4 font-semibold">Title</th>
                <th scope="col" className="p-4 font-semibold">Type</th>
                <th scope="col" className="p-4 font-semibold">Year</th>
                <th scope="col" className="p-4 font-semibold">Genres</th>
                <th scope="col" className="p-4 font-semibold">Rating</th>
                <th scope="col" className="p-4 font-semibold">Views</th>
                <th scope="col" className="p-4 font-semibold">Status</th>
                <th scope="col" className="p-4 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {titles.map((t) => (
                <tr
                  key={t._id}
                  className="border-b border-white/5 transition last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-zinc-800">
                        {t.poster && (
                          <img
                            src={t.poster}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">
                          {t.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {t.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize",
                        t.type === "movie"
                          ? "border-amber-500/40 text-amber-400"
                          : "border-rose-500/40 text-rose-400"
                      )}
                    >
                      {t.type}
                    </Badge>
                  </td>
                  <td className="p-4 tabular-nums text-zinc-300">{t.year}</td>
                  <td className="max-w-40 p-4">
                    <span className="block truncate text-xs text-zinc-400">
                      {t.genres?.join(", ")}
                    </span>
                  </td>
                  <td className="p-4 font-semibold tabular-nums text-amber-400">
                    {t.rating?.toFixed(1)}
                  </td>
                  <td className="p-4 tabular-nums text-zinc-300">
                    {formatViews(t.views)}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {t.isNew && (
                        <Badge className="bg-rose-600 text-[10px]">NEW</Badge>
                      )}
                      {t.trending && (
                        <Badge variant="outline" className="border-amber-500/40 text-[10px] text-amber-400">
                          TRENDING
                        </Badge>
                      )}
                      {t.featured && (
                        <Badge variant="outline" className="border-white/20 text-[10px] text-zinc-300">
                          FEATURED
                        </Badge>
                      )}
                      {!t.isNew && !t.trending && !t.featured && (
                        <span className="text-xs text-zinc-500">—</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditing(t)}
                        aria-label={`Edit ${t.title}`}
                        className="flex size-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white"
                      >
                        <Pencil aria-hidden className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(t)}
                        aria-label={`Delete ${t.title}`}
                        className="flex size-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-rose-500/10 hover:text-rose-400"
                      >
                        <Trash2 aria-hidden className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* add / edit dialog */}
      {editing && (
        <TitleFormDialog
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={invalidateAll}
        />
      )}

      {/* delete confirm */}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => {
          if (!o) setDeleting(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl border-white/10 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the title, its ratings and progress
              records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && deleteMutation.mutate(deleting._id)}
              disabled={deleteMutation.isPending}
              className="rounded-full bg-rose-600 hover:bg-rose-500"
            >
              {deleteMutation.isPending ? (
                <Loader2 aria-hidden className="size-4 animate-spin" />
              ) : (
                "Delete title"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* add / edit form dialog                                              */
/* ------------------------------------------------------------------ */

const formFromTitle = (t: Title): FormState => ({
  title: t.title,
  slug: t.slug,
  type: t.type,
  year: String(t.year ?? ""),
  maturity: t.maturity || "PG-13",
  rating: String(t.rating ?? ""),
  durationMinutes: String(t.durationMinutes ?? ""),
  genres: (t.genres ?? []).join(", "),
  description: t.description ?? "",
  cast: (t.cast ?? []).join(", "),
  director: t.director ?? "",
  language: t.language ?? "English",
  poster: t.poster ?? "",
  backdrop: t.backdrop ?? "",
  trailer: t.trailer ?? "",
  video: t.video ?? "",
  featured: !!t.featured,
  trending: !!t.trending,
  isNew: !!t.isNew,
  quality: t.quality ?? "HD",
});

function TitleFormDialog({
  initial,
  onClose,
  onSaved,
}: {
  initial: Title | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  /* mounts fresh per editing target (parent renders it conditionally) */
  const [form, setForm] = useState<FormState>(
    initial ? formFromTitle(initial) : EMPTY_FORM
  );
  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [validationError, setValidationError] = useState("");

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title.trim(),
        slug: (slugTouched ? form.slug : slugify(form.title)).trim(),
        type: form.type,
        year: Number(form.year),
        maturity: form.maturity,
        rating: Number(form.rating),
        durationMinutes: Number(form.durationMinutes) || 0,
        genres: form.genres
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean),
        description: form.description.trim(),
        cast: form.cast
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        director: form.director.trim(),
        language: form.language.trim() || "English",
        poster: form.poster.trim(),
        backdrop: form.backdrop.trim(),
        trailer: form.trailer.trim(),
        video: form.video.trim(),
        featured: form.featured,
        trending: form.trending,
        isNew: form.isNew,
        quality: form.quality,
      };
      if (initial) {
        return api<{ title: Title }>(`/api/admin/titles/${initial._id}`, {
          method: "PATCH",
          json: payload,
        });
      }
      return api<{ title: Title }>("/api/admin/titles", { json: payload });
    },
    onSuccess: (res) => {
      onSaved();
      toast.success(initial ? "Title updated" : "Title created", {
        description: res.title?.title,
      });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = () => {
    if (form.title.trim().length < 1) {
      setValidationError("Title is required.");
      return;
    }
    const year = Number(form.year);
    if (!year || year < 1900 || year > 2100) {
      setValidationError("Year must be between 1900 and 2100.");
      return;
    }
    const rating = Number(form.rating);
    if (Number.isNaN(rating) || rating < 0 || rating > 10) {
      setValidationError("Rating must be between 0 and 10.");
      return;
    }
    setValidationError("");
    saveMutation.mutate();
  };

  const genres = useMemo(
    () =>
      form.genres
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean),
    [form.genres]
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="max-w-3xl gap-0 overflow-hidden rounded-2xl border-white/10 bg-card p-0"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
        >
          <div className="flex items-center justify-between border-b border-white/10 p-5 md:p-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                {initial ? `Edit — ${initial.title}` : "Add a new title"}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Fields marked optional can be left blank.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="flex size-9 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="max-h-[62vh] overflow-y-auto p-5 md:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" htmlFor="f-title" className="sm:col-span-2">
                <Input
                  id="f-title"
                  value={form.title}
                  onChange={(e) => {
                    set("title", e.target.value);
                    if (!slugTouched) set("slug", slugify(e.target.value));
                  }}
                  placeholder="e.g. Midnight Horizon"
                  className="h-11 rounded-xl border-white/10 bg-white/5"
                />
              </Field>

              <Field label="Slug (auto)" htmlFor="f-slug">
                <Input
                  id="f-slug"
                  value={slugTouched ? form.slug : slugify(form.title)}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", e.target.value);
                  }}
                  placeholder="midnight-horizon"
                  className="h-11 rounded-xl border-white/10 bg-white/5 font-mono text-sm"
                />
              </Field>

              <Field label="Type" htmlFor="f-type">
                <Select
                  value={form.type}
                  onValueChange={(v) => set("type", v as TitleType)}
                >
                  <SelectTrigger id="f-type" className="h-11 w-full rounded-xl border-white/10 bg-white/5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-popover">
                    <SelectItem value="movie">Movie</SelectItem>
                    <SelectItem value="series">Series</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Year" htmlFor="f-year">
                <Input
                  id="f-year"
                  type="number"
                  value={form.year}
                  onChange={(e) => set("year", e.target.value)}
                  className="h-11 rounded-xl border-white/10 bg-white/5 tabular-nums"
                />
              </Field>

              <Field label="Maturity" htmlFor="f-maturity">
                <Select
                  value={form.maturity}
                  onValueChange={(v) => set("maturity", v)}
                >
                  <SelectTrigger id="f-maturity" className="h-11 w-full rounded-xl border-white/10 bg-white/5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-popover">
                    {MATURITY.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Rating (0–10)" htmlFor="f-rating">
                <Input
                  id="f-rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={form.rating}
                  onChange={(e) => set("rating", e.target.value)}
                  className="h-11 rounded-xl border-white/10 bg-white/5 tabular-nums"
                />
              </Field>

              <Field label="Duration (minutes)" htmlFor="f-duration">
                <Input
                  id="f-duration"
                  type="number"
                  value={form.durationMinutes}
                  onChange={(e) => set("durationMinutes", e.target.value)}
                  className="h-11 rounded-xl border-white/10 bg-white/5 tabular-nums"
                />
              </Field>

              <Field
                label="Genres (comma separated)"
                htmlFor="f-genres"
                className="sm:col-span-2"
                hint={genres.length ? `${genres.length} genre${genres.length === 1 ? "" : "s"}` : undefined}
              >
                <Input
                  id="f-genres"
                  value={form.genres}
                  onChange={(e) => set("genres", e.target.value)}
                  placeholder="Sci-Fi, Thriller, Drama"
                  className="h-11 rounded-xl border-white/10 bg-white/5"
                />
              </Field>

              <Field label="Description" htmlFor="f-desc" className="sm:col-span-2">
                <Textarea
                  id="f-desc"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="A sweeping synopsis…"
                  rows={3}
                  className="rounded-xl border-white/10 bg-white/5"
                />
              </Field>

              <Field label="Cast (comma separated)" htmlFor="f-cast" className="sm:col-span-2">
                <Input
                  id="f-cast"
                  value={form.cast}
                  onChange={(e) => set("cast", e.target.value)}
                  placeholder="Ada Lovelace, Alan Turing"
                  className="h-11 rounded-xl border-white/10 bg-white/5"
                />
              </Field>

              <Field label="Director" htmlFor="f-director">
                <Input
                  id="f-director"
                  value={form.director}
                  onChange={(e) => set("director", e.target.value)}
                  className="h-11 rounded-xl border-white/10 bg-white/5"
                />
              </Field>

              <Field label="Language" htmlFor="f-language">
                <Input
                  id="f-language"
                  value={form.language}
                  onChange={(e) => set("language", e.target.value)}
                  className="h-11 rounded-xl border-white/10 bg-white/5"
                />
              </Field>

              <Field label="Poster URL" htmlFor="f-poster" className="sm:col-span-2">
                <Input
                  id="f-poster"
                  value={form.poster}
                  onChange={(e) => set("poster", e.target.value)}
                  placeholder="https://…/poster.jpg"
                  className="h-11 rounded-xl border-white/10 bg-white/5 font-mono text-xs"
                />
              </Field>

              <Field label="Backdrop URL" htmlFor="f-backdrop" className="sm:col-span-2">
                <Input
                  id="f-backdrop"
                  value={form.backdrop}
                  onChange={(e) => set("backdrop", e.target.value)}
                  placeholder="https://…/backdrop.jpg"
                  className="h-11 rounded-xl border-white/10 bg-white/5 font-mono text-xs"
                />
              </Field>

              <Field label="Trailer URL" htmlFor="f-trailer" className="sm:col-span-2">
                <Input
                  id="f-trailer"
                  value={form.trailer}
                  onChange={(e) => set("trailer", e.target.value)}
                  placeholder="https://…/trailer.mp4"
                  className="h-11 rounded-xl border-white/10 bg-white/5 font-mono text-xs"
                />
              </Field>

              <Field label="Video URL" htmlFor="f-video" className="sm:col-span-2">
                <Input
                  id="f-video"
                  value={form.video}
                  onChange={(e) => set("video", e.target.value)}
                  placeholder="https://…/video.mp4"
                  className="h-11 rounded-xl border-white/10 bg-white/5 font-mono text-xs"
                />
              </Field>

              <Field label="Quality" htmlFor="f-quality">
                <Select
                  value={form.quality}
                  onValueChange={(v) => set("quality", v as "HD" | "4K")}
                >
                  <SelectTrigger id="f-quality" className="h-11 w-full rounded-xl border-white/10 bg-white/5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-popover">
                    <SelectItem value="HD">HD</SelectItem>
                    <SelectItem value="4K">4K</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* switches */}
            <div className="mt-5 grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:grid-cols-3">
              <ToggleRow
                label="Featured"
                description="Show in hero carousel"
                checked={form.featured}
                onChange={(v) => set("featured", v)}
              />
              <ToggleRow
                label="Trending"
                description="Include in Trending row"
                checked={form.trending}
                onChange={(v) => set("trending", v)}
              />
              <ToggleRow
                label="New release"
                description="Badge with NEW"
                checked={form.isNew}
                onChange={(v) => set("isNew", v)}
              />
            </div>

            {validationError && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300"
              >
                {validationError}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-white/10 p-5 md:p-6">
            <Button
              variant="ghost"
              onClick={onClose}
              className="h-11 rounded-full px-5 text-zinc-300 hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={saveMutation.isPending}
              className="h-11 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-6 font-bold shadow-[0_0_30px_-10px_rgba(244,63,94,0.6)] hover:from-rose-400 hover:to-rose-500"
            >
              {saveMutation.isPending ? (
                <Loader2 aria-hidden className="size-4 animate-spin" />
              ) : initial ? (
                "Save changes"
              ) : (
                "Create title"
              )}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={htmlFor} className="text-xs font-semibold text-zinc-300">
          {label}
        </Label>
        {hint && <span className="text-[11px] text-zinc-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-start">
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        aria-label={label}
        className="data-[state=checked]:bg-rose-500"
      />
    </div>
  );
}
