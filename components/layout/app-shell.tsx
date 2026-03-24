import type { ReactNode } from "react";

import { BottomNav } from "@/components/navigation/bottom-nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell-root sm:px-6 sm:py-6">
      <div className="app-shell-frame flex w-full flex-col overflow-hidden bg-paper-glow sm:mx-auto sm:max-w-[440px] sm:rounded-[2rem] sm:border sm:border-white/70 sm:shadow-shell">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-5 sm:px-5 sm:pb-8">
          {children}
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
