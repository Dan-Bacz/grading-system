"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (error || !data) {
        console.error('Failed to load profile', error);
        setError(error?.message || "Unable to load profile. Please log in again.");
        setLoading(false);
        return;
      }

      setProfile(data);
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center shadow-xl shadow-slate-200">
          <p className="text-slate-700">Loading dashboard…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 shadow-xl shadow-slate-200">
          <p className="text-red-600">{error}</p>
          <Link href="/login" className="text-sky-700 hover:underline">
            Return to login
          </Link>
        </div>
      </main>
    );
  }

  const destination =
    profile.role === "admin"
      ? "/admin"
      : profile.role === "teacher"
      ? "/teacher"
      : "/student";

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-xl shadow-slate-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Welcome back</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">{profile.full_name}</h1>
            <p className="mt-2 text-slate-600">Role: {profile.role}</p>
          </div>

          <button
            onClick={handleSignOut}
            className="rounded-2xl bg-slate-950 px-5 py-3 text-white transition hover:bg-slate-800"
          >
            Sign Out
          </button>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-slate-700">
            Account status: <span className="font-semibold">{profile.status}</span>
          </p>
          {profile.status !== "active" ? (
            <p className="mt-4 text-sm text-slate-600">
              Your account is waiting for admin approval. Once approved, you can access your role-specific dashboard.
            </p>
          ) : (
            <Link
              href={destination}
              className="mt-4 inline-flex rounded-2xl bg-sky-600 px-5 py-3 text-white transition hover:bg-sky-500"
            >
              Go to {profile.role === "admin" ? "Admin" : profile.role === "teacher" ? "Teacher" : "Student"} Dashboard
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
