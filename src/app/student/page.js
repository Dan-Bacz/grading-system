"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Sidebar from "@/components/Sidebar";

const studentMenu = [
  { key: "dashboard", label: "Dashboard" },
  { key: "grades", label: "Grades" },
  { key: "enrollment", label: "Enrollment" },
  { key: "report", label: "Report Card" },
  { key: "settings", label: "Settings" },
];

export default function StudentPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [profile, setProfile] = useState(null);
  const [grades, setGrades] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [enrolledSubjects, setEnrolledSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
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
        supabase.from("profiles").select("user_id, full_name, assigned_subject").eq("role", "teacher"),
      ]);

      setGrades(gradeData.data || []);
      setTeachers(teacherData.data || []);
      setEnrolledSubjects(gradeData.data?.map((grade) => grade.subject) || []);
    }

    loadStudent();
  }, [router]);

  const teacherMap = useMemo(
    () => teachers.reduce((acc, teacher) => ({ ...acc, [teacher.user_id]: teacher.full_name }), {}),
    [teachers]
  );

  const availableSubjects = useMemo(() => {
    return teachers
      .map((teacher) => ({ subject: teacher.assigned_subject, teacher: teacher.full_name }))
      .filter((item) => item.subject);
  }, [teachers]);

  function handleEnroll(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!selectedSubject) {
      setError("Choose a subject to enroll.");
      return;
    }

    if (enrolledSubjects.includes(selectedSubject)) {
      setError("You are already enrolled in this subject.");
      return;
    }

    setEnrolledSubjects((current) => [...current, selectedSubject]);
    setSelectedSubject("");
    setMessage("Enrolled successfully.");
  }

  function handleSignOut() {
    supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-6">
        <div className="mx-auto max-w-xl rounded-[32px] border border-slate-800 bg-black p-10 text-center shadow-2xl shadow-black/30 backdrop-blur">
          <p className="text-slate-300">Loading student dashboard…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black p-6">
        <div className="mx-auto max-w-xl rounded-[32px] border border-slate-800 bg-black p-10 text-center shadow-2xl shadow-black/30 backdrop-blur">
          <p className="text-red-400">{error}</p>
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
              <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
                <p className="text-sm text-slate-400">Year level</p>
                <p className="mt-4 text-3xl font-semibold text-white">{profile.year_level || "Not set"}</p>
              </div>
              <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
                <p className="text-sm text-slate-400">Enrolled subjects</p>
                <p className="mt-4 text-3xl font-semibold text-white">{enrolledSubjects.length}</p>
              </div>
              <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
                <p className="text-sm text-slate-400">Grades available</p>
                <p className="mt-4 text-3xl font-semibold text-white">{grades.length}</p>
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
              <h3 className="text-xl font-semibold text-white">Welcome to your student portal</h3>
              <p className="mt-3 text-slate-400">Use the sidebar to review your grades, enroll in subjects, and print your report card.</p>
            </div>
          </div>
        );
      case "grades":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Grades</h3>
            {grades.length === 0 ? (
              <p className="text-slate-400">You have no grades yet.</p>
            ) : (
              <div className="space-y-4">
                {grades.map((grade) => (
                  <div key={grade.id} className="rounded-3xl border border-slate-800 bg-black p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                      <div>
                        <p className="font-semibold text-white">{grade.subject}</p>
                        <p className="text-sm text-slate-400">Score: {grade.score}</p>
                      </div>
                      <p className="text-sm text-slate-400">Teacher: {teacherMap[grade.teacher_id] || "Unknown"}</p>
                    </div>
                    {grade.comment ? <p className="mt-3 text-sm text-slate-400">Comment: {grade.comment}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "enrollment":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Enrollment</h3>
            <p className="text-slate-400">Enroll based on your year level. Only subjects available for your year will appear here.</p>
            <form onSubmit={handleEnroll} className="space-y-4 rounded-[24px] border border-slate-800 bg-[#0b1016] p-6 shadow-2xl shadow-[#04070c]/40 backdrop-blur">
              <label className="block">
                <span className="text-sm font-medium text-slate-300">Subject</span>
                <select
                  value={selectedSubject}
                  onChange={(event) => setSelectedSubject(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-[#0b1016] px-4 py-3 text-white focus:border-sky-500 focus:outline-none"
                >
                  <option value="">Select a subject</option>
                  {availableSubjects.map((item) => (
                    <option key={item.subject} value={item.subject}>
                      {item.subject} — {item.teacher}
                    </option>
                  ))}
                </select>
              </label>
              <button className="rounded-2xl bg-sky-600 px-5 py-3 text-white transition hover:bg-sky-500">Enroll</button>
              {message ? <p className="text-slate-300">{message}</p> : null}
              {error ? <p className="text-red-400">{error}</p> : null}
            </form>
            <div className="rounded-[24px] border border-slate-800 bg-[#0b1016] p-6 text-slate-400">
              <p>Available subjects are drawn from teacher assignments. If no subjects appear, ask the admin to assign teachers and subjects.</p>
            </div>
          </div>
        );
      case "report":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Report Card</h3>
            <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
              <p className="text-slate-400">This report card includes all enrolled subjects and grade scores.</p>
              {grades.length === 0 ? (
                <p className="mt-4 text-slate-400">No grades are available to print.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {grades.map((grade) => (
                    <div key={grade.id} className="rounded-3xl border border-slate-800 bg-black p-4">
                      <p className="font-semibold text-white">{grade.subject}</p>
                      <p className="text-sm text-slate-400">Score: {grade.score}</p>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => window.print()} className="mt-6 rounded-2xl bg-sky-600 px-5 py-3 text-white transition hover:bg-sky-500">
                Print Report Card
              </button>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Settings</h3>
            <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
              <p className="text-slate-400">Name: {profile.full_name}</p>
              <p className="mt-2 text-slate-400">Email: {profile.email}</p>
              <p className="mt-2 text-slate-400">Year level: {profile.year_level || "Not set"}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-[#0b1016] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-7xl min-h-[calc(100vh-48px)] flex-col gap-6 lg:flex-row">
        <Sidebar
          title="FGBI Student"
          menuItems={studentMenu}
          activeKey={activeTab}
          onSelect={setActiveTab}
          profile={profile}
          onSignOut={handleSignOut}
        />

        <div className="flex-1 space-y-6">
          <section className="rounded-[28px] border border-slate-800 bg-[#0b1016] p-6 shadow-2xl shadow-[#04070c]/40 backdrop-blur sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-sky-400">Student portal</p>
                <h1 className="mt-3 text-3xl font-semibold text-white">{profile.full_name}</h1>
                <p className="mt-2 text-slate-400">View your grades, enroll in subjects, and print your report card.</p>
              </div>
            </div>
          </section>

          {message ? <div className="rounded-3xl border border-emerald-800/60 bg-emerald-500/10 p-4 text-emerald-300 shadow-sm">{message}</div> : null}
          {error ? <div className="rounded-3xl border border-rose-800/60 bg-rose-500/10 p-4 text-rose-300 shadow-sm">{error}</div> : null}

          <section className="rounded-[28px] border border-slate-800 bg-[#0b1016] p-6 shadow-2xl shadow-[#04070c]/40 backdrop-blur sm:p-8">{renderActivePane()}</section>
        </div>
      </div>
    </main>
  );
}
