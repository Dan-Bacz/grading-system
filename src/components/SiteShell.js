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

  return <>{children}</>;
}
