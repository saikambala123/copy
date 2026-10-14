"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function CardSkeleton({ fluid = false }: { fluid?: boolean }) {
  return (
    <div
      className={cn(
        "skeleton-shimmer aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]",
        fluid ? "w-full" : "w-[132px] shrink-0 sm:w-[150px] md:w-[170px]"
      )}
      aria-hidden
    >
      <div className="h-full w-full" />
    </div>
  );
}

export function RowSkeleton({ count = 8 }: { count?: number }) {
  return (
    <section className="space-y-3" aria-hidden>
      <div className="flex items-center justify-between px-4 md:px-8">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex gap-3 overflow-hidden px-4 md:gap-4 md:px-8">
        {Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div
      aria-hidden
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5 xl:grid-cols-6"
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} fluid />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <section
      aria-hidden
      className="skeleton-shimmer relative h-[78vh] min-h-[540px] w-full overflow-hidden bg-white/[0.03]"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute bottom-16 left-4 space-y-4 md:bottom-24 md:left-12">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-14 w-72 md:h-16 md:w-[28rem]" />
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-12 w-32 rounded-full" />
          <Skeleton className="h-12 w-36 rounded-full" />
        </div>
      </div>
    </section>
  );
}

export function BrowseSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading home">
      <HeroSkeleton />
      <div className="relative z-10 -mt-16 space-y-10 pb-16 md:-mt-24">
        <RowSkeleton />
        <RowSkeleton />
        <RowSkeleton />
      </div>
    </div>
  );
}

export function TableSkeleton({
  rows = 6,
  cols = 6,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-3"
        >
          <Skeleton className="size-10 rounded-lg" />
          {Array.from({ length: cols - 1 }).map((_, c) => (
            <Skeleton
              key={c}
              className="h-4 flex-1"
              style={{ maxWidth: `${40 + ((r + c) % 4) * 15}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-4 xl:grid-cols-4"
      aria-hidden
      aria-busy
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton-shimmer rounded-2xl border border-white/10 bg-white/[0.03] p-5"
        >
          <Skeleton className="mb-3 h-4 w-24" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="mt-3 h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading title details">
      <div className="skeleton-shimmer aspect-video w-full bg-white/[0.04]" />
      <div className="space-y-4 p-4 md:p-8">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <div className="flex gap-2 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="size-10 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
