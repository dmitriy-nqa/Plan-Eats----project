import type { ReactNode } from "react";

import { BottomNav } from "@/components/navigation/bottom-nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen px-4 pb-6 pt-4 sm:px-6 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[440px] flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-paper-glow shadow-shell">
        <div className="flex-1 overflow-y-auto px-4 pb-16 pt-5 sm:px-5 sm:pb-28">
          {children}
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
