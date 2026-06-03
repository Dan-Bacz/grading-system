"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Sidebar from "@/components/Sidebar";

const adminMenu = [
  { key: "dashboard", label: "Dashboard" },
  { key: "approve", label: "Approve Accounts" },
  { key: "faculty", label: "Faculty List" },
  { key: "students", label: "Student List" },
  { key: "grades", label: "Grades" },
  { key: "enrollment", label: "Enrollment" },
  { key: "system", label: "System Info" },
  { key: "logs", label: "Logs" },
  { key: "settings", label: "Settings" },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [profile, setProfile] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [semesterName, setSemesterName] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadAdmin() {
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
        setError("Unable to load admin profile.");
        setLoading(false);
        return;
      }

      if (data.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      setProfile(data);
      await refreshData();
      setLoading(false);
    }

    loadAdmin();
  }, [router]);

  async function refreshData() {
    setMessage("");
    setError("");

    try {
      const response = await fetch('/api/admin/dashboard');
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Unable to load admin data.');
      }
      setPendingUsers(result.pending || []);
      setTeachers(result.teachers || []);
      setStudents(result.students || []);
      setGrades(result.grades || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function approveUser(userId) {
    setMessage("");
    setError("");

    try {
      const response = await fetch('/api/admin/dashboard', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, status: 'active' }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Unable to approve account.');
      }
      await refreshData();
      setMessage('Approved successfully.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function rejectUser(userId) {
    setMessage("");
    setError("");

    try {
      const response = await fetch('/api/admin/dashboard', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Unable to reject account.');
      }
      await refreshData();
      setMessage('Account rejected and deleted.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function assignSubject(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!selectedTeacher || !subjectName) {
      setError("Select a teacher and enter a subject.");
      return;
    }

    try {
      const response = await fetch('/api/admin/dashboard', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: selectedTeacher, status: 'active', assigned_subject: subjectName }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Unable to assign subject.');
      }
      setMessage('Subject assigned to teacher.');
      setSelectedTeacher("");
      setSubjectName("");
      await refreshData();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleAddSemester(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!semesterName.trim()) {
      setError("Provide a semester name.");
      return;
    }

    setSemesters((current) => [...current, { id: Date.now().toString(), name: semesterName.trim() }]);
    setSemesterName("");
    setMessage("Semester added.");
  }

  function handleAddSubject(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!subjectName.trim()) {
      setError("Provide a subject name.");
      return;
    }

    setSubjects((current) => [...current, { id: Date.now().toString(), name: subjectName.trim() }]);
    setSubjectName("");
    setMessage("Subject added.");
  }

  function handleSignOut() {
    supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 shadow-xl shadow-slate-200 text-center">
          <p>Loading admin dashboard…</p>
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
                <p className="text-sm text-slate-500">Pending approvals</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">{pendingUsers.length}</p>
              </div>
              <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
                <p className="text-sm text-slate-500">Teachers</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">{teachers.length}</p>
              </div>
              <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
                <p className="text-sm text-slate-500">Students</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">{students.length}</p>
              </div>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Quick summary</h3>
              <p className="mt-3 text-slate-600">Use the sidebar to manage approvals, faculty, subjects, and student enrollment for each semester.</p>
            </div>
          </div>
        );
      case "approve":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-900">Pending accounts</h3>
            {pendingUsers.length === 0 ? (
              <p className="text-slate-600">No pending accounts right now.</p>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map((user) => (
                  <div key={user.user_id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{user.full_name}</p>
                        <p className="text-sm text-slate-600">{user.email} · {user.role}</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => approveUser(user.user_id)}
                          className="rounded-2xl bg-sky-600 px-4 py-2 text-white transition hover:bg-sky-500"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectUser(user.user_id)}
                          className="rounded-2xl bg-red-600 px-4 py-2 text-white transition hover:bg-red-500"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "faculty":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-900">Faculty list</h3>
            {teachers.length === 0 ? (
              <p className="text-slate-600">No teachers have been created yet.</p>
            ) : (
              <div className="grid gap-4">
                {teachers.map((teacher) => (
                  <div key={teacher.user_id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">{teacher.full_name}</p>
                    <p className="text-sm text-slate-600">Subject: {teacher.assigned_subject || "Not assigned"}</p>
                    <p className="text-sm text-slate-600">Email: {teacher.email}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "students":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-900">Student list</h3>
            {students.length === 0 ? (
              <p className="text-slate-600">No students are active yet.</p>
            ) : (
              <div className="grid gap-4">
                {students.map((student) => (
                  <div key={student.user_id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">{student.full_name}</p>
                    <p className="text-sm text-slate-600">Email: {student.email}</p>
                    <p className="text-sm text-slate-600">Status: {student.status}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "grades":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-900">Grades overview</h3>
            {grades.length === 0 ? (
              <p className="text-slate-600">No grades have been entered yet.</p>
            ) : (
              <div className="space-y-4">
                {grades.map((grade) => (
                  <div key={grade.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">Subject: {grade.subject}</p>
                    <p className="text-sm text-slate-600">Student ID: {grade.student_id}</p>
                    <p className="text-sm text-slate-600">Teacher ID: {grade.teacher_id}</p>
                    <p className="text-sm text-slate-600">Score: {grade.score}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "enrollment":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-900">Enrollment and semesters</h3>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-6">
                <h4 className="text-lg font-semibold text-slate-900">Add new semester</h4>
                <form onSubmit={handleAddSemester} className="mt-4 space-y-4">
                  <input
                    value={semesterName}
                    onChange={(event) => setSemesterName(event.target.value)}
                    placeholder="Semester name"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 focus:border-sky-500 focus:outline-none"
                  />
                  <button className="rounded-2xl bg-sky-600 px-5 py-3 text-white transition hover:bg-sky-500">Add Semester</button>
                </form>
              </div>
              <div className="rounded-3xl bg-slate-50 p-6">
                <h4 className="text-lg font-semibold text-slate-900">Add new subject</h4>
                <form onSubmit={handleAddSubject} className="mt-4 space-y-4">
                  <input
                    value={subjectName}
                    onChange={(event) => setSubjectName(event.target.value)}
                    placeholder="Subject name"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 focus:border-sky-500 focus:outline-none"
                  />
                  <button className="rounded-2xl bg-sky-600 px-5 py-3 text-white transition hover:bg-sky-500">Save Subject</button>
                </form>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
              <h4 className="text-lg font-semibold text-slate-900">Current subjects</h4>
              {subjects.length === 0 ? (
                <p className="mt-4 text-slate-600">No subjects created yet.</p>
              ) : (
                <div className="mt-4 grid gap-3">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="rounded-3xl bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">{subject.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case "system":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-900">System information</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
                <p className="font-semibold text-slate-900">Active subjects</p>
                <p className="mt-3 text-slate-600">{subjects.length}</p>
              </div>
              <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
                <p className="font-semibold text-slate-900">Active semesters</p>
                <p className="mt-3 text-slate-600">{semesters.length}</p>
              </div>
            </div>
          </div>
        );
      case "logs":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-900">System logs</h3>
            <div className="rounded-3xl bg-slate-50 p-6 text-slate-600">
              <p>Log messages are not available in this demo UI yet.</p>
              <p className="mt-4">When connected to a real audit service, this view shows recent admin actions, login attempts, and grade changes.</p>
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
              <p className="mt-2 text-slate-600">Role: {profile.role}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-7xl min-h-[calc(100vh-48px)] flex-col gap-6 lg:flex-row">
        <Sidebar
          title="FGBI Admin"
          menuItems={adminMenu}
          activeKey={activeTab}
          onSelect={setActiveTab}
          profile={profile}
          onSignOut={handleSignOut}
        />

        <div className="flex-1 space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Admin panel</p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-900">{profile.full_name}</h1>
                <p className="mt-2 text-slate-600">Manage students, teachers, subjects, enrollment, and system settings.</p>
              </div>
            </div>
          </section>

          {message ? <div className="rounded-3xl bg-emerald-50 p-4 text-emerald-800 shadow-sm">{message}</div> : null}
          {error ? <div className="rounded-3xl bg-rose-50 p-4 text-rose-800 shadow-sm">{error}</div> : null}

          <section className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200 sm:p-8">{renderActivePane()}</section>
        </div>
      </div>
    </main>
  );
}
