"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, supabaseClientError } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (supabaseClientError) {
    return (
      <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-xl rounded-[32px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
          <h1 className="text-3xl font-semibold text-white">Login to FGBI</h1>
          <p className="mt-2 text-slate-400">
            The app cannot connect to Supabase because the public environment variables are not set.
          </p>
          <div className="mt-6 rounded-2xl bg-red-500/10 p-4 text-red-300">
            {supabaseClientError.message}
          </div>
        </div>
      </main>
    );
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      const message = error.message?.toLowerCase() || "";
      if (message.includes("email") && message.includes("confirm")) {
        setError("Please verify your email address first. Check the confirmation email sent to you.");
      } else {
        setError(error.message);
      }
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 sm:py-8"
      style={{ backgroundImage: "url('/bg.png')", backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0 bg-[#0b1016]/70" />
      <div className="relative mx-auto w-full max-w-xl rounded-[32px] border border-white/10 bg-[#0b1016]/75 p-6 shadow-2xl shadow-[#04070c]/40 backdrop-blur-xl sm:p-8">
        <div className="mx-auto mb-8 flex max-w-[220px] flex-col items-center text-center">
          <img src="/fgbi.png" alt="FGBI logo" className="h-16 w-16" />
          <h1 className="mt-5 text-3xl font-semibold text-white">Login to FGBI</h1>
          <p className="mt-2 text-slate-400">Use your registered email and password.</p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-slate-300">Email</span>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1016]/70 px-4 py-3 text-white placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-300">Password</span>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1016]/70 px-4 py-3 text-white placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-white transition hover:bg-sky-500"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-sky-400 hover:text-sky-300">
            Register now
          </Link>
        </div>
      </div>
    </main>
  );
}
