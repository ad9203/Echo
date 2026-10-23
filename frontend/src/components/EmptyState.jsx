import React from "react";
import { StickyNote, Search, Archive, Trash2, Heart, Plus } from "lucide-react";

const EmptyState = ({ searchQuery, view, onCreateNote }) => {
  let title = "No notes yet";
  let description = "Create your first note or use Wispr Flow voice dictation to capture thoughts.";
  let Icon = StickyNote;

  if (searchQuery) {
    Icon = Search;
    title = "No results found";
    description = `No notes matched "${searchQuery}". Try a different keyword or category.`;
  } else if (view === "favorites") {
    Icon = Heart;
    title = "No favorites starred";
    description = "Click the heart icon on any note to keep your most important thoughts here.";
  } else if (view === "archived") {
    Icon = Archive;
    title = "Archive is empty";
    description = "Notes you archive will be neatly stored here away from your active desk.";
  } else if (view === "trash") {
    Icon = Trash2;
    title = "Trash is empty";
    description = "Soft-deleted notes will appear here where you can restore or permanently remove them.";
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl glass-card border border-white/5 my-8">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-500/20 text-purple-400 mb-4 shadow-inner">
        <Icon size={32} />
      </div>

      <h3 className="text-lg md:text-xl font-semibold text-white mb-2 tracking-tight">
        {title}
      </h3>

      <p className="text-xs md:text-sm text-gray-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {view === "active" && !searchQuery && onCreateNote && (
        <button
          onClick={onCreateNote}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs md:text-sm font-medium shadow-lg shadow-purple-600/20 transition-all hover:scale-105"
        >
          <Plus size={16} />
          <span>Create First Note</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
