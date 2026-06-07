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
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl shadow-slate-200 sm:p-8">
          <h1 className="text-3xl font-semibold text-slate-900">Register for FGBI</h1>
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

  async function handleRegister(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const requestBody = {
      email,
      password,
      full_name: fullName,
      role,
      phone,
      address,
      assigned_subject: role === 'teacher' ? subjectPreference : null,
    };

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    if (!response.ok) {
      const serviceRoleMissing = result.error?.toLowerCase().includes('service role');
      if (serviceRoleMissing) {
        const profileData = {
          full_name: fullName,
          role,
          phone,
          address,
          status: 'pending',
          assigned_subject: role === 'teacher' ? subjectPreference : null,
        };

        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: profileData,
          },
        });

        if (authError) {
          setError(authError.message);
          setLoading(false);
          return;
        }

        let profileNote = '';
        try {
          const userId = data?.user?.id ?? null;
          if (userId) {
            const profileResponse = await fetch('/api/profiles', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: userId,
                email,
                full_name: fullName,
                role,
                phone,
                address,
                assigned_subject: role === 'teacher' ? subjectPreference : null,
                status: 'pending',
              }),
            });
            const profileResult = await profileResponse.json();
            if (!profileResponse.ok) {
              profileNote = ` Profile metadata creation failed: ${profileResult.error || 'unknown error'}`;
              console.error('Profile API error', profileResult);
            }
          } else {
            profileNote = ' Profile metadata could not be created because the user id was unavailable.';
          }
        } catch (e) {
          profileNote = ` Profile metadata creation failed: ${e.message || e}`;
          console.error('profile create failed', e);
        }

        setLoading(false);
        setMessage(
          `Registration submitted. Please check your email for confirmation and wait for admin approval.${profileNote}`
        );
        setFullName('');
        setEmail('');
        setPassword('');
        setPhone('');
        setAddress('');
        setSubjectPreference('');
        return;
      }

      setError(result.error || 'Registration failed.');
      setLoading(false);
      return;
    }

    setLoading(false);
    setMessage('Registration submitted. The account is pending admin approval.');
    setFullName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setAddress('');
    setSubjectPreference('');
    setFullName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setAddress("");
    setSubjectPreference("");
  }

  return (
    <main className="min-h-screen bg-[url('/bg.png')] bg-cover bg-center px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-2xl rounded-3xl bg-white/70 border border-white/60 p-6 shadow-xl shadow-slate-900/10 backdrop-blur-xl sm:p-8">
        <div className="mx-auto mb-8 flex max-w-[220px] flex-col items-center text-center">
          <img src="/fgbi.png" alt="FGBI logo" className="h-16 w-16" />
          <h1 className="mt-5 text-3xl font-semibold text-slate-900">Register for FGBI</h1>
          <p className="mt-2 text-slate-600">
            Create a student or teacher account. All registrations are processed by the admin.
          </p>
        </div>

        <form onSubmit={handleRegister} className="mt-8 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Full Name</span>
              <input
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Phone</span>
              <input
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Address</span>
            <input
              required
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none"
            />
          </label>

          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Register as</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm ${role === "student" ? "bg-sky-600 text-white" : "bg-white text-slate-700 border border-slate-300"}`}
                onClick={() => setRole("student")}
              >
                Student
              </button>
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm ${role === "teacher" ? "bg-sky-600 text-white" : "bg-white text-slate-700 border border-slate-300"}`}
                onClick={() => setRole("teacher")}
              >
                Teacher
              </button>
            </div>
          </div>

          {role === "teacher" ? (
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Subject Preference</span>
              <input
                value={subjectPreference}
                onChange={(event) => setSubjectPreference(event.target.value)}
                placeholder="e.g. Mathematics"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none"
              />
            </label>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-slate-700">{message}</p> : null}

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
