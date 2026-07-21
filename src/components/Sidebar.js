"use client";

export default function Sidebar({ title, menuItems, activeKey, onSelect, profile, onSignOut, onClose }) {
  return (
    <aside className="w-full max-w-full lg:w-[280px] lg:max-w-[280px] shrink-0">
      <div className="relative rounded-[28px] border border-slate-800 bg-black p-4 shadow-2xl shadow-black/30 backdrop-blur sm:p-6">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-sky-400">{title}</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">{profile?.full_name || "User"}</h2>
            <p className="mt-2 text-sm text-slate-400">Role: {profile?.role || "-"}</p>
          </div>
          {onClose ? (
            <button
              type="button"
              className="lg:hidden rounded-2xl border border-slate-700 bg-black px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
              onClick={onClose}
            >
              Close
            </button>
          ) : null}
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                activeKey === item.key ? "bg-sky-600 text-white shadow-lg shadow-sky-600/20" : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-8 rounded-3xl border border-slate-800 bg-black p-4 text-sm text-slate-400">
          <p className="font-medium text-slate-200">Quick actions</p>
          <p className="mt-2">Use the menu to switch between your dashboard views.</p>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className="mt-6 w-full rounded-2xl border border-slate-700 bg-black px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-900"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
