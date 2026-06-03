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
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl shadow-slate-200 sm:p-8">
          <h1 className="text-3xl font-semibold text-slate-900">Login to FGBI</h1>
          <p className="mt-2 text-slate-600">
            The app cannot connect to Supabase because the public environment variables are not set.
          </p>
          <div className="mt-6 rounded-2xl bg-red-50 p-4 text-red-700">
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
      setError(error.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[url('/auth-bg.svg')] bg-cover bg-center px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-xl rounded-3xl bg-white/95 p-6 shadow-xl shadow-slate-900/10 backdrop-blur-sm sm:p-8">
        <h1 className="text-3xl font-semibold text-slate-900">Login to FGBI</h1>
        <p className="mt-2 text-slate-600">Use your registered email and password.</p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-white transition hover:bg-sky-500"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-sky-700 hover:text-sky-900">
            Register now
          </Link>
        </div>
      </div>
    </main>
  );
}
