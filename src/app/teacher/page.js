"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Sidebar from "@/components/Sidebar";
import { addGradeEntry, loadGradeStore } from "@/lib/gradeStore";

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
  const [selectedSubject, setSelectedSubject] = useState("");
  const [reportPreview, setReportPreview] = useState(null);
  const [score, setScore] = useState("");
  const [comment, setComment] = useState("");
  const [store, setStore] = useState(loadGradeStore());
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
      setStore(loadGradeStore());
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

    if (!selectedStudent || !selectedSubject || !score) {
      setError("Select a student, subject, and enter a score.");
      return;
    }

    const { error } = await supabase.from("grades").insert([
      {
        student_id: selectedStudent,
        teacher_id: profile.user_id,
        subject: selectedSubject,
        score: Number(score),
        comment,
      },
    ]);

    if (error) {
      setError(error.message);
      return;
    }

    const nextStore = addGradeEntry(store, {
      studentId: selectedStudent,
      studentName: students.find((student) => student.user_id === selectedStudent)?.full_name || selectedStudent,
      subjectId: `${selectedSubject}-${profile.user_id}`,
      subjectName: selectedSubject,
      teacherId: profile.user_id,
      teacherName: profile.full_name,
      score: Number(score),
      comment,
    });
    setStore(nextStore);
    setMessage("Grade added successfully.");
    setSelectedStudent("");
    setSelectedSubject("");
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

  function handlePrintStudentReport() {
    if (!selectedStudent || !selectedSubject) {
      setError("Select a student and subject first.");
      return;
    }

    const student = students.find((entry) => entry.user_id === selectedStudent);
    const studentGrades = grades.filter((grade) => grade.student_id === selectedStudent && grade.subject === selectedSubject);
    setReportPreview({
      student,
      subject: selectedSubject,
      grades: studentGrades,
    });
    window.setTimeout(() => window.print(), 250);
  }

  function handlePrintSubjectReport() {
    if (!selectedSubject) {
      setError("Select a subject first.");
      return;
    }

    const subjectGrades = grades.filter((grade) => grade.subject === selectedSubject);
    setReportPreview({
      subject: selectedSubject,
      grades: subjectGrades,
      isSubjectReport: true,
    });
    window.setTimeout(() => window.print(), 250);
  }

  function handleSignOut() {
    supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-xl rounded-[32px] border border-slate-800 bg-[#0b1016] p-10 text-center shadow-2xl shadow-[#04070c]/40 backdrop-blur">
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
              <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
                <p className="text-sm text-slate-400">Assigned subject</p>
                <p className="mt-4 text-3xl font-semibold text-white">{profile.assigned_subject || "Not set"}</p>
              </div>
              <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
                <p className="text-sm text-slate-400">Managed students</p>
                <p className="mt-4 text-3xl font-semibold text-white">{students.length}</p>
              </div>
              <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
                <p className="text-sm text-slate-400">Grades recorded</p>
                <p className="mt-4 text-3xl font-semibold text-white">{grades.length}</p>
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
              <h3 className="text-xl font-semibold text-white">Overview</h3>
              <p className="mt-3 text-slate-400">View the subjects assigned by the admin, manage your students, and review all grade entries in this panel.</p>
            </div>
          </div>
        );
      case "subjects":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">My subjects</h3>
            <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
              <p className="text-slate-400">Assigned subject:</p>
              <p className="mt-2 text-2xl font-semibold text-white">{profile.assigned_subject || "Waiting for assignment"}</p>
            </div>
            <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="text-lg font-semibold text-white">Students in this subject</h4>
                <label className="text-sm text-slate-300">
                  Subject
                  <select value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value)} className="ml-2 rounded-2xl border border-slate-700 bg-[#0b1016] px-3 py-2 text-white">
                    <option value="">Choose subject</option>
                    <option value={profile.assigned_subject || "Unassigned"}>{profile.assigned_subject || "Unassigned"}</option>
                  </select>
                </label>
              </div>
              {!selectedSubject ? (
                <p className="mt-4 text-slate-400">Select a subject to view the enrolled students.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {students.filter((student) => student.assigned_subject === selectedSubject || !student.assigned_subject).map((student) => (
                    <div key={student.user_id} className="rounded-3xl border border-slate-800 bg-[#0b1016] p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-white">{student.full_name}</p>
                          <p className="text-sm text-slate-400">Year: {student.year_level || "Not set"}</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="rounded-2xl border border-slate-700 px-3 py-2 text-sm text-slate-200">View</button>
                          <button className="rounded-2xl bg-sky-600 px-3 py-2 text-sm text-white">Grade</button>
                        </div>
                      </div>
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
                <h3 className="text-xl font-semibold text-white">My students</h3>
                <p className="mt-2 text-slate-400">Sort students by subject or year level.</p>
              </div>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-[#0b1016] px-4 py-3 text-sm text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="subject">Sort by subject</option>
                <option value="year">Sort by year level</option>
              </select>
            </div>
            {sortedStudents.length === 0 ? (
              <p className="text-slate-400">No active students to display.</p>
            ) : (
              <div className="grid gap-4">
                {sortedStudents.map((student) => (
                  <div key={student.user_id} className="rounded-3xl border border-slate-800 bg-[#0b1016] p-4">
                    <p className="font-semibold text-white">{student.full_name}</p>
                    <p className="text-sm text-slate-400">Subject: {student.assigned_subject || "N/A"}</p>
                    <p className="text-sm text-slate-400">Year: {student.year_level || "Not set"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "reports":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Reports</h3>
            <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
              <p className="text-slate-400">Total grades recorded:</p>
              <p className="mt-3 text-3xl font-semibold text-white">{grades.length}</p>
              <p className="mt-4 text-slate-400">Use this view to see student performance per subject and school year.</p>
            </div>
            <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
              <h4 className="text-lg font-semibold text-white">Grade entry</h4>
              <form onSubmit={submitGrade} className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm text-slate-300">
                    Student
                    <select value={selectedStudent} onChange={(event) => setSelectedStudent(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-700 bg-[#0b1016] px-4 py-3 text-white">
                      <option value="">Select student</option>
                      {students.map((student) => (
                        <option key={student.user_id} value={student.user_id}>{student.full_name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm text-slate-300">
                    Subject
                    <select value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-700 bg-[#0b1016] px-4 py-3 text-white">
                      <option value="">Select subject</option>
                      <option value={profile.assigned_subject || "Unassigned"}>{profile.assigned_subject || "Unassigned"}</option>
                    </select>
                  </label>
                </div>
                <label className="block text-sm text-slate-300">
                  Score
                  <input value={score} onChange={(event) => setScore(event.target.value)} placeholder="e.g. 88" className="mt-2 w-full rounded-2xl border border-slate-700 bg-[#0b1016] px-4 py-3 text-white" />
                </label>
                <label className="block text-sm text-slate-300">
                  Comment
                  <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Comment" className="mt-2 h-24 w-full rounded-2xl border border-slate-700 bg-[#0b1016] px-4 py-3 text-white" />
                </label>
                <div className="flex flex-wrap gap-3">
                  <button className="rounded-2xl bg-sky-600 px-5 py-3 text-white">Submit grade</button>
                  <button type="button" onClick={handlePrintStudentReport} className="rounded-2xl border border-slate-700 px-5 py-3 text-slate-200">Print student report</button>
                  <button type="button" onClick={handlePrintSubjectReport} className="rounded-2xl border border-slate-700 px-5 py-3 text-slate-200">Print subject report</button>
                </div>
              </form>
            </div>
            {reportPreview ? (
              <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur print:block hidden">
                <h4 className="text-xl font-semibold text-white">{reportPreview.isSubjectReport ? `Subject report: ${reportPreview.subject}` : `Student report: ${reportPreview.student?.full_name || "Student"}`}</h4>
                <p className="mt-2 text-slate-400">{reportPreview.isSubjectReport ? "All grades recorded for this subject" : `Grades recorded for ${reportPreview.subject}`}</p>
                <div className="mt-4 space-y-3">
                  {(reportPreview.grades || []).map((grade) => (
                    <div key={grade.id} className="rounded-2xl border border-slate-800 bg-[#0b1016] p-3">
                      <p className="font-semibold text-white">{reportPreview.isSubjectReport ? (studentMap[grade.student_id] || grade.student_id) : grade.subject}</p>
                      <p className="text-sm text-slate-400">Score: {grade.score}</p>
                      {grade.comment ? <p className="text-sm text-slate-400">Comment: {grade.comment}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
              <h4 className="text-lg font-semibold text-white">Grade list</h4>
              {grades.length === 0 ? (
                <p className="mt-4 text-slate-400">No grades yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {grades.map((grade) => (
                    <div key={grade.id} className="rounded-3xl border border-slate-800 bg-[#0b1016] p-4">
                      <p className="font-semibold text-white">{grade.subject}</p>
                      <p className="text-sm text-slate-400">Student: {studentMap[grade.student_id] || grade.student_id}</p>
                      <p className="text-sm text-slate-400">Score: {grade.score}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Settings</h3>
            <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
              <p className="text-slate-400">Email: {profile.email}</p>
              <p className="mt-2 text-slate-400">Name: {profile.full_name}</p>
              <p className="mt-2 text-slate-400">Subject: {profile.assigned_subject || "Not assigned"}</p>
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
          title="FGBI Teacher"
          menuItems={teacherMenu}
          activeKey={activeTab}
          onSelect={setActiveTab}
          profile={profile}
          onSignOut={handleSignOut}
        />

        <div className="flex-1 space-y-6">
          <section className="rounded-[28px] border border-slate-800 bg-[#0b1016] p-6 shadow-2xl shadow-[#04070c]/40 backdrop-blur sm:p-8">
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

          <section className="rounded-[28px] border border-slate-800 bg-[#0b1016] p-6 shadow-2xl shadow-[#04070c]/40 backdrop-blur sm:p-8">{renderActivePane()}</section>
        </div>
      </div>
    </main>
  );
}
