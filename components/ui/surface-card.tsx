import type { ReactNode } from "react";

type SurfaceCardProps = {
  children: ReactNode;
  className?: string;
};

export function SurfaceCard({ children, className = "" }: SurfaceCardProps) {
  return (
    <section
      className={[
        "rounded-[1.5rem] border border-white/80 bg-cream/90 p-4 shadow-card",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}
