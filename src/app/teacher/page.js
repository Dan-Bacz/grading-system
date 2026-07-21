"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Sidebar from "@/components/Sidebar";

const teacherMenu = [
  { key: "dashboard", label: "Dashboard" },
  { key: "subjects", label: "Subjects" },
  { key: "students", label: "My Students" },
  { key: "reports", label: "Reports" },
  { key: "settings", label: "Settings" },
];

export default function TeacherPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [profile, setProfile] = useState(null);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [score, setScore] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sortBy, setSortBy] = useState("subject");
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

  const sortedStudents = useMemo(() => {
    if (sortBy === "subject") {
      return [...students].sort((a, b) => (a.assigned_subject || "").localeCompare(b.assigned_subject || ""));
    }
    return [...students].sort((a, b) => (a.year_level || "").localeCompare(b.year_level || ""));
  }, [students, sortBy]);

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

  function handleSignOut() {
    supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-xl rounded-[32px] border border-slate-800 bg-slate-900/85 p-10 text-center shadow-2xl shadow-black/30 backdrop-blur">
          <p className="text-slate-300">Loading teacher dashboard…</p>
        </div>
      </main>
    );
  }

  const renderActivePane = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
                <p className="text-sm text-slate-500">Assigned subject</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">{profile.assigned_subject || "Not set"}</p>
              </div>
              <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
                <p className="text-sm text-slate-500">Managed students</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">{students.length}</p>
              </div>
              <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
                <p className="text-sm text-slate-500">Grades recorded</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">{grades.length}</p>
              </div>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Overview</h3>
              <p className="mt-3 text-slate-600">View the subjects assigned by the admin, manage your students, and review all grade entries in this panel.</p>
            </div>
          </div>
        );
      case "subjects":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-900">My subjects</h3>
            <div className="rounded-3xl bg-slate-50 p-6 shadow-inner shadow-slate-200">
              <p className="text-slate-700">Assigned subject:</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{profile.assigned_subject || "Waiting for assignment"}</p>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
              <h4 className="text-lg font-semibold text-slate-900">Students in this subject</h4>
              {grades.length === 0 ? (
                <p className="mt-4 text-slate-600">No students have grades yet for this subject.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {grades.map((grade) => (
                    <div key={grade.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">{studentMap[grade.student_id] || grade.student_id}</p>
                      <p className="text-sm text-slate-600">Score: {grade.score}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case "students":
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">My students</h3>
                <p className="mt-2 text-slate-600">Sort students by subject or year level.</p>
              </div>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="subject">Sort by subject</option>
                <option value="year">Sort by year level</option>
              </select>
            </div>
            {sortedStudents.length === 0 ? (
              <p className="text-slate-600">No active students to display.</p>
            ) : (
              <div className="grid gap-4">
                {sortedStudents.map((student) => (
                  <div key={student.user_id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">{student.full_name}</p>
                    <p className="text-sm text-slate-600">Subject: {student.assigned_subject || "N/A"}</p>
                    <p className="text-sm text-slate-600">Year: {student.year_level || "Not set"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "reports":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-900">Reports</h3>
            <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
              <p className="text-slate-600">Total grades recorded:</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{grades.length}</p>
              <p className="mt-4 text-slate-600">Use this view to see student performance per subject and school year.</p>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-900">Settings</h3>
            <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
              <p className="text-slate-600">Email: {profile.email}</p>
              <p className="mt-2 text-slate-600">Name: {profile.full_name}</p>
              <p className="mt-2 text-slate-600">Subject: {profile.assigned_subject || "Not assigned"}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-7xl min-h-[calc(100vh-48px)] flex-col gap-6 lg:flex-row">
        <Sidebar
          title="FGBI Teacher"
          menuItems={teacherMenu}
          activeKey={activeTab}
          onSelect={setActiveTab}
          profile={profile}
          onSignOut={handleSignOut}
        />

        <div className="flex-1 space-y-6">
          <section className="rounded-[28px] border border-slate-800 bg-slate-900/85 p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-sky-400">Teacher dashboard</p>
                <h1 className="mt-3 text-3xl font-semibold text-white">{profile.full_name}</h1>
                <p className="mt-2 text-slate-400">Manage your assigned subjects, view students, and submit grades.</p>
              </div>
            </div>
          </section>

          {message ? <div className="rounded-3xl border border-emerald-800/60 bg-emerald-500/10 p-4 text-emerald-300 shadow-sm">{message}</div> : null}
          {error ? <div className="rounded-3xl border border-rose-800/60 bg-rose-500/10 p-4 text-rose-300 shadow-sm">{error}</div> : null}

          <section className="rounded-[28px] border border-slate-800 bg-slate-900/85 p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">{renderActivePane()}</section>
        </div>
      </div>
    </main>
  );
}
