"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase, supabaseClientError } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("student");
  const [subjectPreference, setSubjectPreference] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (supabaseClientError) {
    return (
      <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-xl rounded-[32px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
          <h1 className="text-3xl font-semibold text-white">Register for FGBI</h1>
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

  async function handleRegister(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedFullName = fullName.trim();
    const normalizedPhone = phone.trim();
    const normalizedAddress = address.trim();
    const normalizedSubject = role === "teacher" ? subjectPreference.trim() : null;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;
    const { data, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: normalizedFullName,
          role,
          phone: normalizedPhone || null,
          address: normalizedAddress || null,
          assigned_subject: normalizedSubject || null,
          status: "pending",
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const userId = data?.user?.id;
    if (userId) {
      try {
        await fetch('/api/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            email: normalizedEmail,
            full_name: normalizedFullName,
            role,
            phone: normalizedPhone || null,
            address: normalizedAddress || null,
            assigned_subject: normalizedSubject || null,
            status: 'pending',
          }),
        });
      } catch (profileError) {
        console.error('Profile creation failed', profileError);
      }
    }

    setLoading(false);
    setMessage('Registration submitted. Please check your email and confirm your address before signing in.');
    setFullName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setAddress('');
    setSubjectPreference('');
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 sm:py-8"
      style={{ backgroundImage: "url('/bg.png')", backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0 bg-[#0b1016]/70" />
      <div className="relative mx-auto w-full max-w-2xl rounded-[32px] border border-white/10 bg-[#0b1016]/75 p-6 shadow-2xl shadow-[#04070c]/40 backdrop-blur-xl sm:p-8">
        <div className="mx-auto mb-8 flex max-w-[220px] flex-col items-center text-center">
          <img src="/fgbi.png" alt="FGBI logo" className="h-16 w-16" />
          <h1 className="mt-5 text-3xl font-semibold text-white">Register for FGBI</h1>
          <p className="mt-2 text-slate-400">
            Create a student or teacher account. All registrations are processed by the admin.
          </p>
        </div>

        <form onSubmit={handleRegister} className="mt-8 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-300">Full Name</span>
              <input
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1016]/70 px-4 py-3 text-white placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-300">Email</span>
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1016]/70 px-4 py-3 text-white placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-300">Password</span>
              <input
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1016]/70 px-4 py-3 text-white placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-300">Phone</span>
              <input
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1016]/70 px-4 py-3 text-white placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-300">Address</span>
            <input
              required
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1016]/70 px-4 py-3 text-white placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
            />
          </label>

          <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#0b1016]/70 p-4">
            <p className="text-sm font-medium text-slate-300">Register as</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm ${role === "student" ? "bg-sky-600 text-white" : "bg-[#0b1016] text-slate-300 border border-slate-700"}`}
                onClick={() => setRole("student")}
              >
                Student
              </button>
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm ${role === "teacher" ? "bg-sky-600 text-white" : "bg-[#0b1016] text-slate-300 border border-slate-700"}`}
                onClick={() => setRole("teacher")}
              >
                Teacher
              </button>
            </div>
          </div>

          {role === "teacher" ? (
            <label className="block">
              <span className="text-sm font-medium text-slate-300">Subject Preference</span>
              <input
                value={subjectPreference}
                onChange={(event) => setSubjectPreference(event.target.value)}
                placeholder="e.g. Mathematics"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1016]/70 px-4 py-3 text-white placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
              />
            </label>
          ) : null}

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {message ? <p className="text-sm text-slate-300">{message}</p> : null}

          <button
            type="submit"
            className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-white transition hover:bg-sky-500"
            disabled={loading}
          >
            {loading ? "Sending registration..." : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already registered?{' '}
          <Link href="/login" className="font-semibold text-sky-700 hover:text-sky-900">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
