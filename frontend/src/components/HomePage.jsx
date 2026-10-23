import React, { useState } from "react";
import {
  NotebookPen,
  Mic,
  Sparkles,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Zap,
  Moon,
  Sun,
  ArrowRight,
  Lock,
  Mail,
  FolderTree,
  Check,
  SlidersHorizontal,
  Flame,
  FileText,
  Volume2,
  Code2,
  Leaf,
  Briefcase,
  GraduationCap,
  Lightbulb,
  ShoppingCart,
  User,
  LogIn,
  UserPlus,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const HomePage = ({ onOpenAuth, onLaunchApp }) => {
  const { isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0c16] text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      {/* 1. Header / Navbar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/85 dark:bg-[#0b0c16]/85 border-b border-slate-200 dark:border-white/10 transition-colors">
        <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
          {/* Logo & Brand statement */}
          <div
            onClick={onLaunchApp}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform shrink-0">
              <NotebookPen size={19} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 bg-clip-text text-transparent">
                  Echo
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  AI
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase truncate max-w-[180px] sm:max-w-none">
                SPEAK. STRUCTURE. ORGANIZE.
              </p>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#what-is-echo" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              What is Echo?
            </a>
            <a href="#how-it-works" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Overview & Features
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-slate-600" />}
            </button>

            {/* Desktop Auth Actions */}
            <div className="hidden md:flex items-center gap-2 sm:gap-3">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <span className="hidden lg:inline-block text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Hi, <strong className="text-slate-900 dark:text-white">{user?.name?.split(" ")[0] || "User"}</strong>
                  </span>
                  <button
                    onClick={onLaunchApp}
                    className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenAuth("login")}
                    className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => onOpenAuth("register")}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/30 hover:shadow-purple-600/50 transition-all cursor-pointer"
                  >
                    <UserPlus size={14} />
                    <span>Register</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
              title="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0b0c16]/95 backdrop-blur-2xl px-4 py-5 space-y-4 animate-fade-in shadow-2xl">
            <nav className="flex flex-col space-y-2 text-sm font-semibold">
              <a
                href="#what-is-echo"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 transition-colors"
              >
                What is Echo?
              </a>
              <a
                href="#how-it-works"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 transition-colors"
              >
                How It Works
              </a>
              <a
                href="#features"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 transition-colors"
              >
                Overview & Features
              </a>
            </nav>

            <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex flex-col gap-2.5">
              {isAuthenticated ? (
                <>
                  <div className="px-3 text-xs text-slate-500 dark:text-slate-400">
                    Signed in as <strong className="text-slate-900 dark:text-white">{user?.name || user?.email}</strong>
                  </div>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onLaunchApp();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-md"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAuth("login");
                    }}
                    className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-white/5"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAuth("register");
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-md shadow-purple-600/30"
                  >
                    <UserPlus size={15} />
                    <span>Register Free Account</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-24 md:pt-24 md:pb-32 2xl:pt-32 2xl:pb-40">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] 2xl:w-[900px] h-[250px] sm:h-[350px] 2xl:h-[500px] bg-gradient-to-tr from-purple-600/20 via-pink-500/20 to-indigo-600/20 blur-[130px] -z-10 rounded-full pointer-events-none" />

        <div className="max-w-6xl 2xl:max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 sm:space-y-8">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full border border-purple-300 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-xs font-semibold shadow-sm animate-fade-in max-w-full truncate">
            <Sparkles size={14} className="text-purple-500 animate-spin shrink-0" />
            <span className="truncate">Next-Generation Voice AI & Block Note Canvas</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl 2xl:text-8xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
            Speak Your Thoughts. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-500 bg-clip-text text-transparent">
              Echo Builds Your Notes.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-3xl 2xl:max-w-4xl mx-auto text-base sm:text-lg md:text-xl 2xl:text-2xl text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
            Echo combines a flexible, block-based canvas with smart voice dictation. Speak naturally, and Echo instantly generates titles, headings, task checklists, and organized bullet points.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-3 sm:pt-4 max-w-md sm:max-w-none mx-auto w-full">
            <button
              onClick={() => (isAuthenticated ? onLaunchApp() : onOpenAuth("register"))}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-purple-600/35 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
            >
              <span>{isAuthenticated ? "Launch Dashboard" : "Start Taking Notes — Free"}</span>
              <ArrowRight size={18} />
            </button>

            {!isAuthenticated && (
              <button
                onClick={() => onOpenAuth("login")}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 sm:py-4 rounded-2xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#141524] hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 font-bold text-sm sm:text-base shadow-sm hover:scale-105 transition-all cursor-pointer"
              >
                <LogIn size={18} className="text-purple-500" />
                <span>Sign In to Existing Account</span>
              </button>
            )}
          </div>

          {/* Trust Highlights */}
          <div className="pt-4 sm:pt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <span>Email OTP Verification via Nodemailer</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <span>Auto-assigned Category Signature Palettes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <span>Sub-millisecond In-Memory Caching</span>
            </div>
          </div>

          {/* 3-Column Interactive Dashboard Showcase */}
          <div className="pt-8 sm:pt-10 max-w-5xl 2xl:max-w-6xl mx-auto">
            <div className="p-2 sm:p-4 md:p-5 rounded-3xl bg-slate-200/80 dark:bg-white/5 border border-slate-300/80 dark:border-white/10 shadow-2xl backdrop-blur-2xl">
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f101a] shadow-inner text-left">
                {/* Mock Window Top Bar */}
                <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-slate-100 dark:bg-[#161725] border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400/80" />
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400/80" />
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400/80" />
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-400 ml-1.5 truncate">Echo Interactive Workspace</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      Voice Pipeline Ready
                    </span>
                  </div>
                </div>

                {/* Mock Workspace Content: Fully Responsive Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-12 min-h-[340px] sm:min-h-[380px]">
                  {/* Left Column Preview: Categories (Visible on md+) */}
                  <div className="hidden md:block md:col-span-3 border-r border-slate-200 dark:border-white/10 p-4 space-y-3 bg-slate-50/50 dark:bg-white/[0.01]">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <FolderTree size={14} />
                      <span>Categories</span>
                    </div>
                    <div className="space-y-1 text-xs font-semibold">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800/40">
                        <Code2 size={14} /> <span>Programming</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5">
                        <Leaf size={14} className="text-emerald-500" /> <span>Personal</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5">
                        <Briefcase size={14} className="text-blue-500" /> <span>Work</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5">
                        <Lightbulb size={14} className="text-rose-500" /> <span>Ideas</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column Preview: Stream (Visible on sm+) */}
                  <div className="hidden sm:block sm:col-span-5 md:col-span-4 border-r border-slate-200 dark:border-white/10 p-4 space-y-3 bg-slate-50/20 dark:bg-transparent">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>Notes (3)</span>
                      <SlidersHorizontal size={14} />
                    </div>
                    <div className="space-y-2.5">
                      <div className="p-3 rounded-2xl bg-white dark:bg-[#12111c] border-l-4 !border-l-purple-500 border border-purple-200 dark:border-purple-500/40 shadow-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                            PROGRAMMING
                          </span>
                        </div>
                        <h4 className="text-xs font-bold mt-1 text-slate-900 dark:text-white">
                          Java Mock Interview Details
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          Core Java, OOP principles, REST APIs revision
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-white dark:bg-[#12111c] border border-slate-200 dark:border-white/10 shadow-sm opacity-70">
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          PERSONAL
                        </span>
                        <h4 className="text-xs font-bold mt-1 text-slate-900 dark:text-white">
                          Daily Reflections
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* Right Column Preview: Block Editor Canvas with Voice Bubble */}
                  <div className="col-span-12 sm:col-span-7 md:col-span-5 p-4 sm:p-5 space-y-3 relative flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 sm:hidden">
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          PROGRAMMING
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Java Mock Interview Details
                      </h3>
                      <div className="space-y-2 text-xs">
                        <div className="font-bold text-purple-600 dark:text-purple-400">
                          ## Interview Subjects
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          <span>Core Java & Multi-threading</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          <span>React.js State Management & Hooks</span>
                        </div>
                        <div className="font-bold text-purple-600 dark:text-purple-400 pt-1">
                          ## Action Items
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <div className="w-3.5 h-3.5 rounded bg-purple-500/20 border border-purple-500 flex items-center justify-center text-purple-400 text-[10px]">
                            ✓
                          </div>
                          <span>Practice SQL join queries</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <div className="w-3.5 h-3.5 rounded border border-slate-400" />
                          <span>Review System Design patterns</span>
                        </div>
                      </div>
                    </div>

                    {/* Mock Floating Mic Indicator */}
                    <div className="flex items-center justify-between p-2.5 rounded-2xl bg-purple-600/10 border border-purple-500/30 text-purple-600 dark:text-purple-300 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                        <span className="font-bold text-[11px] sm:text-xs">Live Voice AI Preview Ready</span>
                      </div>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md shrink-0">
                        <Mic size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Section: What is Echo? */}
      <section id="what-is-echo" className="py-16 sm:py-20 md:py-28 2xl:py-36 border-t border-slate-200 dark:border-white/10 bg-slate-100/60 dark:bg-[#0e0f1c]/70">
        <div className="max-w-6xl 2xl:max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl 2xl:max-w-4xl mx-auto mb-12 sm:mb-16 space-y-3 sm:space-y-4">
            <h2 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
              WHAT IS ECHO?
            </h2>
            <h3 className="text-2xl sm:text-4xl md:text-5xl 2xl:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              An Intelligent Note App Engineered Around Voice-First Structuring
            </h3>
            <p className="text-sm sm:text-base md:text-lg 2xl:text-xl text-slate-600 dark:text-slate-300">
              Traditional note applications force you into a slow cycle of manual typing, formatting headers, and reorganizing bullet points. Echo solves this by giving you the speed of spoken thought with the structure of a modular block document.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
            {/* The Old Way */}
            <div className="p-6 sm:p-8 2xl:p-10 rounded-3xl bg-white dark:bg-[#141524] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center font-bold">
                  ✕
                </div>
                <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  The Friction of Traditional Note Takers
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Typing down thoughts during standups, lectures, or brainstorms is slow. Formatting headings, checkboxes, and bullet lists requires dozens of keystrokes. By the time you format your note, your spontaneous train of thought is lost.
                </p>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-500 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <span className="text-red-500 font-bold">•</span> Tedious typing and manual formatting
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500 font-bold">•</span> Raw audio memos that are never transcribed or reviewed
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500 font-bold">•</span> Cluttered, monochrome cards with poor visual organization
                </li>
              </ul>
            </div>

            {/* The Echo Way */}
            <div className="p-6 sm:p-8 2xl:p-10 rounded-3xl bg-gradient-to-b from-purple-500/10 to-indigo-500/10 border-2 border-purple-500/50 shadow-xl flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center font-bold shadow-lg shadow-purple-500/30">
                  <Sparkles size={22} />
                </div>
                <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  The Echo Intelligent Voice Workspace
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  Echo captures speech continuously, feeds it through intelligent speech-to-blocks AI pipelines, and constructs a clean document: a descriptive title, high-level headings, actionable checklist tasks, and bulleted details — ready to drag and drop.
                </p>
              </div>
              <ul className="space-y-2.5 text-xs text-purple-800 dark:text-purple-300 font-medium">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>Instant dictation transformed into clean headings, tasks, and bullets</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>Interactive Notion-like BlockNote canvas with drag handles</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>Automatic signature colors assigned per category</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Section: How It Works */}
      <section id="how-it-works" className="py-16 sm:py-20 md:py-28 2xl:py-36">
        <div className="max-w-6xl 2xl:max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl 2xl:max-w-4xl mx-auto mb-12 sm:mb-16 space-y-3 sm:space-y-4">
            <h2 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
              HOW IT WORKS
            </h2>
            <h3 className="text-2xl sm:text-4xl md:text-5xl 2xl:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              From Spoken Voice to Structured Notes in 3 Steps
            </h3>
            <p className="text-sm sm:text-base md:text-lg 2xl:text-xl text-slate-600 dark:text-slate-300">
              Experience the friction-free loop that turns your voice into pristine, searchable documents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 2xl:gap-10">
            {/* Step 1 */}
            <div className="p-6 sm:p-8 2xl:p-10 rounded-3xl bg-white dark:bg-[#141524] border border-slate-200 dark:border-white/10 shadow-sm relative group hover:border-purple-400 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 font-extrabold flex items-center justify-center mb-6">
                01
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3">
                1. Tap & Speak Naturally
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Click the glowing microphone button in the bottom right corner. Echo records your audio and speech transcript continuously with real-time audio visualization.
              </p>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-xs text-slate-500">
                🗣 "Meeting with design team tomorrow at 10 AM to finalize dark mode..."
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 sm:p-8 2xl:p-10 rounded-3xl bg-white dark:bg-[#141524] border border-slate-200 dark:border-white/10 shadow-sm relative group hover:border-purple-400 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center mb-6">
                02
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3">
                2. Multi-Model AI Extraction
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Echo's multi-tiered AI pipeline cleans filler words, extracts a concise title, categorizes action items into checkboxes, and groups discussion points into headings.
              </p>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-xs text-purple-600 dark:text-purple-300 font-mono">
                Title: Design Team Sync<br />
                - [ ] Finalize dark mode palette
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 sm:p-8 2xl:p-10 rounded-3xl bg-white dark:bg-[#141524] border border-slate-200 dark:border-white/10 shadow-sm relative group hover:border-purple-400 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400 font-extrabold flex items-center justify-center mb-6">
                03
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3">
                3. Instant Block Canvas & Colors
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                The note renders instantly in the BlockNote editor. Change categories with 1 click to auto-apply signature theme colors, or reorganize blocks with drag handles.
              </p>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                ✓ Auto-saved & cached in sub-millisecond memory
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Section: Core Features Overview */}
      <section id="features" className="py-16 sm:py-20 md:py-28 2xl:py-36 border-t border-slate-200 dark:border-white/10 bg-slate-100/60 dark:bg-[#0e0f1c]/70">
        <div className="max-w-6xl 2xl:max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl 2xl:max-w-4xl mx-auto mb-12 sm:mb-16 space-y-3 sm:space-y-4">
            <h2 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
              OVERVIEW & ARCHITECTURE
            </h2>
            <h3 className="text-2xl sm:text-4xl md:text-5xl 2xl:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Built for Speed, Scalability, and Productivity
            </h3>
            <p className="text-sm sm:text-base md:text-lg 2xl:text-xl text-slate-600 dark:text-slate-300">
              Every detail in Echo is engineered to make capturing and organizing thoughts seamless.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 2xl:gap-8">
            {/* Feature 1 */}
            <div className="p-5 sm:p-6 2xl:p-8 rounded-3xl bg-white dark:bg-[#141524] border border-slate-200 dark:border-white/10 shadow-sm space-y-3 hover:border-purple-300 dark:hover:border-purple-500/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Mic size={22} />
              </div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Floating AI Voice Dictation
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Bottom-right microphone with real-time speech preview, soundwave ring pulses, and automatic multi-session accumulation so no words are dropped.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-5 sm:p-6 2xl:p-8 rounded-3xl bg-white dark:bg-[#141524] border border-slate-200 dark:border-white/10 shadow-sm space-y-3 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Layers size={22} />
              </div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Modular Block Canvas
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Powered by BlockNote. Drag blocks, convert to headings, checklists, quotes, or bulleted lists, and format rich text directly on the page.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-5 sm:p-6 2xl:p-8 rounded-3xl bg-white dark:bg-[#141524] border border-slate-200 dark:border-white/10 shadow-sm space-y-3 hover:border-pink-300 dark:hover:border-pink-500/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-pink-600/10 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                <Mail size={22} />
              </div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Nodemailer OTP Authentication
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Enterprise password security policy with 6-digit email OTP verification, JWT session tokens, and secure HTTP-only cookies.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-5 sm:p-6 2xl:p-8 rounded-3xl bg-white dark:bg-[#141524] border border-slate-200 dark:border-white/10 shadow-sm space-y-3 hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Zap size={22} />
              </div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Sub-Millisecond Caching
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                High-speed in-memory TTL query caching and gzip payload compression deliver instant response times and maximum scalability.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-5 sm:p-6 2xl:p-8 rounded-3xl bg-white dark:bg-[#141524] border border-slate-200 dark:border-white/10 shadow-sm space-y-3 hover:border-amber-300 dark:hover:border-amber-500/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <SlidersHorizontal size={22} />
              </div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Category Color Palettes
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Select Programming, Personal, Work, Study, Ideas, or Shopping, and signature color badges and card borders apply automatically.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-5 sm:p-6 2xl:p-8 rounded-3xl bg-white dark:bg-[#141524] border border-slate-200 dark:border-white/10 shadow-sm space-y-3 hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ShieldCheck size={22} />
              </div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Zero-Failure AI Fallback
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Cascading model architecture: Gemini 3.5 Flash, Groq, OpenAI, and a built-in offline NLP structurer guarantee notes never fail or return empty bodies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Section: Call to Action Banner */}
      <section className="py-16 sm:py-20 md:py-24 2xl:py-32 relative overflow-hidden">
        <div className="max-w-5xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl p-6 sm:p-12 md:p-16 2xl:p-20 bg-gradient-to-r from-purple-900/60 via-indigo-950/70 to-[#0b0c16] border border-purple-500/30 shadow-2xl relative overflow-hidden text-center space-y-5 sm:space-y-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-3xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-xl shadow-purple-600/40">
              <NotebookPen size={28} />
            </div>

            <h3 className="text-2xl sm:text-4xl md:text-5xl 2xl:text-6xl font-extrabold text-white tracking-tight">
              Ready to Upgrade the Way You Take Notes?
            </h3>
            <p className="max-w-2xl 2xl:max-w-3xl mx-auto text-slate-300 text-xs sm:text-base 2xl:text-lg leading-relaxed">
              Join Echo today. Record your voice, watch ideas structure themselves into blocks, and keep your workspace organized effortlessly.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 max-w-md sm:max-w-none mx-auto w-full">
              <button
                onClick={() => (isAuthenticated ? onLaunchApp() : onOpenAuth("register"))}
                className="w-full sm:w-auto px-7 sm:px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-purple-600/30 hover:scale-105 transition-all cursor-pointer"
              >
                {isAuthenticated ? "Go to My Notes" : "Create Free Account with OTP"}
              </button>
              {!isAuthenticated && (
                <button
                  onClick={() => onOpenAuth("login")}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  Log In
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#080911] py-10 sm:py-12 transition-colors">
        <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shrink-0">
              <NotebookPen size={16} />
            </div>
            <div>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">Echo</span>
              <p className="text-[10px] tracking-widest uppercase text-slate-400">NOTES TO BUILD U NOTES</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-semibold">
            <a href="#what-is-echo" className="hover:text-purple-600 dark:hover:text-purple-400">What is Echo?</a>
            <a href="#how-it-works" className="hover:text-purple-600 dark:hover:text-purple-400">How It Works</a>
            <a href="#features" className="hover:text-purple-600 dark:hover:text-purple-400">Features</a>
          </div>

          <div className="text-center md:text-right">
            <p>&copy; {new Date().getFullYear()} Echo Inc. Built for voice-first productivity.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
