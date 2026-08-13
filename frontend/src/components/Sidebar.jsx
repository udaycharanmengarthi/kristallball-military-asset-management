import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  ArrowLeftRight,
  UserCheck,
  Flame,
  ScrollText,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: null },
  { to: "/assets", label: "Assets", icon: Boxes, roles: null },
  {
    to: "/purchases",
    label: "Purchases",
    icon: ShoppingCart,
    roles: ["ADMIN", "LOGISTICS_OFFICER", "BASE_COMMANDER"],
  },
  {
    to: "/transfers",
    label: "Transfers",
    icon: ArrowLeftRight,
    roles: ["ADMIN", "LOGISTICS_OFFICER", "BASE_COMMANDER"],
  },
  {
    to: "/assignments",
    label: "Assignments",
    icon: UserCheck,
    roles: ["ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"],
  },
  {
    to: "/expenditures",
    label: "Expenditures",
    icon: Flame,
    roles: ["ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"],
  },
  { to: "/audit-logs", label: "Audit Logs", icon: ScrollText, roles: null },
];

export default function Sidebar() {
  const { user } = useAuth();

  const items = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user?.role));

  return (
    <>
      {/* Mobile: horizontal scrollable tab strip */}
      <nav className="flex gap-1 overflow-x-auto border-b border-ink-600 bg-ink-850/60 px-2 py-2 md:hidden">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition ${
                isActive
                  ? "bg-brass-500/10 text-brass-300"
                  : "text-mist-300 hover:bg-ink-800 hover:text-mist-50"
              }`
            }
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Desktop: fixed vertical sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-ink-600 bg-ink-850/60 md:flex">
        <nav className="flex-1 space-y-1 p-3">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${
                  isActive
                    ? "bg-brass-500/10 text-brass-300"
                    : "text-mist-300 hover:bg-ink-800 hover:text-mist-50"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-brass-500 transition-opacity ${
                      isActive ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                  <span className="font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink-600 p-4">
          <div className="rounded-md border border-ink-600 bg-ink-800 p-3">
            <div className="font-mono text-[10px] uppercase tracking-widest2 text-mist-400">
              Access Scope
            </div>
            <div className="mt-1 text-xs text-mist-200">
              {user?.role === "ADMIN" && "Global — all bases"}
              {user?.role === "BASE_COMMANDER" && "Single base — assigned only"}
              {user?.role === "LOGISTICS_OFFICER" && "Cross-base movement operations"}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
