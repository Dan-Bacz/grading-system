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
      </div>
    </main>
  );

  const average =
    students.length > 0
      ? students.reduce((sum, item) => sum + item.grade, 0) / students.length
      : 0;

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-4xl bg-white p-6 rounded-xl shadow">
        <h1 className="text-3xl font-bold mb-2">Online Grading System</h1>
        <p className="text-gray-600 mb-6">Simple grading dashboard</p>

        <form onSubmit={addGrade} className="grid gap-4 mb-6">
          <input
            className="border p-3 rounded"
            placeholder="Student Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="border p-3 rounded"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <input
            className="border p-3 rounded"
            type="number"
            placeholder="Grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          />

          <button className="bg-blue-600 text-white p-3 rounded">
            Add Grade
          </button>
        </form>

        <h2 className="text-xl font-semibold mb-3">
          Average Grade: {average.toFixed(2)}
        </h2>

        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Student</th>
              <th className="border p-2">Subject</th>
              <th className="border p-2">Grade</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td className="border p-2">{student.name}</td>
                <td className="border p-2">{student.subject}</td>
                <td className="border p-2">{student.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}