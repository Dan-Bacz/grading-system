export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-3xl rounded-3xl bg-white p-6 shadow-xl shadow-slate-200 sm:p-8">
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

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-700 shadow-inner">
          <h3 className="text-lg font-semibold mb-3">How it works</h3>
          <ul className="space-y-2 text-sm leading-6">
            <li>• Students register and wait for admin approval.</li>
            <li>• Teachers register and receive assigned subjects from admin.</li>
            <li>• Admin approves accounts and assigns teacher subjects.</li>
            <li>• Teachers add grades for students in their assigned subject.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
