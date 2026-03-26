function LoadingCard() {
  return (
    <div className="rounded-[1.4rem] border border-white/80 bg-white/90 px-4 py-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-32 animate-pulse rounded-full bg-sand/70" />
          <div className="h-3 w-20 animate-pulse rounded-full bg-sand/50" />
        </div>
        <div className="mt-0.5 h-4 w-4 animate-pulse rounded-full bg-sand/50" />
      </div>

      <div className="mt-3 space-y-2">
        <div className="h-3 w-full animate-pulse rounded-full bg-sand/50" />
        <div className="h-3 w-4/5 animate-pulse rounded-full bg-sand/40" />
      </div>
    </div>
  );
}

export default function DishesLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="h-3 w-28 animate-pulse rounded-full bg-sand/70" />
        <div className="h-10 w-44 animate-pulse rounded-full bg-sand/70" />
        <div className="h-4 w-72 animate-pulse rounded-full bg-sand/50" />
      </div>

      <section className="rounded-[1.75rem] border border-white/80 bg-gradient-to-br from-white via-cream to-almond px-4 py-4 shadow-card">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-40 animate-pulse rounded-[1.2rem] bg-white/80" />
            <div className="h-8 w-16 animate-pulse rounded-full bg-white/75" />
          </div>

          <div className="h-4 w-72 animate-pulse rounded-full bg-sand/50" />
          <div className="h-12 w-40 animate-pulse rounded-[1.2rem] bg-clay/20" />
          <div className="h-14 w-full animate-pulse rounded-[1.35rem] bg-white/85" />
        </div>
      </section>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between rounded-[1.25rem] bg-white/65 px-3 py-2">
          <div className="h-4 w-24 animate-pulse rounded-full bg-sand/60" />
          <div className="h-9 w-9 animate-pulse rounded-full bg-white/80" />
        </div>
        <div className="space-y-3">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>
      </div>
    </div>
  );
}
