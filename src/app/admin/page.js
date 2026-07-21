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

function polarToCartesian(cx, cy, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180);
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function describePieSlice(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

function SimpleBarChart({ data }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="mt-6 space-y-4 rounded-[20px] border border-slate-800/80 bg-[#0b1016] p-4">
      {data.map((item) => {
        const height = Math.max(44, (item.value / maxValue) * 100);

        return (
          <div key={item.label}>
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>{item.label}</span>
              <span className="font-semibold text-white">{item.value}</span>
            </div>
            <div className="mt-2 flex h-24 items-end rounded-2xl border border-slate-700/70 bg-slate-900/70 p-2">
              <div className="relative h-full w-full">
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t-[14px] border border-slate-600/70"
                  style={{
                    height: `${height}%`,
                    background: `linear-gradient(145deg, ${item.color}, #111827)`,
                    boxShadow: `0 14px 24px rgba(0, 0, 0, 0.35)`,
                    transform: 'perspective(300px) rotateX(8deg)',
                  }}
                />
                <div
                  className="absolute bottom-0 left-0 right-0 h-3 rounded-t-[14px]"
                  style={{
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.2), transparent)',
                  }}
                />
                <div
                  className="absolute bottom-0 right-0 top-0 w-3 rounded-r-[14px]"
                  style={{
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.16), rgba(0,0,0,0.28))',
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SimplePieChart({ data, title }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 48;
  let currentAngle = 0;

  if (total === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-700 bg-[#0b1016] p-6 text-center text-sm text-slate-400">
        No {title.toLowerCase()} data yet.
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-center">
      <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-[#0b1016] p-2 shadow-[0_20px_35px_rgba(0,0,0,0.35)]">
        <svg viewBox="0 0 140 140" className="h-40 w-40">
          <defs>
            <filter id="pie-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="4" floodColor="rgba(0,0,0,0.45)" />
            </filter>
          </defs>
          <ellipse cx="70" cy="104" rx="34" ry="10" fill="rgba(0,0,0,0.35)" />
          {data.map((item) => {
            const segmentAngle = (item.value / total) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + segmentAngle;
            currentAngle = endAngle;

            return (
              <path
                key={item.label}
                d={describePieSlice(70, 70, 48, startAngle, endAngle)}
                fill={item.color}
                filter="url(#pie-shadow)"
              />
            );
          })}
          <circle cx="70" cy="70" r="30" fill="#0b1016" stroke="rgba(148,163,184,0.25)" strokeWidth="1.5" />
          <circle cx="70" cy="70" r="18" fill="rgba(255,255,255,0.06)" />
        </svg>
      </div>
      <div className="flex-1 space-y-3">
        {data.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.label}</span>
            </div>
            <span className="font-semibold text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      setMessage(result.message || 'Approved successfully.');
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
      <main className="min-h-screen bg-[#0b1016] p-6">
        <div className="mx-auto max-w-xl rounded-[32px] border border-slate-800 bg-[#0b1016] p-10 text-center shadow-2xl shadow-[#04070c]/40 backdrop-blur">
          <p className="text-slate-300">Loading admin dashboard…</p>
        </div>
      </main>
    );
  }

  const roleBreakdown = [
    { label: "Pending approvals", value: pendingUsers.length, color: "#38bdf8" },
    { label: "Teachers", value: teachers.length, color: "#818cf8" },
    { label: "Students", value: students.length, color: "#34d399" },
  ];

  const gradeBreakdown = [
    { label: "A (90+)", value: grades.filter((grade) => Number(grade.score) >= 90).length, color: "#22c55e" },
    { label: "B (80-89)", value: grades.filter((grade) => Number(grade.score) >= 80 && Number(grade.score) < 90).length, color: "#38bdf8" },
    { label: "C (70-79)", value: grades.filter((grade) => Number(grade.score) >= 70 && Number(grade.score) < 80).length, color: "#f59e0b" },
    { label: "D/F", value: grades.filter((grade) => Number(grade.score) < 70).length, color: "#f43f5e" },
  ];

  const renderActivePane = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
                <p className="text-sm text-slate-400">Pending approvals</p>
                <p className="mt-4 text-3xl font-semibold text-white">{pendingUsers.length}</p>
              </div>
              <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
                <p className="text-sm text-slate-400">Teachers</p>
                <p className="mt-4 text-3xl font-semibold text-white">{teachers.length}</p>
              </div>
              <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
                <p className="text-sm text-slate-400">Students</p>
                <p className="mt-4 text-3xl font-semibold text-white">{students.length}</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
                <h3 className="text-xl font-semibold text-white">Account activity</h3>
                <SimpleBarChart data={roleBreakdown} />
              </div>
              <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
                <h3 className="text-xl font-semibold text-white">Role distribution</h3>
                <SimplePieChart data={roleBreakdown} title="role distribution" />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
                <h3 className="text-xl font-semibold text-white">Grade performance</h3>
                <SimplePieChart data={gradeBreakdown} title="grade performance" />
              </div>
              <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
                <h3 className="text-xl font-semibold text-white">Quick summary</h3>
                <p className="mt-3 text-slate-400">Use the sidebar to manage approvals, faculty, subjects, and student enrollment for each semester.</p>
                <div className="mt-6 space-y-3 text-sm text-slate-400">
                  <div className="rounded-2xl border border-slate-800 bg-[#0b1016] p-3">{pendingUsers.length} accounts need review.</div>
                  <div className="rounded-2xl border border-slate-800 bg-[#0b1016] p-3">{grades.length} grade entries are currently available.</div>
                  <div className="rounded-2xl border border-slate-800 bg-[#0b1016] p-3">{subjects.length} subjects and {semesters.length} semesters are configured.</div>
                </div>
              </div>
            </div>
          </div>
        );
      case "approve":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Pending accounts</h3>
            {pendingUsers.length === 0 ? (
              <p className="text-slate-400">No pending accounts right now.</p>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map((user) => (
                  <div key={user.user_id} className="rounded-3xl border border-slate-800 bg-[#0b1016] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-white">{user.full_name}</p>
                        <p className="text-sm text-slate-400">{user.email} · {user.role}</p>
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
            <h3 className="text-xl font-semibold text-white">Faculty list</h3>
            {teachers.length === 0 ? (
              <p className="text-slate-400">No teachers have been created yet.</p>
            ) : (
              <div className="grid gap-4">
                {teachers.map((teacher) => (
                  <div key={teacher.user_id} className="rounded-3xl border border-slate-800 bg-black p-4">
                    <p className="font-semibold text-white">{teacher.full_name}</p>
                    <p className="text-sm text-slate-400">Subject: {teacher.assigned_subject || "Not assigned"}</p>
                    <p className="text-sm text-slate-400">Email: {teacher.email}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "students":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Student list</h3>
            {students.length === 0 ? (
              <p className="text-slate-400">No students are active yet.</p>
            ) : (
              <div className="grid gap-4">
                {students.map((student) => (
                  <div key={student.user_id} className="rounded-3xl border border-slate-800 bg-black p-4">
                    <p className="font-semibold text-white">{student.full_name}</p>
                    <p className="text-sm text-slate-400">Email: {student.email}</p>
                    <p className="text-sm text-slate-400">Status: {student.status}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "grades":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Grades overview</h3>
            {grades.length === 0 ? (
              <p className="text-slate-400">No grades have been entered yet.</p>
            ) : (
              <div className="space-y-4">
                {grades.map((grade) => (
                  <div key={grade.id} className="rounded-3xl border border-slate-800 bg-black p-4">
                    <p className="font-semibold text-white">Subject: {grade.subject}</p>
                    <p className="text-sm text-slate-400">Student ID: {grade.student_id}</p>
                    <p className="text-sm text-slate-400">Teacher ID: {grade.teacher_id}</p>
                    <p className="text-sm text-slate-400">Score: {grade.score}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "enrollment":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Enrollment and semesters</h3>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
                <h4 className="text-lg font-semibold text-white">Add new semester</h4>
                <form onSubmit={handleAddSemester} className="mt-4 space-y-4">
                  <input
                    value={semesterName}
                    onChange={(event) => setSemesterName(event.target.value)}
                    placeholder="Semester name"
                    className="w-full rounded-2xl border border-slate-700 bg-black px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                  />
                  <button className="rounded-2xl bg-sky-600 px-5 py-3 text-white transition hover:bg-sky-500">Add Semester</button>
                </form>
              </div>
              <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
                <h4 className="text-lg font-semibold text-white">Add new subject</h4>
                <form onSubmit={handleAddSubject} className="mt-4 space-y-4">
                  <input
                    value={subjectName}
                    onChange={(event) => setSubjectName(event.target.value)}
                    placeholder="Subject name"
                    className="w-full rounded-2xl border border-slate-700 bg-black px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                  />
                  <button className="rounded-2xl bg-sky-600 px-5 py-3 text-white transition hover:bg-sky-500">Save Subject</button>
                </form>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
              <h4 className="text-lg font-semibold text-white">Current subjects</h4>
              {subjects.length === 0 ? (
                <p className="mt-4 text-slate-400">No subjects created yet.</p>
              ) : (
                <div className="mt-4 grid gap-3">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="rounded-3xl border border-slate-800 bg-black p-4">
                      <p className="font-semibold text-white">{subject.name}</p>
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
            <h3 className="text-xl font-semibold text-white">System information</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
                <p className="font-semibold text-white">Active subjects</p>
                <p className="mt-3 text-slate-400">{subjects.length}</p>
              </div>
              <div className="rounded-[24px] border border-slate-800 bg-black p-6 shadow-2xl shadow-black/30 backdrop-blur">
                <p className="font-semibold text-white">Active semesters</p>
                <p className="mt-3 text-slate-400">{semesters.length}</p>
              </div>
            </div>
          </div>
        );
      case "logs":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">System logs</h3>
            <div className="rounded-[24px] border border-slate-800 bg-black p-6 text-slate-400 shadow-2xl shadow-black/30 backdrop-blur">
              <p>Log messages are not available in this demo UI yet.</p>
              <p className="mt-4">When connected to a real audit service, this view shows recent admin actions, login attempts, and grade changes.</p>
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
              <p className="mt-2 text-slate-400">Role: {profile.role}</p>
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
        <div className="flex items-center justify-between gap-4 rounded-[24px] border border-slate-800 bg-[#0b1016] p-4 shadow-2xl shadow-[#04070c]/40 backdrop-blur lg:hidden">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-400">FGBI Admin</p>
            <h1 className="mt-2 text-xl font-semibold text-white">{profile.full_name}</h1>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-2xl border border-slate-700 bg-[#0b1016] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-900"
          >
            Menu
          </button>
        </div>

        <div className="relative lg:block">
          <div
            className={`fixed inset-0 z-40 bg-slate-950/50 transition-opacity lg:hidden ${
              sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
            }`}
            onClick={() => setSidebarOpen(false)}
          />

          <div
            className={`fixed inset-y-0 left-0 z-50 w-[86vw] max-w-xs overflow-y-auto bg-transparent p-4 transition-transform duration-300 lg:static lg:block lg:translate-x-0 lg:w-full lg:max-w-none lg:p-0 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <Sidebar
              title="FGBI Admin"
              menuItems={adminMenu}
              activeKey={activeTab}
              onSelect={(key) => {
                setActiveTab(key);
                setSidebarOpen(false);
              }}
              profile={profile}
              onSignOut={handleSignOut}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>

        <div className="flex-1 space-y-6 lg:ml-[0px]">
          <section className="rounded-[28px] border border-slate-800 bg-[#0b1016] p-6 shadow-2xl shadow-[#04070c]/40 backdrop-blur sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-sky-400">Admin panel</p>
                <h1 className="mt-3 text-3xl font-semibold text-white">{profile.full_name}</h1>
                <p className="mt-2 text-slate-400">Manage students, teachers, subjects, enrollment, and system settings.</p>
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
