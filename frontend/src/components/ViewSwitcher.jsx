import React from "react";
import { StickyNote, Archive, Trash2, Heart } from "lucide-react";

const ViewSwitcher = ({ view, setView, counts = {} }) => {
  const tabs = [
    { id: "active", label: "Notes", icon: StickyNote, count: counts.active },
    { id: "favorites", label: "Favorites", icon: Heart, count: counts.favorites },
    { id: "archived", label: "Archived", icon: Archive, count: counts.archived },
    { id: "trash", label: "Trash", icon: Trash2, count: counts.trash },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-2xl glass-panel w-full sm:w-auto overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = view === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              isActive
                ? "bg-purple-600/30 text-white border border-purple-500/40 shadow-md"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Icon size={15} className={isActive ? "text-purple-300" : ""} />
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? "bg-purple-500/40 text-white"
                    : "bg-white/10 text-gray-400"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ViewSwitcher;
