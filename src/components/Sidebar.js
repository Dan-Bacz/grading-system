"use client";

export default function Sidebar({ title, menuItems, activeKey, onSelect, profile, onSignOut }) {
  return (
    <aside className="w-full max-w-[280px] shrink-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-600">{title}</p>
        <h2 className="mt-4 text-2xl font-semibold text-slate-900">{profile?.full_name || "User"}</h2>
        <p className="mt-2 text-sm text-slate-600">Role: {profile?.role || "-"}</p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
              activeKey === item.key ? "bg-sky-600 text-white" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-8 rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
        <p>Quick actions</p>
        <p className="mt-2">Use the menu to switch between admin tools.</p>
      </div>

      <button
        type="button"
        onClick={onSignOut}
        className="mt-6 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Sign Out
      </button>
    </aside>
  );
}
