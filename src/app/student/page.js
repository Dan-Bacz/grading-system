"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function StudentPage() {
  const [profile, setProfile] = useState(null);
  const [grades, setGrades] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadStudent() {
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
        setError("Unable to load student profile.");
        setLoading(false);
        return;
      }

      if (data.role !== "student") {
        router.push("/dashboard");
        return;
      }

      setProfile(data);
      await refreshData(data.user_id);
      setLoading(false);
    }

    async function refreshData(studentId) {
      const [gradeData, teacherData] = await Promise.all([
        supabase.from("grades").select("*").eq("student_id", studentId).order("created_at", { ascending: false }),
        supabase.from("profiles").select("user_id, full_name").eq("role", "teacher"),
      ]);

      setGrades(gradeData.data || []);
      setTeachers(teacherData.data || []);
    }

    loadStudent();
  }, [router]);

  const teacherMap = useMemo(
    () => teachers.reduce((acc, teacher) => ({ ...acc, [teacher.user_id]: teacher.full_name }), {}),
    [teachers]
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 shadow-xl shadow-slate-200 text-center">
          <p>Loading student dashboard…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 shadow-xl shadow-slate-200 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="rounded-3xl bg-white p-8 shadow-xl shadow-slate-200">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Student Portal</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">{profile.full_name}</h1>
          <p className="mt-2 text-slate-600">Account status: {profile.status}</p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Your Grades</h2>
          {profile.status !== "active" ? (
            <p className="mt-4 text-slate-600">Your account is pending admin approval. Grades will appear once your account is active.</p>
          ) : grades.length === 0 ? (
            <p className="mt-4 text-slate-600">No grades available yet. Your teacher will add your grades when they become available.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {grades.map((grade) => (
                <div key={grade.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                    <div>
                      <p className="font-semibold text-slate-900">{grade.subject}</p>
                      <p className="text-sm text-slate-600">Score: {grade.score}</p>
                    </div>
                    <p className="text-sm text-slate-600">Teacher: {teacherMap[grade.teacher_id] || "Unknown"}</p>
                  </div>
                  {grade.comment ? <p className="mt-3 text-sm text-slate-600">Comment: {grade.comment}</p> : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
