import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "FGBI Grading System",
  description: "A Supabase-backed school grading system with admin, teacher, and student roles.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50">
        <header className="w-full border-b border-slate-100 bg-white/70 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-7xl px-4 py-3 flex items-center justify-center gap-3">
            <div id="app-logo-placeholder" className="h-10 w-10 shrink-0 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
              {/* replace this with your logo image later */}
              <svg className="h-6 w-6 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-slate-900">FGBI Grading System</div>
              <div className="text-sm text-slate-500">Admin · Teachers · Students</div>
            </div>
          </div>
        </header>

        <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>

        <footer className="w-full border-t border-slate-100 bg-white/50">
          <div className="mx-auto w-full max-w-7xl px-4 py-4 text-center text-sm text-slate-500">© {new Date().getFullYear()} FGBI</div>
        </footer>
      </body>
    </html>
  );
}
