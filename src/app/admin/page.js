"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminPage() {
  const [profile, setProfile] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [assignedSubject, setAssignedSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function refreshLists() {
    const [{ data: pending }, { data: teacherData }, { data: studentData }] = await Promise.all([
      supabase.from("profiles").select("*").eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("role", "teacher").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("role", "student").order("created_at", { ascending: false }),
    ]);

    setPendingUsers(pending || []);
    setTeachers(teacherData || []);
    setStudents(studentData || []);
  }

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
      await refreshLists();
      setLoading(false);
    }

    loadAdmin();
  }, [router]);

  async function approveUser(userId) {
    setMessage("");
    const { error } = await supabase.from("profiles").update({ status: "active" }).eq("user_id", userId);
    if (error) {
      setError(error.message);
      return;
    }
    await refreshLists();
    setMessage("Approved successfully.");
  }

  async function assignSubject(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!selectedTeacher || !assignedSubject) {
      setError("Select a teacher and a subject.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ assigned_subject: assignedSubject, status: "active" })
      .eq("user_id", selectedTeacher);

    if (error) {
      setError(error.message);
      return;
    }

    await refreshLists();
    setMessage("Subject assigned to teacher.");
    setAssignedSubject("");
    setSelectedTeacher("");
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

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-3xl bg-white p-8 shadow-xl shadow-slate-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Admin Panel</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">{profile.full_name}</h1>
            </div>
            <p className="rounded-2xl bg-slate-100 px-4 py-2 text-slate-700">Manage system users and subject assignments</p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Approve accounts</h2>
            <p className="mt-2 text-slate-600">Review pending teacher and student accounts.</p>

            <div className="mt-6 space-y-4">
              {pendingUsers.length === 0 ? (
                <p className="text-slate-600">No pending accounts at the moment.</p>
              ) : (
                pendingUsers.map((user) => (
                  <div key={user.user_id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{user.full_name}</p>
                        <p className="text-sm text-slate-600">{user.email} · {user.role}</p>
                      </div>
                      <button
                        onClick={() => approveUser(user.user_id)}
                        className="rounded-2xl bg-sky-600 px-4 py-2 text-white transition hover:bg-sky-500"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Assign teacher subject</h2>
            <p className="mt-2 text-slate-600">Give teachers their subject and activate their accounts.</p>

            <form onSubmit={assignSubject} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Teacher</span>
                <select
                  value={selectedTeacher}
                  onChange={(event) => setSelectedTeacher(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none"
                >
                  <option value="">Select a teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.user_id} value={teacher.user_id}>
                      {teacher.full_name} {teacher.assigned_subject ? `(${teacher.assigned_subject})` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Subject</span>
                <input
                  value={assignedSubject}
                  onChange={(event) => setAssignedSubject(event.target.value)}
                  placeholder="e.g. Science"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-sky-500 focus:outline-none"
                />
              </label>

              <button className="rounded-2xl bg-sky-600 px-5 py-3 text-white transition hover:bg-sky-500">
                Assign Subject
              </button>
            </form>

            {message ? <p className="mt-4 text-sm text-slate-700">{message}</p> : null}
            {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Active students</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {students.length === 0 ? (
              <p className="text-slate-600">No students created yet.</p>
            ) : (
              students.map((student) => (
                <div key={student.user_id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{student.full_name}</p>
                  <p className="text-sm text-slate-600">{student.email}</p>
                  <p className="text-sm text-slate-600">Status: {student.status}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
