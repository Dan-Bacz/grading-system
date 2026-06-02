import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-xl shadow-slate-200">
        <div className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-600">
            FGBI Grading System
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
            School grading with RBAC and Supabase
          </h1>
          <p className="mt-4 text-slate-600">
            Admins approve students, assign teacher subjects, and teachers manage grades for their assigned subject.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Link
            href="/login"
            className="rounded-3xl border border-slate-200 bg-slate-950 px-6 py-8 text-center text-white transition hover:bg-slate-800"
          >
            <h2 className="text-xl font-semibold mb-2">Login</h2>
            <p>Sign in with your school email.</p>
          </Link>

          <Link
            href="/register"
            className="rounded-3xl border border-slate-200 bg-sky-600 px-6 py-8 text-center text-white transition hover:bg-sky-500"
          >
            <h2 className="text-xl font-semibold mb-2">Register</h2>
            <p>Create a student or teacher account for FGBI.</p>
          </Link>
        </div>

        <div className="mt-10 rounded-3xl bg-slate-50 p-6 text-slate-700 shadow-inner">
          <h3 className="text-lg font-semibold mb-3">How it works</h3>
          <ul className="space-y-2 text-sm leading-6">
            <li>• Students register and wait for admin approval.</li>
            <li>• Teachers register and receive assigned subjects from admin.</li>
            <li>• Admin approves accounts and assigns teacher subjects.</li>
            <li>• Teachers add grades for students in their assigned subject.</li>
          </ul>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-700 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Direct page access</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link href="/login" className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-slate-700 transition hover:bg-sky-600 hover:text-white">
              Login
            </Link>
            <Link href="/register" className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-slate-700 transition hover:bg-sky-600 hover:text-white">
              Register
            </Link>
            <Link href="/dashboard" className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-slate-700 transition hover:bg-sky-600 hover:text-white">
              Dashboard
            </Link>
            <Link href="/admin" className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-slate-700 transition hover:bg-sky-600 hover:text-white">
              Admin
            </Link>
            <Link href="/teacher" className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-slate-700 transition hover:bg-sky-600 hover:text-white">
              Teacher
            </Link>
            <Link href="/student" className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-slate-700 transition hover:bg-sky-600 hover:text-white">
              Student
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
