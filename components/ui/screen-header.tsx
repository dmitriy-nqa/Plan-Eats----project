type ScreenHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function ScreenHeader({
  eyebrow,
  title,
  description,
}: ScreenHeaderProps) {
  return (
    <header className="mb-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-clay">
        {eyebrow}
      </p>
      <h1 className="font-[var(--font-heading)] text-4xl font-semibold leading-none text-ink">
        {title}
      </h1>
      <p className="mt-3 max-w-[32ch] text-sm leading-6 text-cocoa">
        {description}
      </p>
    </header>
  );
}
