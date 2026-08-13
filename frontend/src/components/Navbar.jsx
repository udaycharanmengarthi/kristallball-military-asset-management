import { LogOut, Radar } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS, ROLE_BADGE_CLASSES } from "../utils/format";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-ink-600 bg-ink-850/80 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-brass-600/40 bg-brass-500/10">
          <Radar className="h-5 w-5 text-brass-400" strokeWidth={1.75} />
        </div>
        <div className="leading-tight">
          <div className="font-mono text-sm font-semibold tracking-widest2 text-mist-50">
            KRISTALLBALL
          </div>
          <div className="text-[11px] text-mist-400">Asset Management System</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <>
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium text-mist-50">
                {user.fullName || user.username}
              </div>
              <div className="flex items-center justify-end gap-2">
                <span
                  className={`rounded border px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-widest2 ${
                    ROLE_BADGE_CLASSES[user.role] || "border-ink-600 text-mist-300"
                  }`}
                >
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-mist-200 transition hover:border-rust-500/50 hover:text-rust-400"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
