function LoadingRow() {
  return (
    <div className="rounded-[1.35rem] border border-white/80 bg-white/85 px-3 py-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 animate-pulse rounded-full bg-sand/70" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-sand/70" />
          <div className="h-4 w-1/3 animate-pulse rounded-full bg-sand/50" />
          <div className="flex gap-2 pt-1">
            <div className="h-8 w-20 animate-pulse rounded-full bg-sand/55" />
            <div className="h-8 w-20 animate-pulse rounded-full bg-sand/55" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="h-3 w-28 animate-pulse rounded-full bg-sand/70" />
        <div className="h-10 w-40 animate-pulse rounded-full bg-sand/70" />
        <div className="h-4 w-72 animate-pulse rounded-full bg-sand/50" />
      </div>

      <div className="rounded-[1.5rem] border border-white/80 bg-gradient-to-br from-white via-cream to-almond p-4 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded-full bg-sand/70" />
            <div className="h-4 w-40 animate-pulse rounded-full bg-sand/50" />
          </div>
          <div className="h-11 w-24 animate-pulse rounded-[1.2rem] bg-sand/70" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="h-20 animate-pulse rounded-[1.2rem] bg-white/75" />
          <div className="h-20 animate-pulse rounded-[1.2rem] bg-white/75" />
        </div>
      </div>

      <div className="space-y-2">
        <LoadingRow />
        <LoadingRow />
        <LoadingRow />
      </div>
    </div>
  );
}
