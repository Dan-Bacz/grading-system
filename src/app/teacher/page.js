"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function TeacherPage() {
  const [profile, setProfile] = useState(null);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [score, setScore] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadTeacher() {
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
        setError("Unable to load teacher profile.");
        setLoading(false);
        return;
      }

      if (data.role !== "teacher") {
        router.push("/dashboard");
        return;
      }

      setProfile(data);
      await refreshData(data);
      setLoading(false);
    }

    async function refreshData(data) {
      const [studentData, gradeData] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("role", "student")
          .eq("status", "active")
          .order("full_name", { ascending: true }),
        supabase
          .from("grades")
          .select("*")
          .eq("teacher_id", data.user_id)
          .order("created_at", { ascending: false }),
      ]);

      setStudents(studentData.data || []);
      setGrades(gradeData.data || []);
    }

    loadTeacher();
  }, [router]);

  const studentMap = useMemo(
    () => students.reduce((acc, student) => ({ ...acc, [student.user_id]: student.full_name }), {}),
    [students]
  );

  async function submitGrade(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!selectedStudent || !score) {
      setError("Select a student and enter a score.");
      return;
    }

    const { error } = await supabase.from("grades").insert([
      {
        student_id: selectedStudent,
        teacher_id: profile.user_id,
        subject: profile.assigned_subject || "Unassigned",
        score: Number(score),
        comment,
      },
    ]);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Grade added successfully.");
    setSelectedStudent("");
    setScore("");
    setComment("");
    await refreshGrades();
  }

  async function refreshGrades() {
    const { data } = await supabase
      .from("grades")
      .select("*")
      .eq("teacher_id", profile.user_id)
      .order("created_at", { ascending: false });
    setGrades(data || []);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 shadow-xl shadow-slate-200 text-center">
          <p>Loading teacher dashboard…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-3xl bg-white p-8 shadow-xl shadow-slate-200">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Teacher Dashboard</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">{profile.full_name}</h1>
          <p className="mt-2 text-slate-600">Assigned subject: {profile.assigned_subject || "Not assigned yet"}</p>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Add student grade</h2>
            {profile.assigned_subject ? (
              <form onSubmit={submitGrade} className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Student</span>
                  <select
                    value={selectedStudent}
                    onChange={(event) => setSelectedStudent(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="">Select a student</option>
                    {students.map((student) => (
                      <option key={student.user_id} value={student.user_id}>
                        {student.full_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Score</span>
                  <input
                    type="number"
                    value={score}
                    onChange={(event) => setScore(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none"
                    min="0"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Comment</span>
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none"
                    rows="3"
                  />
                </label>

                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                {message ? <p className="text-sm text-slate-700">{message}</p> : null}

                <button className="rounded-2xl bg-sky-600 px-5 py-3 text-white transition hover:bg-sky-500">
                  Add Grade
                </button>
              </form>
            ) : (
              <p className="mt-4 text-slate-600">You must wait for an admin to assign your subject before adding grades.</p>
            )}
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Your grading history</h2>
            {grades.length === 0 ? (
              <p className="mt-4 text-slate-600">No grades recorded yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {grades.map((grade) => (
                  <div key={grade.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">{studentMap[grade.student_id] || grade.student_id}</p>
                    <p className="text-sm text-slate-600">Subject: {grade.subject}</p>
                    <p className="text-sm text-slate-600">Score: {grade.score}</p>
                    {grade.comment ? <p className="text-sm text-slate-600">Comment: {grade.comment}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
