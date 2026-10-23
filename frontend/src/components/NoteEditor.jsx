import React, { useEffect, useState, useRef, useCallback } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import {
  Pin,
  Heart,
  Trash2,
  ArrowLeft,
  Check,
  ChevronDown,
  FileText,
  MoreVertical,
  Code2,
  Leaf,
  Briefcase,
  GraduationCap,
  Lightbulb,
  ShoppingCart,
  Folder,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

// Categories with icons and auto-assigned theme colors
const CATEGORIES = [
  { id: "General", name: "General", icon: Folder, color: "#6b7280", themeColor: "default" },
  { id: "Programming", name: "Programming", icon: Code2, color: "#8b5cf6", themeColor: "purple" },
  { id: "Personal", name: "Personal", icon: Leaf, color: "#10b981", themeColor: "green" },
  { id: "Work", name: "Work", icon: Briefcase, color: "#3b82f6", themeColor: "blue" },
  { id: "Study", name: "Study", icon: GraduationCap, color: "#f59e0b", themeColor: "yellow" },
  { id: "Ideas", name: "Ideas", icon: Lightbulb, color: "#ef4444", themeColor: "red" },
  { id: "Shopping", name: "Shopping", icon: ShoppingCart, color: "#ec4899", themeColor: "pink" },
];

export const CATEGORY_TO_COLOR = {
  Programming: "purple",
  Personal: "green",
  Work: "blue",
  Study: "yellow",
  Ideas: "red",
  Shopping: "pink",
  General: "default",
};

const NoteEditor = ({
  activeNote,
  onSaveNote,
  onClose,
  onTogglePin,
  onToggleFavorite,
  onMoveToTrash,
  onEditorReady,
}) => {
  const { theme } = useTheme();

  const [title, setTitle] = useState(activeNote?.title || "");
  const [details, setDetails] = useState(activeNote?.details || "");
  const [category, setCategory] = useState(activeNote?.category || "Programming");
  const [color, setColor] = useState(activeNote?.color || CATEGORY_TO_COLOR[activeNote?.category] || "purple");
  const [isPinned, setIsPinned] = useState(activeNote?.isPinned || false);
  const [isFavorite, setIsFavorite] = useState(activeNote?.isFavorite || false);
  const [saveStatus, setSaveStatus] = useState("Saved");

  const [isCatMenuOpen, setIsCatMenuOpen] = useState(false);

  const saveTimerRef = useRef(null);
  const catMenuRef = useRef(null);
  const currentNoteIdRef = useRef(activeNote?._id || activeNote?.id || null);

  const titleRef = useRef(activeNote?.title || "");
  const detailsRef = useRef(activeNote?.details || "");
  const categoryRef = useRef(activeNote?.category || "Programming");
  const colorRef = useRef(activeNote?.color || CATEGORY_TO_COLOR[activeNote?.category] || "purple");
  const isPinnedRef = useRef(activeNote?.isPinned || false);
  const isFavoriteRef = useRef(activeNote?.isFavorite || false);

  // Initialize BlockNote editor
  const editor = useCreateBlockNote({
    initialContent:
      activeNote?.content && activeNote.content.length > 0
        ? activeNote.content
        : [
            {
              type: "paragraph",
              content: [],
            },
          ],
  });

  // Expose editor instance
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Sync state when active note changes
  useEffect(() => {
    if (activeNote) {
      const noteId = activeNote._id || activeNote.id;
      const isDifferentNote = currentNoteIdRef.current !== noteId;
      currentNoteIdRef.current = noteId;

      const cat = activeNote.category || "Programming";
      const autoColor = CATEGORY_TO_COLOR[cat] || "purple";

      // Clear any pending debounced auto-save timer from stale edits
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      setTitle(activeNote.title || "");
      titleRef.current = activeNote.title || "";

      setDetails(activeNote.details || "");
      detailsRef.current = activeNote.details || "";

      setCategory(cat);
      categoryRef.current = cat;

      setColor(autoColor);
      colorRef.current = autoColor;

      setIsPinned(activeNote.isPinned || false);
      isPinnedRef.current = activeNote.isPinned || false;

      setIsFavorite(activeNote.isFavorite || false);
      isFavoriteRef.current = activeNote.isFavorite || false;

      // Only reload blocks when switching between different notes
      if (isDifferentNote && editor && activeNote.content && activeNote.content.length > 0) {
        try {
          editor.replaceBlocks(editor.document, activeNote.content);
        } catch (err) {
          console.warn("[BlockNote] Could not replace blocks:", err);
        }
      }
      setSaveStatus("Saved");
    }
  }, [activeNote?._id, activeNote?.id, activeNote?.title, activeNote?.category]);

  // Close category menu on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (catMenuRef.current && !catMenuRef.current.contains(e.target)) {
        setIsCatMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Debounced auto-save function (Uses refs to always persist latest title & attributes)
  const triggerSave = useCallback(
    (newTitle, newDetails, newCategory, newColor, newPinned, newFavorite) => {
      setSaveStatus("Saving...");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      saveTimerRef.current = setTimeout(() => {
        const blocks = editor?.document || [];
        onSaveNote({
          ...(activeNote || {}),
          id: activeNote?._id || activeNote?.id,
          _id: activeNote?._id || activeNote?.id,
          title: newTitle !== undefined ? newTitle : titleRef.current || "Untitled Note",
          details: newDetails !== undefined ? newDetails : detailsRef.current || "",
          content: blocks,
          category: newCategory !== undefined ? newCategory : categoryRef.current,
          color: newColor !== undefined ? newColor : colorRef.current,
          isPinned: newPinned !== undefined ? newPinned : isPinnedRef.current,
          isFavorite: newFavorite !== undefined ? newFavorite : isFavoriteRef.current,
        });
        setSaveStatus("Saved");
      }, 500);
    },
    [editor, activeNote, onSaveNote]
  );

  // Subscribe to editor content changes (Never overwrites title with stale closure)
  useEffect(() => {
    if (!editor) return;

    const unsubscribe = editor.onChange(() => {
      setSaveStatus("Unsaved changes");
      triggerSave(
        titleRef.current,
        detailsRef.current,
        categoryRef.current,
        colorRef.current,
        isPinnedRef.current,
        isFavoriteRef.current
      );
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [editor, triggerSave]);

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    titleRef.current = val;
    triggerSave(val, detailsRef.current, categoryRef.current, colorRef.current, isPinnedRef.current, isFavoriteRef.current);
  };

  const handleDetailsChange = (e) => {
    const val = e.target.value;
    setDetails(val);
    detailsRef.current = val;
    triggerSave(titleRef.current, val, categoryRef.current, colorRef.current, isPinnedRef.current, isFavoriteRef.current);
  };

  // When a category is selected, the color is automatically assigned and saved
  const handleSelectCategory = (catId) => {
    const autoColor = CATEGORY_TO_COLOR[catId] || "default";
    setCategory(catId);
    setColor(autoColor);
    setIsCatMenuOpen(false);
    triggerSave(title, details, catId, autoColor, isPinned, isFavorite);
  };

  const handleTogglePin = () => {
    const updated = !isPinned;
    setIsPinned(updated);
    if (activeNote?._id && onTogglePin) {
      onTogglePin(activeNote._id);
    }
    triggerSave(title, details, category, color, updated, isFavorite);
  };

  const handleToggleFavorite = () => {
    const updated = !isFavorite;
    setIsFavorite(updated);
    if (activeNote?._id && onToggleFavorite) {
      onToggleFavorite(activeNote._id);
    }
    triggerSave(title, details, category, color, isPinned, updated);
  };

  const currentCat = CATEGORIES.find((c) => c.id === category) || CATEGORIES[1];
  const CatIcon = currentCat.icon;

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#0f101a] rounded-2xl md:rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden transition-colors duration-200">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-3.5 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01] shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
              title="Back to notes list"
            >
              <ArrowLeft size={13} />
              <span>Notes</span>
            </button>
          )}

          {/* Category Dropdown Pill (Color applies automatically) */}
          <div className="relative" ref={catMenuRef}>
            <button
              onClick={() => setIsCatMenuOpen(!isCatMenuOpen)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161725] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm cursor-pointer"
              title="Change category (color applies automatically)"
            >
              <CatIcon size={14} style={{ color: currentCat.color }} />
              <span>{currentCat.name}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {isCatMenuOpen && (
              <div className="absolute left-0 mt-2 w-48 rounded-2xl bg-white dark:bg-[#181926] border border-slate-200 dark:border-white/10 shadow-2xl z-30 p-1.5 animate-fade-in">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Select Category
                </div>
                {CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCategory(c.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                        category === c.id
                          ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={14} style={{ color: c.color }} />
                        <span>{c.name}</span>
                      </div>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Tools (Saved Status, Pin, Favorite, Trash, More) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 text-slate-500 dark:text-slate-400">
          <span className="text-xs font-medium flex items-center gap-1 mr-0.5 sm:mr-1 text-emerald-600 dark:text-emerald-400">
            {saveStatus === "Saved" ? (
              <>
                <Check size={14} className="text-emerald-500 shrink-0" />
                <span className="hidden sm:inline">Saved</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                <span className="text-amber-500 hidden sm:inline">{saveStatus}</span>
              </>
            )}
          </span>

          <button
            onClick={handleTogglePin}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              isPinned
                ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40"
                : "hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
            }`}
            title={isPinned ? "Unpin Note" : "Pin to Top"}
          >
            <Pin size={16} className={isPinned ? "fill-current" : ""} />
          </button>

          <button
            onClick={handleToggleFavorite}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              isFavorite
                ? "text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40"
                : "hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
            }`}
            title={isFavorite ? "Remove Favorite" : "Add to Favorites"}
          >
            <Heart size={16} className={isFavorite ? "fill-current" : ""} />
          </button>

          {onMoveToTrash && activeNote?._id && (
            <button
              onClick={() => onMoveToTrash(activeNote._id)}
              className="p-1.5 rounded-xl hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Move to Trash"
            >
              <Trash2 size={16} />
            </button>
          )}

          <button
            className="p-1.5 rounded-xl hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="More Options"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Note Editor Body Canvas */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6 md:px-10 md:py-8 lg:px-14 xl:px-20 2xl:px-28 space-y-4 max-w-full">
        {/* Title Heading Input */}
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled Note"
          className="w-full text-xl sm:text-2xl md:text-3xl lg:text-4xl 2xl:text-5xl font-extrabold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 bg-transparent border-none focus:outline-none tracking-tight leading-snug"
        />

        {/* Description line with file icon */}
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 pb-2">
          <FileText size={16} className="text-slate-400 shrink-0" />
          <input
            type="text"
            value={details}
            onChange={handleDetailsChange}
            placeholder="Add a description..."
            className="w-full bg-transparent border-none text-slate-600 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-sm"
          />
        </div>

        <div className="border-b border-slate-100 dark:border-white/5 my-2" />

        {/* BlockNote Document Canvas */}
        <div className="min-h-[350px] pb-24">
          <BlockNoteView editor={editor} theme={theme === "dark" ? "dark" : "light"} />
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;
