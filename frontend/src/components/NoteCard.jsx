import React, { useState, useRef, useEffect } from "react";
import {
  Code2,
  Leaf,
  Briefcase,
  GraduationCap,
  Lightbulb,
  ShoppingCart,
  FileText,
  MoreHorizontal,
  Calendar,
  Clock,
  Pin,
  Heart,
  Archive,
  ArchiveRestore,
  Trash2,
  RotateCcw,
  X,
} from "lucide-react";

// Explicit category styling for both Light Mode and Dark Mode
const CATEGORY_MAP = {
  Programming: {
    icon: Code2,
    color: "#8b5cf6",
    label: "PROGRAMMING",
    badgeClasses: "bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300",
    cardClasses: "bg-white dark:bg-[#12111c] border-purple-200 dark:border-purple-500/40 hover:border-purple-400 dark:hover:border-purple-500/80 shadow-sm dark:shadow-[0_4px_20px_rgba(139,92,246,0.1)]",
    activeAccent: "border-l-4 !border-l-purple-500 dark:!border-l-purple-400",
  },
  Personal: {
    icon: Leaf,
    color: "#10b981",
    label: "PERSONAL",
    badgeClasses: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300",
    cardClasses: "bg-white dark:bg-[#101915] border-emerald-200 dark:border-emerald-500/40 hover:border-emerald-400 dark:hover:border-emerald-500/80 shadow-sm dark:shadow-[0_4px_20px_rgba(16,185,129,0.1)]",
    activeAccent: "border-l-4 !border-l-emerald-500 dark:!border-l-emerald-400",
  },
  Work: {
    icon: Briefcase,
    color: "#3b82f6",
    label: "WORK",
    badgeClasses: "bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300",
    cardClasses: "bg-white dark:bg-[#10141f] border-blue-200 dark:border-blue-500/40 hover:border-blue-400 dark:hover:border-blue-500/80 shadow-sm dark:shadow-[0_4px_20px_rgba(59,130,246,0.1)]",
    activeAccent: "border-l-4 !border-l-blue-500 dark:!border-l-blue-400",
  },
  Study: {
    icon: GraduationCap,
    color: "#f59e0b",
    label: "STUDY",
    badgeClasses: "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300",
    cardClasses: "bg-white dark:bg-[#1a1710] border-amber-200 dark:border-amber-500/40 hover:border-amber-400 dark:hover:border-amber-500/80 shadow-sm dark:shadow-[0_4px_20px_rgba(245,158,11,0.1)]",
    activeAccent: "border-l-4 !border-l-amber-500 dark:!border-l-amber-400",
  },
  Ideas: {
    icon: Lightbulb,
    color: "#ef4444",
    label: "IDEAS",
    badgeClasses: "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300",
    cardClasses: "bg-white dark:bg-[#1a1114] border-rose-200 dark:border-rose-500/40 hover:border-rose-400 dark:hover:border-rose-500/80 shadow-sm dark:shadow-[0_4px_20px_rgba(239,68,68,0.1)]",
    activeAccent: "border-l-4 !border-l-rose-500 dark:!border-l-rose-400",
  },
  Shopping: {
    icon: ShoppingCart,
    color: "#ec4899",
    label: "SHOPPING",
    badgeClasses: "bg-pink-100 text-pink-700 dark:bg-pink-950/70 dark:text-pink-300",
    cardClasses: "bg-white dark:bg-[#1a1118] border-pink-200 dark:border-pink-500/40 hover:border-pink-400 dark:hover:border-pink-500/80 shadow-sm dark:shadow-[0_4px_20px_rgba(236,72,153,0.1)]",
    activeAccent: "border-l-4 !border-l-pink-500 dark:!border-l-pink-400",
  },
  General: {
    icon: FileText,
    color: "#6b7280",
    label: "GENERAL",
    badgeClasses: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    cardClasses: "bg-white dark:bg-[#12131b] border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 shadow-sm",
    activeAccent: "border-l-4 !border-l-slate-400 dark:!border-l-slate-300",
  },
};

const getSnippet = (content, details) => {
  if (details && typeof details === "string" && details.trim() !== "Add a description...") {
    return details;
  }
  if (!Array.isArray(content) || content.length === 0) return "No description added yet.";

  const textSnippets = [];
  for (const block of content) {
    if (Array.isArray(block.content)) {
      for (const item of block.content) {
        if (item.text) textSnippets.push(item.text);
      }
    }
  }

  return textSnippets.join(" ") || "No description added yet.";
};

const NoteCard = ({
  note,
  onSelectNote,
  isSelected,
  togglePin,
  toggleFavorite,
  toggleArchive,
  view,
  moveToTrash,
  restoreNote,
  permanentlyDeleteNote,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const noteId = note._id || note.id;
  const isPinned = note.isPinned ?? note.pinned ?? false;
  const isFavorite = note.isFavorite ?? note.favorite ?? false;
  const preview = getSnippet(note.content, note.details);

  const catStyle = CATEGORY_MAP[note.category] || CATEGORY_MAP.General;
  const CatIcon = catStyle.icon;

  const dateObj = note.createdAt || note.updatedAt ? new Date(note.createdAt || note.updatedAt) : new Date();
  const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  return (
    <div
      onClick={() => onSelectNote && onSelectNote(note)}
      className={`relative p-4 md:p-5 rounded-3xl border transition-all duration-200 cursor-pointer ${
        catStyle.cardClasses
      } ${
        isSelected
          ? `${catStyle.activeAccent} ring-1 ring-purple-500/50 dark:ring-purple-400/50 !bg-purple-50/40 dark:!bg-[#181527]`
          : ""
      }`}
    >
      {/* Top Row: Category Icon + Badge & Three Dots Menu */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: `${catStyle.color}25`, color: catStyle.color }}
          >
            <CatIcon size={14} />
          </div>
          <span
            className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md ${catStyle.badgeClasses}`}
          >
            {catStyle.label}
          </span>
          {isPinned && (
            <Pin size={12} className="text-purple-600 dark:text-purple-400 fill-current" title="Pinned" />
          )}
          {isFavorite && (
            <Heart size={12} className="text-pink-600 dark:text-pink-400 fill-current" title="Favorite" />
          )}
        </div>

        {/* Three Dots Menu Button */}
        <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Options"
          >
            <MoreHorizontal size={18} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-1 w-44 rounded-2xl bg-white dark:bg-[#181926] border border-slate-200 dark:border-white/10 shadow-xl z-30 p-1.5 text-xs text-slate-700 dark:text-slate-200 animate-fade-in">
              {view !== "trash" ? (
                <>
                  <button
                    onClick={() => {
                      togglePin(noteId);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <Pin size={14} className={isPinned ? "fill-current text-purple-500" : ""} />
                    <span>{isPinned ? "Unpin Note" : "Pin to Top"}</span>
                  </button>

                  <button
                    onClick={() => {
                      toggleFavorite(noteId);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <Heart size={14} className={isFavorite ? "fill-current text-pink-500" : ""} />
                    <span>{isFavorite ? "Remove Favorite" : "Add to Favorites"}</span>
                  </button>

                  <button
                    onClick={() => {
                      toggleArchive(noteId);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {view === "archived" ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                    <span>{view === "archived" ? "Unarchive" : "Archive"}</span>
                  </button>

                  <button
                    onClick={() => {
                      moveToTrash(noteId);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Move to Trash</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      restoreNote(noteId);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    <span>Restore Note</span>
                  </button>

                  <button
                    onClick={() => {
                      permanentlyDeleteNote(noteId);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <X size={14} />
                    <span>Delete Permanently</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Note Title */}
      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-1 truncate">
        {note.title || "Untitled Note"}
      </h3>

      {/* Description Snippet */}
      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
        {preview}
      </p>

      {/* Footer Timestamp: Calendar Date • Clock Time */}
      <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium pt-2 border-t border-slate-100 dark:border-white/5">
        <span className="flex items-center gap-1">
          <Calendar size={12} />
          <span>{dateStr}</span>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Clock size={12} />
          <span>{timeStr}</span>
        </span>
      </div>
    </div>
  );
};

export default NoteCard;
