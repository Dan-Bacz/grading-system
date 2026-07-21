"use client";

import { usePathname } from "next/navigation";

export default function SiteShell({ children }) {
  const pathname = usePathname() || "";
  const isAuth = pathname === "/login" || pathname === "/register";

  // When on auth pages, hide common global header/footer elements (if present)
  // and render children full-bleed. This ensures no nav/footer appears on login/register.
  if (isAuth) {
    return (
      <>
        <style>{`header, nav, footer, .site-header, .site-footer, #app-logo-placeholder { display: none !important; } body { min-height: 100vh; }`}</style>
        <div className="min-h-screen">{children}</div>
      </>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#06080d]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex-1" />
          <div className="flex-1 text-center">
            <p className="text-sm font-semibold tracking-[0.24em] text-slate-100 sm:text-base">
              FUNDAMENTAL GRACE BIBLE INSTITUTE
            </p>
          </div>
          <div className="flex flex-1 justify-end">
            <div className="flex items-center gap-3 rounded-full border border-slate-800/80 bg-slate-950/80 px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.28)]">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-900/80 p-1">
                <img src="/funda.png" alt="Funda logo" className="h-full w-full object-contain" />
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.3em] text-sky-400">Powered by</p>
                <p className="text-sm font-semibold text-slate-100">FGGCCPI</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
