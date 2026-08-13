import { Outlet } from "react-router-dom";
import ClassificationBanner from "./ClassificationBanner";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function AppShell() {
  return (
    <div className="flex h-screen flex-col bg-ink-900">
      <ClassificationBanner />
      <Navbar />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <Sidebar />
        <main className="grid-texture flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
