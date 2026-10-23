import React from "react";
import {
  StickyNote,
  Heart,
  Archive,
  Trash2,
  Sun,
  Moon,
  ChevronRight,
  NotebookPen,
  X,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const CATEGORIES = [
  { id: "All", name: "All", dot: "#8b5cf6" },
  { id: "General", name: "General", dot: "#a855f7" },
  { id: "Personal", name: "Personal", dot: "#10b981" },
  { id: "Work", name: "Work", dot: "#3b82f6" },
  { id: "Study", name: "Study", dot: "#f59e0b" },
  { id: "Programming", name: "Programming", dot: "#6366f1" },
  { id: "Ideas", name: "Ideas", dot: "#f43f5e" },
  { id: "Shopping", name: "Shopping", dot: "#ec4899" },
];

const Sidebar = ({
  view,
  setView,
  categoryFilter,
  setCategoryFilter,
  counts = {},
  isOpen,
  onClose,
}) => {
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: "active", label: "Notes", icon: StickyNote, count: counts.active },
    { id: "favorites", label: "Favorites", icon: Heart, count: counts.favorites },
    { id: "archived", label: "Archived", icon: Archive, count: counts.archived },
    { id: "trash", label: "Trash", icon: Trash2, count: counts.trash },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-72 sm:w-64 md:w-60 lg:w-64 2xl:w-72 bg-white dark:bg-[#0d0e15] border-r border-slate-200 dark:border-white/10 flex flex-col justify-between p-4 md:p-5 transition-transform duration-300 lg:static lg:translate-x-0 ${
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      }`}
    >
      <div>
        {/* Brand Header & Mobile Close */}
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <NotebookPen size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Echo
              </h1>
              <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                Notes to build u notes
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Close sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Primary Views (Notes, Favorites, Archived, Trash) */}
        <div className="space-y-1 mb-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 dark:border dark:border-purple-500/30 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={17}
                    className={
                      isActive
                        ? "text-purple-600 dark:text-purple-300"
                        : "text-slate-400 dark:text-slate-500"
                    }
                  />
                  <span>{item.label}</span>
                </div>

                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isActive
                        ? "bg-purple-200 text-purple-800 dark:bg-purple-800/40 dark:text-purple-200"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Categories Section */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
            Categories
          </div>
          <div className="space-y-0.5">
            {CATEGORIES.map((cat) => {
              const isActive = categoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCategoryFilter(cat.id);
                    if (onClose) onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-2xl text-sm transition-all cursor-pointer ${
                    isActive
                      ? "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: cat.dot }}
                  />
                  <span className="truncate">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Actions (Dark/Light Switcher) */}
      <div className="pt-4 border-t border-slate-200 dark:border-white/10">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#141522] hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-sm font-medium transition-all shadow-sm cursor-pointer"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          <div className="flex items-center gap-2.5">
            {theme === "dark" ? (
              <Sun size={18} className="text-amber-400" />
            ) : (
              <Sun size={18} className="text-slate-500" />
            )}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </div>
          <ChevronRight size={16} className="text-slate-400 dark:text-slate-500" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
