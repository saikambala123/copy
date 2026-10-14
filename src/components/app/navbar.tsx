"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Bell,
  Bookmark,
  Clapperboard,
  CreditCard,
  Home,
  LogOut,
  Search,
  Shield,
  User,
  X,
} from "lucide-react";
import type { Title, User as UserType } from "@/lib/types";
import { api, type TitlesResponse } from "@/lib/api";
import { useAppStore, type View } from "@/lib/store";
import {
  EASE,
  GradientAvatar,
  Logo,
  useDebounced,
} from "@/components/app/bits";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const NAV_LINKS: { view: View; label: string; icon: typeof Home }[] = [
  { view: "browse", label: "Home", icon: Home },
  { view: "movies", label: "Movies", icon: Clapperboard },
  { view: "series", label: "Series", icon: Bookmark },
  { view: "mylist", label: "My List", icon: Bookmark },
];

export function Navbar() {
  const view = useAppStore((s) => s.view);
  const user = useAppStore((s) => s.user);
  const setView = useAppStore((s) => s.setView);
  const openAuth = useAppStore((s) => s.openAuth);
  const openDetail = useAppStore((s) => s.openDetail);

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const debouncedQ = useDebounced(q, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  /* live suggestions */
  const { data: suggestions } = useQuery({
    queryKey: ["titles", { q: debouncedQ, limit: 6 }],
    queryFn: () =>
      api<TitlesResponse>(
        `/api/titles?q=${encodeURIComponent(debouncedQ)}&limit=6`
      ),
    enabled: searchOpen && debouncedQ.trim().length > 1,
    placeholderData: keepPreviousData,
    retry: 0,
  });

  const submitSearch = (term: string) => {
    const t = term.trim();
    if (!t) return;
    setView("search", { query: t });
    setSearchOpen(false);
    setQ("");
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        scrolled
          ? "border-b border-white/10 bg-background/80 backdrop-blur-xl"
          : "bg-gradient-to-b from-black/80 via-black/40 to-transparent"
      )}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 md:h-[72px] md:gap-6 md:px-8"
      >
        {/* logo */}
        <button
          type="button"
          onClick={() => setView("browse")}
          aria-label="NOVA home"
          className="shrink-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Logo />
        </button>

        {/* desktop links */}
        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.view}>
              <button
                type="button"
                onClick={() => setView(link.view)}
                aria-current={view === link.view ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  view === link.view
                    ? "text-white"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                {link.label}
                {view === link.view && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-rose-500 to-rose-400"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-1 md:gap-2">
          {/* expanding search */}
          <div className="relative flex items-center">
            <AnimatePresence initial={false}>
              {searchOpen && (
                <motion.div
                  key="search-input"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "min(72vw, 300px)", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="overflow-hidden"
                >
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitSearch(q);
                    }}
                    className={cn(
                      "glass flex h-11 w-full items-center gap-2 rounded-full px-4",
                      focused && "border-rose-500/50"
                    )}
                  >
                    <Search aria-hidden className="size-4 shrink-0 text-zinc-400" />
                    <input
                      ref={inputRef}
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      placeholder="Titles, genres, people…"
                      aria-label="Search titles"
                      className="h-full w-full bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                    />
                    {q && (
                      <button
                        type="button"
                        onClick={() => setQ("")}
                        aria-label="Clear search"
                        className="flex size-6 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:text-white"
                      >
                        <X aria-hidden className="size-3.5" />
                      </button>
                    )}
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {!searchOpen && (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
                className="flex size-11 items-center justify-center rounded-full text-zinc-300 transition hover:bg-white/10 hover:text-white"
              >
                <Search aria-hidden className="size-5" />
              </button>
            )}
            {searchOpen && (
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setQ("");
                }}
                aria-label="Close search"
                className="ml-1 flex size-11 items-center justify-center rounded-full text-zinc-300 transition hover:bg-white/10 hover:text-white"
              >
                <X aria-hidden className="size-5" />
              </button>
            )}

            {/* live suggestions */}
            <AnimatePresence>
              {searchOpen &&
                debouncedQ.trim().length > 1 &&
                !!suggestions?.titles?.length && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-14 w-[min(88vw,340px)] overflow-hidden rounded-2xl border border-white/10 bg-popover/95 p-2 shadow-2xl backdrop-blur-xl"
                    role="listbox"
                    aria-label="Search suggestions"
                  >
                    {suggestions.titles.slice(0, 5).map((t) => (
                      <SuggestionItem
                        key={t._id}
                        title={t}
                        onPick={() => {
                          openDetail(t._id);
                          setSearchOpen(false);
                          setQ("");
                        }}
                      />
                    ))}
                  </motion.div>
                )}
            </AnimatePresence>
          </div>

          {/* notifications */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Notifications"
                  className="relative flex size-11 items-center justify-center rounded-full text-zinc-300 transition hover:bg-white/10 hover:text-white"
                >
                  <Bell aria-hidden className="size-5" />
                  <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-72 rounded-xl border-white/10 bg-popover/95 backdrop-blur-xl"
              >
                <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Notifications
                </DropdownMenuLabel>
                <NotificationItem
                  title="New episode of Dark"
                  body="S2:E4 is now streaming in 4K."
                />
                <NotificationItem
                  title="Welcome to NOVA"
                  body="Your personalized rows are ready."
                />
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={() =>
                    toast.info("You're all caught up", {
                      description: "No new notifications.",
                    })
                  }
                  className="justify-center text-xs font-medium text-zinc-400"
                >
                  Mark all as read
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* account */}
          {user ? (
            <AvatarMenu user={user} />
          ) : (
            <Button
              onClick={() => openAuth("login")}
              className="h-11 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-6 font-semibold shadow-[0_0_30px_-10px_rgba(244,63,94,0.6)] hover:from-rose-400 hover:to-rose-500"
            >
              Sign In
            </Button>
          )}
        </div>
      </nav>

      {/* mobile quick nav */}
      <div className="no-scrollbar flex items-center gap-1 overflow-x-auto px-3 pb-2 md:hidden">
        {NAV_LINKS.map((link) => (
          <button
            key={link.view}
            type="button"
            onClick={() => setView(link.view)}
            aria-current={view === link.view ? "page" : undefined}
            className={cn(
              "flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition",
              view === link.view
                ? "bg-rose-500/15 text-rose-400"
                : "text-zinc-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <link.icon aria-hidden className="size-4" />
            {link.label}
          </button>
        ))}
      </div>
    </header>
  );
}

function NotificationItem({ title, body }: { title: string; body: string }) {
  return (
    <DropdownMenuItem className="flex cursor-pointer flex-col items-start gap-0.5 rounded-lg p-3 focus:bg-white/5">
      <span className="text-sm font-semibold text-foreground">{title}</span>
      <span className="text-xs text-muted-foreground">{body}</span>
    </DropdownMenuItem>
  );
}

function SuggestionItem({
  title,
  onPick,
}: {
  title: Title;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={false}
      onClick={onPick}
      className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-white/5"
    >
      <span className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-zinc-800">
        {title.poster && (
          <img
            src={title.poster}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-foreground">
          {title.title}
        </span>
        <span className="block text-xs text-muted-foreground">
          {title.type === "movie" ? "Movie" : "Series"} • {title.year}
        </span>
      </span>
    </button>
  );
}

function AvatarMenu({ user }: { user: UserType }) {
  const setView = useAppStore((s) => s.setView);
  const setUser = useAppStore((s) => s.setUser);
  const qc = useQueryClient();

  const logout = useMutation({
    mutationFn: () => api<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
    onSuccess: () => {
      setUser(null);
      qc.invalidateQueries();
      setView("browse");
      toast.success("Signed out", { description: "See you soon on NOVA." });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="ml-1 flex items-center gap-2 rounded-full p-1 outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <GradientAvatar
            name={user.name}
            gradient={user.avatar}
            className="size-9 text-sm"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-60 rounded-xl border-white/10 bg-popover/95 backdrop-blur-xl"
      >
        <DropdownMenuLabel className="flex items-center gap-3 py-3">
          <GradientAvatar
            name={user.name}
            gradient={user.avatar}
            className="size-10 text-sm"
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">
              {user.name}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <MenuIconItem
          icon={User}
          label="Account"
          onClick={() => setView("account")}
        />
        <MenuIconItem
          icon={CreditCard}
          label="Plans & Pricing"
          onClick={() => setView("plans")}
        />
        {user.role === "admin" && (
          <MenuIconItem
            icon={Shield}
            label="Admin Portal"
            onClick={() => setView("admin", { adminTab: "dashboard" })}
            accent
          />
        )}
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="cursor-pointer gap-3 rounded-lg p-2.5 text-sm text-rose-400 focus:bg-rose-500/10 focus:text-rose-300"
        >
          <LogOut aria-hidden className="size-4" />
          {logout.isPending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MenuIconItem({
  icon: Icon,
  label,
  onClick,
  accent = false,
}: {
  icon: typeof User;
  label: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <DropdownMenuItem
      onClick={onClick}
      className={cn(
        "cursor-pointer gap-3 rounded-lg p-2.5 text-sm focus:bg-white/5",
        accent && "text-amber-400 focus:bg-amber-500/10 focus:text-amber-300"
      )}
    >
      <Icon aria-hidden className="size-4" />
      {label}
    </DropdownMenuItem>
  );
}
