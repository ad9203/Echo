import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Menu,
  RefreshCw,
  FolderOpen,
  Check,
  ArrowUpDown,
  Filter,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";
import { api } from "./services/api";

import Sidebar from "./components/Sidebar";
import NoteCard from "./components/NoteCard";
import NoteEditor, { CATEGORY_TO_COLOR } from "./components/NoteEditor";
import VoiceDictation from "./components/VoiceDictation";
import AuthModal from "./components/AuthModal";
import HomePage from "./components/HomePage";

// Starter notes (clean slate for authenticated users)
const SEED_NOTES = [];

const App = () => {
  const { user, isAuthenticated } = useAuth();
  const { theme } = useTheme();

  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [view, setView] = useState("active");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState("login");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dismissVoiceToast, setDismissVoiceToast] = useState(0);
  const [mobileActiveView, setMobileActiveView] = useState("list"); // "list" | "editor" (mobile screen switcher)

  // Screen View: "home" (Landing/Overview) or "workspace" (3-Column Notes App)
  // Protected: workspace requires authentication
  const [currentScreen, setCurrentScreen] = useState(() => {
    return (window.location.hash === "#workspace" || window.location.hash === "#app") && isAuthenticated
      ? "workspace"
      : "home";
  });

  const handleUserLogout = useCallback(() => {
    setCurrentScreen("home");
    window.location.hash = "home";
    setNotes([]);
    setActiveNote(null);
    setIsAuthModalOpen(false);
  }, []);

  // Redirect to home if unauthenticated user is on workspace screen
  useEffect(() => {
    if (!isAuthenticated && currentScreen === "workspace") {
      setCurrentScreen("home");
      window.location.hash = "home";
      setNotes([]);
      setActiveNote(null);
    }
  }, [isAuthenticated, currentScreen]);

  // Keep screen synced with browser hash
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === "#workspace" || window.location.hash === "#app") {
        if (!isAuthenticated) {
          setCurrentScreen("home");
          window.location.hash = "home";
          setAuthInitialMode("register");
          setIsAuthModalOpen(true);
        } else {
          setCurrentScreen("workspace");
        }
      } else if (window.location.hash === "#home" || !window.location.hash) {
        setCurrentScreen("home");
      }
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [isAuthenticated]);

  // Filter & Sort State for SlidersHorizontal button
  const [sortBy, setSortBy] = useState("newest"); // "newest", "oldest", "title-asc", "title-desc"
  const [filterCondition, setFilterCondition] = useState("all"); // "all", "pinned", "favorites"
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef(null);

  // Active BlockNote editor reference
  const editorRef = useRef(null);

  // Close filter popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target)) {
        setIsFilterMenuOpen(false);
      }
    };
    if (isFilterMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isFilterMenuOpen]);

  // Fetch notes from backend
  const fetchNotes = useCallback(async () => {
    // If not authenticated, do not attempt to query private notes or auto-login
    if (!isAuthenticated) {
      setNotes([]);
      setActiveNote(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const isFavView = view === "favorites";
      const statusParam = isFavView ? "active" : view;

      const res = await api.getNotes({
        status: statusParam,
        category: categoryFilter,
        search: searchQuery,
        favorite: isFavView,
      });

      if (res.success && Array.isArray(res.notes)) {
        setNotes(res.notes);
        if (res.notes.length > 0) {
          setActiveNote((current) => {
            if (current && res.notes.some((n) => (n._id || n.id) === (current._id || current.id))) {
              return current;
            }
            return res.notes[0];
          });
        } else {
          setActiveNote(null);
        }
      }
    } catch (err) {
      console.warn("[Echo] Backend sync notice:", err.message);
    } finally {
      setIsLoading(false);
    }
  }, [view, categoryFilter, searchQuery, isAuthenticated, user]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes, isAuthenticated]);

  // Create new note with auto-assigned color based on category
  const handleCreateNote = async () => {
    setDismissVoiceToast((prev) => prev + 1);
    setMobileActiveView("editor");
    try {
      const selectedCategory = categoryFilter === "All" ? "Programming" : categoryFilter;
      const autoColor = CATEGORY_TO_COLOR[selectedCategory] || "purple";

      const initialNote = {
        title: "Untitled Note",
        details: "Add a description...",
        content: [
          {
            type: "paragraph",
            content: [],
          },
        ],
        category: selectedCategory,
        color: autoColor,
        isPinned: false,
        isFavorite: false,
      };

      const res = await api.createNote(initialNote);
      if (res.success && res.note) {
        setNotes((prev) => [res.note, ...prev]);
        setActiveNote(res.note);
      }
    } catch (err) {
      console.error("[Echo] Note creation offline fallback:", err);
      const selectedCategory = categoryFilter === "All" ? "Programming" : categoryFilter;
      const autoColor = CATEGORY_TO_COLOR[selectedCategory] || "purple";

      const tempNote = {
        _id: `temp-${Date.now()}`,
        title: "Untitled Note",
        details: "Add a description...",
        content: [],
        category: selectedCategory,
        color: autoColor,
        isPinned: false,
        isFavorite: false,
        createdAt: new Date().toISOString(),
      };
      setNotes((prev) => [tempNote, ...prev]);
      setActiveNote(tempNote);
    }
  };

  // Save / Auto-save note
  const handleSaveNote = async (updatedData) => {
    const id = updatedData._id || updatedData.id;
    if (!id) return;

    setNotes((prev) =>
      prev.map((n) => ((n._id || n.id) === id ? { ...n, ...updatedData } : n))
    );

    if (activeNote && (activeNote._id || activeNote.id) === id) {
      setActiveNote((prev) => ({ ...prev, ...updatedData }));
    }

    try {
      if (!id.toString().startsWith("seed-") && !id.toString().startsWith("temp-")) {
        await api.updateNote(id, updatedData);
      }
    } catch (err) {
      console.error("[Echo] Save note failed:", err);
    }
  };

  // Pin toggle
  const handleTogglePin = async (noteId) => {
    setNotes((prev) =>
      prev.map((n) =>
        (n._id || n.id) === noteId ? { ...n, isPinned: !n.isPinned } : n
      )
    );
    if (activeNote && (activeNote._id || activeNote.id) === noteId) {
      setActiveNote((prev) => ({ ...prev, isPinned: !prev.isPinned }));
    }

    try {
      if (!noteId.toString().startsWith("seed-")) {
        await api.togglePin(noteId);
      }
    } catch (err) {
      console.error("[Echo] Pin toggle error:", err);
    }
  };

  // Favorite toggle
  const handleToggleFavorite = async (noteId) => {
    setNotes((prev) =>
      prev.map((n) =>
        (n._id || n.id) === noteId ? { ...n, isFavorite: !n.isFavorite } : n
      )
    );
    if (activeNote && (activeNote._id || activeNote.id) === noteId) {
      setActiveNote((prev) => ({ ...prev, isFavorite: !prev.isFavorite }));
    }

    try {
      if (!noteId.toString().startsWith("seed-")) {
        await api.toggleFavorite(noteId);
      }
    } catch (err) {
      console.error("[Echo] Favorite toggle error:", err);
    }
  };

  // Archive toggle
  const handleToggleArchive = async (noteId) => {
    try {
      if (!noteId.toString().startsWith("seed-")) {
        await api.toggleArchive(noteId);
      }
      setNotes((prev) => prev.filter((n) => (n._id || n.id) !== noteId));
      if (activeNote && (activeNote._id || activeNote.id) === noteId) {
        setActiveNote(null);
        setMobileActiveView("list");
      }
    } catch (err) {
      console.error("[Echo] Archive error:", err);
    }
  };

  // Move to trash
  const handleMoveToTrash = async (noteId) => {
    try {
      if (!noteId.toString().startsWith("seed-")) {
        await api.moveToTrash(noteId);
      }
      setNotes((prev) => prev.filter((n) => (n._id || n.id) !== noteId));
      if (activeNote && (activeNote._id || activeNote.id) === noteId) {
        setActiveNote(null);
        setMobileActiveView("list");
      }
    } catch (err) {
      console.error("[Echo] Trash error:", err);
    }
  };

  // Restore note
  const handleRestoreNote = async (noteId) => {
    try {
      if (!noteId.toString().startsWith("seed-")) {
        await api.restoreNote(noteId);
      }
      fetchNotes();
    } catch (err) {
      console.error("[Echo] Restore error:", err);
    }
  };

  // Permanent delete
  const handlePermanentlyDelete = async (noteId) => {
    try {
      if (!noteId.toString().startsWith("seed-")) {
        await api.permanentlyDeleteNote(noteId);
      }
      setNotes((prev) => prev.filter((n) => (n._id || n.id) !== noteId));
      if (activeNote && (activeNote._id || activeNote.id) === noteId) {
        setActiveNote(null);
        setMobileActiveView("list");
      }
    } catch (err) {
      console.error("[Echo] Permanent delete error:", err);
    }
  };

  // Voice Dictation completed: auto-assign color based on category and reliably insert blocks
  const handleDictationComplete = async ({ title, blocks }) => {
    if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return;
    setMobileActiveView("editor");

    const extractedTitle = title?.trim() || "Voice Note";

    if (activeNote) {
      // Determine updated title: if note is untitled or user spoke, use AI title
      const isUntitled =
        !activeNote.title ||
        activeNote.title === "Untitled Note" ||
        activeNote.title.trim().length === 0;
      const updatedTitle = isUntitled || extractedTitle !== "Voice Note" ? extractedTitle : activeNote.title;

      // Safely insert blocks into BlockNote editor
      let finalContent = blocks;

      if (editorRef.current) {
        try {
          const doc = editorRef.current.document;
          const isDocEmpty =
            !doc ||
            doc.length === 0 ||
            (doc.length === 1 &&
              doc[0].type === "paragraph" &&
              (!doc[0].content || doc[0].content.length === 0));

          if (isDocEmpty) {
            editorRef.current.replaceBlocks(doc, blocks);
          } else {
            editorRef.current.replaceBlocks(doc, [...doc, ...blocks]);
          }
          finalContent = editorRef.current.document;
        } catch (e) {
          console.warn("[Echo] Editor insertion fallback:", e);
          finalContent = blocks;
        }
      }

      const noteId = activeNote._id || activeNote.id;
      const updated = {
        ...activeNote,
        title: updatedTitle,
        content: finalContent,
      };

      setNotes((prev) =>
        prev.map((n) => ((n._id || n.id) === noteId ? updated : n))
      );
      setActiveNote(updated);
      await handleSaveNote(updated);
    } else {
      // No active note is selected -> create a new note with voice content
      const cat = categoryFilter === "All" ? "Programming" : categoryFilter;
      const autoColor = CATEGORY_TO_COLOR[cat] || "purple";

      const newNoteData = {
        title: extractedTitle,
        details: "Created via Echo Voice Assistant",
        content: blocks,
        category: cat,
        color: autoColor,
        isPinned: false,
        isFavorite: false,
      };

      try {
        if (isAuthenticated) {
          const res = await api.createNote(newNoteData);
          if (res.success && res.note) {
            setNotes((prev) => [res.note, ...prev]);
            setActiveNote(res.note);
            return;
          }
        }
      } catch (err) {
        console.warn("[Echo] Backend note creation error, saving locally:", err);
      }

      // Guest / seed note fallback
      const localNote = {
        _id: "local-" + Date.now(),
        ...newNoteData,
        createdAt: new Date().toISOString(),
      };
      setNotes((prev) => [localNote, ...prev]);
      setActiveNote(localNote);
    }
  };

  // Apply Search, Category, Status, Filter, and Sorting
  const filteredNotes = notes
    .filter((n) => {
      const matchesCategory =
        categoryFilter === "All" || n.category === categoryFilter;

      const matchesSearch =
        !searchQuery ||
        n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.details?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesView =
        view === "favorites"
          ? n.isFavorite
          : view === "archived"
          ? n.status === "archived"
          : view === "trash"
          ? n.status === "trash"
          : !n.status || n.status === "active";

      const matchesFilterCondition =
        filterCondition === "pinned"
          ? n.isPinned
          : filterCondition === "favorites"
          ? n.isFavorite
          : true;

      return matchesCategory && matchesSearch && matchesView && matchesFilterCondition;
    })
    .sort((a, b) => {
      // 1. PINNED NOTES ALWAYS ON TOP:
      // Regardless of sort or filter applied, pinned notes always appear before unpinned notes
      const aPinned = Boolean(a.isPinned);
      const bPinned = Boolean(b.isPinned);
      if (aPinned !== bPinned) {
        return bPinned ? 1 : -1;
      }

      // 2. Helper to safely parse creation time order
      const getCreatedTime = (note) => {
        const val = note.createdAt || note.updatedAt || 0;
        const time = new Date(val).getTime();
        return isNaN(time) ? 0 : time;
      };

      if (sortBy === "oldest") {
        const diff = getCreatedTime(a) - getCreatedTime(b);
        if (diff !== 0) return diff;
        return (a.title || "").localeCompare(b.title || "");
      }

      if (sortBy === "title-asc") {
        const titleDiff = (a.title || "").localeCompare(b.title || "");
        if (titleDiff !== 0) return titleDiff;
        return getCreatedTime(b) - getCreatedTime(a);
      }

      if (sortBy === "title-desc") {
        const titleDiff = (b.title || "").localeCompare(a.title || "");
        if (titleDiff !== 0) return titleDiff;
        return getCreatedTime(b) - getCreatedTime(a);
      }

      // Default ("newest"): strictly ordered by creation time (newest first)
      const diff = getCreatedTime(b) - getCreatedTime(a);
      if (diff !== 0) return diff;
      return (a.title || "").localeCompare(b.title || "");
    });

  const isFilterActive = sortBy !== "newest" || filterCondition !== "all";
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : (isAuthenticated ? "U" : "?");

  // If user is viewing the Home Landing Page
  if (currentScreen === "home") {
    return (
      <>
        <HomePage
          onOpenAuth={(mode) => {
            setAuthInitialMode(mode);
            setIsAuthModalOpen(true);
          }}
          onLaunchApp={() => {
            if (isAuthenticated) {
              setCurrentScreen("workspace");
              window.location.hash = "workspace";
            } else {
              setAuthInitialMode("register");
              setIsAuthModalOpen(true);
            }
          }}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authInitialMode}
          onClose={() => {
            setIsAuthModalOpen(false);
            if (isAuthenticated) {
              setCurrentScreen("workspace");
              window.location.hash = "workspace";
            }
          }}
          onLogout={handleUserLogout}
        />
      </>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#07070d] text-slate-900 dark:text-white antialiased font-sans selection:bg-purple-500/20 selection:text-purple-700 dark:selection:text-purple-300">
      {/* COLUMN 1: Left Navigation Sidebar */}
      <Sidebar
        view={view}
        setView={setView}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        counts={{ active: filteredNotes.length }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Backdrop overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* RIGHT WORKSPACE: Top Header + 2-Column Dashboard */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 px-3 sm:px-4 md:px-6 2xl:px-8 flex items-center justify-between gap-2 sm:gap-4 border-b border-slate-200 dark:border-white/10 bg-white/70 dark:bg-[#0d0e15]/70 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-initial min-w-0 max-w-xs sm:max-w-none">
            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer shrink-0"
              title="Open menu"
            >
              <Menu size={18} />
            </button>

            {/* Pill Search Bar */}
            <div className="relative w-full sm:w-64 md:w-80 lg:w-96 xl:w-[480px] 2xl:w-[540px]">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search notes, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 sm:py-2 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.05] text-xs md:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
              />
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Home Link Button */}
            <button
              onClick={() => {
                setCurrentScreen("home");
                window.location.hash = "home";
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
              title="View Echo Landing Page & Overview"
            >
              <span>Home</span>
            </button>

            {/* + New Note Button */}
            <button
              onClick={handleCreateNote}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs md:text-sm font-semibold shadow-md shadow-purple-600/20 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer shrink-0"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">New Note</span>
              <span className="sm:hidden">Note</span>
            </button>

            {/* User Avatar Circle */}
            <button
              onClick={() => {
                setAuthInitialMode(isAuthenticated ? "profile" : "login");
                setIsAuthModalOpen(true);
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-xs sm:text-sm flex items-center justify-center border border-purple-200 dark:border-purple-500/30 hover:scale-105 transition-transform cursor-pointer shadow-sm shrink-0"
              title={isAuthenticated ? `Account: ${user?.name || user?.email}` : "Log In or Register"}
            >
              {userInitial}
            </button>
          </div>
        </header>

        {/* 2-Column Dashboard Body */}
        <div className="flex-1 flex overflow-hidden p-2.5 sm:p-4 md:p-6 gap-3 sm:gap-4 md:gap-6 2xl:gap-8 max-w-[2000px] w-full mx-auto">
          {/* COLUMN 2: Notes List Stream */}
          <section className={`w-full md:w-80 lg:w-96 xl:w-[400px] 2xl:w-[440px] flex flex-col shrink-0 h-full overflow-hidden transition-all ${
            mobileActiveView === "editor" ? "hidden md:flex" : "flex"
          }`}>
            {/* Stream Header: "Notes (6)" + Interactive Filter / Sort Menu */}
            <div className="flex items-center justify-between px-1 mb-3 shrink-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Notes <span className="text-slate-400 dark:text-slate-500 font-normal">({filteredNotes.length})</span>
              </h2>

              {/* Functional Filter / Sort Popover Menu */}
              <div className="relative" ref={filterMenuRef}>
                <button
                  onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    isFilterActive
                      ? "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-500/40"
                      : "text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10"
                  }`}
                  title="Sort & Filter notes"
                >
                  <SlidersHorizontal size={16} />
                  {isFilterActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400" />
                  )}
                </button>

                {/* Popover Card */}
                {isFilterMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#181926] border border-slate-200 dark:border-white/10 shadow-2xl z-40 p-2.5 text-xs animate-fade-in text-slate-700 dark:text-slate-200">
                    <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <ArrowUpDown size={12} /> Sort By
                      </span>
                    </div>

                    <div className="space-y-0.5 mt-1">
                      {[
                        { id: "newest", label: "Newest First" },
                        { id: "oldest", label: "Oldest First" },
                        { id: "title-asc", label: "Title (A → Z)" },
                        { id: "title-desc", label: "Title (Z → A)" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSortBy(item.id);
                            setIsFilterMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer ${
                            sortBy === item.id
                              ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold"
                              : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          <span>{item.label}</span>
                          {sortBy === item.id && <Check size={13} className="text-purple-600 dark:text-purple-400" />}
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-slate-100 dark:border-white/5 my-2" />

                    <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Filter size={12} /> Filter Condition
                    </div>

                    <div className="space-y-0.5 mt-1">
                      {[
                        { id: "all", label: "All Notes" },
                        { id: "pinned", label: "Pinned Only" },
                        { id: "favorites", label: "Favorites Only" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setFilterCondition(item.id);
                            setIsFilterMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer ${
                            filterCondition === item.id
                              ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold"
                              : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          <span>{item.label}</span>
                          {filterCondition === item.id && <Check size={13} className="text-purple-600 dark:text-purple-400" />}
                        </button>
                      ))}
                    </div>

                    {isFilterActive && (
                      <div className="border-t border-slate-100 dark:border-white/5 mt-2 pt-2">
                        <button
                          onClick={() => {
                            setSortBy("newest");
                            setFilterCondition("all");
                            setIsFilterMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 text-[11px] transition-colors cursor-pointer"
                        >
                          <RotateCcw size={12} />
                          <span>Reset Sort & Filters</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Note Cards Scrollable Stream */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 pb-24">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                  <RefreshCw size={22} className="animate-spin text-purple-500" />
                  <span className="text-xs">Loading notes...</span>
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">No notes match</p>
                  <p className="text-xs text-slate-400">Try changing your sort or filter conditions.</p>
                </div>
              ) : (
                filteredNotes.map((note) => {
                  const id = note._id || note.id;
                  const isSelected = activeNote && (activeNote._id || activeNote.id) === id;
                  return (
                    <NoteCard
                      key={id}
                      note={note}
                      isSelected={isSelected}
                      onSelectNote={(n) => {
                        setActiveNote(n);
                        setMobileActiveView("editor");
                        setDismissVoiceToast((prev) => prev + 1);
                      }}
                      togglePin={handleTogglePin}
                      toggleFavorite={handleToggleFavorite}
                      toggleArchive={handleToggleArchive}
                      view={view}
                      moveToTrash={handleMoveToTrash}
                      restoreNote={handleRestoreNote}
                      permanentlyDeleteNote={handlePermanentlyDelete}
                    />
                  );
                })
              )}
            </div>
          </section>

          {/* COLUMN 3: Right Editor Canvas (BlockNote) */}
          <section className={`flex-1 h-full overflow-hidden flex-col ${
            mobileActiveView === "list" ? "hidden md:flex" : "flex"
          }`}>
            {activeNote ? (
              <NoteEditor
                key={activeNote._id || activeNote.id}
                activeNote={activeNote}
                onSaveNote={handleSaveNote}
                onClose={() => setMobileActiveView("list")}
                onTogglePin={handleTogglePin}
                onToggleFavorite={handleToggleFavorite}
                onMoveToTrash={handleMoveToTrash}
                onEditorReady={(editor) => {
                  editorRef.current = editor;
                }}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center rounded-3xl bg-white dark:bg-[#0f101a] border border-slate-200 dark:border-white/10 p-8 text-center text-slate-400">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-3 shadow-sm">
                  <FolderOpen size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
                  No note selected
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mb-4">
                  Select a note from the stream on the left or create a new note to start writing.
                </p>
                <button
                  onClick={handleCreateNote}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                >
                  <Plus size={15} /> Create Note
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Floating Voice Assistant Recording Button (Bottom Right Corner) */}
      <VoiceDictation
        editor={editorRef.current}
        onDictationComplete={handleDictationComplete}
        dismissTrigger={dismissVoiceToast}
      />

      {/* Authentication Dialog */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authInitialMode}
        onClose={() => setIsAuthModalOpen(false)}
        onLogout={handleUserLogout}
      />
    </div>
  );
};

export default App;
