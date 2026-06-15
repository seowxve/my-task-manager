import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SUBJECTS = [
  {
    id: "statistics",
    label: "Statistics",
    icon: "📊",
    color: "purple",
    gradient: "from-violet-600 to-purple-800",
    glow: "shadow-violet-500/40",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    text: "text-violet-400",
    badge: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    bar: "bg-gradient-to-r from-violet-500 to-purple-600",
    hex: "#8b5cf6",
  },
  {
    id: "english",
    label: "English",
    icon: "📖",
    color: "amber",
    gradient: "from-amber-500 to-yellow-600",
    glow: "shadow-amber-500/40",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    bar: "bg-gradient-to-r from-amber-500 to-yellow-500",
    hex: "#f59e0b",
  },
  {
    id: "physics",
    label: "Physics",
    icon: "⚛️",
    color: "blue",
    gradient: "from-blue-500 to-cyan-600",
    glow: "shadow-blue-500/40",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    bar: "bg-gradient-to-r from-blue-500 to-cyan-500",
    hex: "#3b82f6",
  },
  {
    id: "chemistry",
    label: "Chemistry",
    icon: "🧪",
    color: "green",
    gradient: "from-emerald-500 to-green-600",
    glow: "shadow-emerald-500/40",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    bar: "bg-gradient-to-r from-emerald-500 to-green-500",
    hex: "#10b981",
  },
  {
    id: "digitaltech",
    label: "Digital Tech",
    icon: "💻",
    color: "indigo",
    gradient: "from-indigo-500 to-cyan-500",
    glow: "shadow-indigo-500/40",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
    text: "text-indigo-400",
    badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    bar: "bg-gradient-to-r from-indigo-500 to-cyan-500",
    hex: "#6366f1",
  },
];

const PRIORITIES = [
  { id: "low", label: "Low", color: "text-emerald-400", bg: "bg-emerald-500/20 border-emerald-500/30" },
  { id: "medium", label: "Medium", color: "text-amber-400", bg: "bg-amber-500/20 border-amber-500/30" },
  { id: "high", label: "High", color: "text-rose-400", bg: "bg-rose-500/20 border-rose-500/30" },
];

const STATUSES = [
  { id: "pending", label: "Pending", color: "text-slate-400", bg: "bg-slate-500/20 border-slate-500/30" },
  { id: "inprogress", label: "In Progress", color: "text-blue-400", bg: "bg-blue-500/20 border-blue-500/30" },
  { id: "completed", label: "Completed", color: "text-emerald-400", bg: "bg-emerald-500/20 border-emerald-500/30" },
];

const VIEWS = ["dashboard", "tasks", "calendar", "focus", "insights"];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function uuid() { return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2); }
function today() { return new Date().toISOString().split("T")[0]; }
function getSubject(id) { return SUBJECTS.find(s => s.id === id) || SUBJECTS[0]; }

// ─── GLOBAL STYLES ─────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; }

    :root {
      --ease-spring: cubic-bezier(0.25, 1, 0.5, 1);
      --ease-back: cubic-bezier(0.34, 1.56, 0.64, 1);
      --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
    }

    body { font-family: 'Space Grotesk', sans-serif; }

    .font-mono { font-family: 'JetBrains Mono', monospace; }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.2); border-radius: 2px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(148,163,184,0.4); }

    /* Animations */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.92); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(24px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideInLeft {
      from { opacity: 0; transform: translateX(-24px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 20px 2px var(--glow-color, rgba(139,92,246,0.3)); }
      50%       { box-shadow: 0 0 40px 8px var(--glow-color, rgba(139,92,246,0.5)); }
    }
    @keyframes orbit {
      from { transform: rotate(0deg) translateX(28px) rotate(0deg); }
      to   { transform: rotate(360deg) translateX(28px) rotate(-360deg); }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-8px); }
    }
    @keyframes ripple {
      0%   { transform: scale(0); opacity: 0.5; }
      100% { transform: scale(4); opacity: 0; }
    }
    @keyframes ticker {
      0%   { opacity: 1; transform: scale(1); }
      50%  { opacity: 0.7; transform: scale(1.02); }
      100% { opacity: 1; transform: scale(1); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes spin-slow { to { transform: rotate(360deg); } }
    @keyframes dash {
      0%   { stroke-dashoffset: 283; }
      100% { stroke-dashoffset: 0; }
    }
    @keyframes waveFloat {
      0%, 100% { d: path("M0,50 C150,20 350,80 500,50 C650,20 850,80 1000,50 L1000,100 L0,100 Z"); }
      50%       { d: path("M0,50 C150,80 350,20 500,50 C650,80 850,20 1000,50 L1000,100 L0,100 Z"); }
    }
    @keyframes particleDrift {
      0%   { transform: translate(0,0) scale(1); opacity: 0.6; }
      33%  { transform: translate(12px,-18px) scale(1.3); opacity: 1; }
      66%  { transform: translate(-8px,-30px) scale(0.8); opacity: 0.4; }
      100% { transform: translate(4px,-50px) scale(0.3); opacity: 0; }
    }
    @keyframes countUp {
      from { transform: translateY(100%); opacity: 0; }
      to   { transform: translateY(0); opacity: 1; }
    }
    @keyframes progressFill {
      from { width: 0%; }
    }

    .animate-fadeUp      { animation: fadeUp 0.45s var(--ease-spring) forwards; }
    .animate-fadeIn      { animation: fadeIn 0.3s ease forwards; }
    .animate-scaleIn     { animation: scaleIn 0.35s var(--ease-back) forwards; }
    .animate-slideRight  { animation: slideInRight 0.4s var(--ease-spring) forwards; }
    .animate-slideLeft   { animation: slideInLeft 0.4s var(--ease-spring) forwards; }
    .animate-pulse-glow  { animation: pulse-glow 2s ease-in-out infinite; }
    .animate-float       { animation: float 3s ease-in-out infinite; }
    .animate-spin-slow   { animation: spin-slow 8s linear infinite; }
    .animate-ticker      { animation: ticker 1s ease-in-out infinite; }
    .animate-shimmer {
      background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%);
      background-size: 200% auto;
      animation: shimmer 2s linear infinite;
    }
    .stagger-1 { animation-delay: 0.05s; opacity: 0; }
    .stagger-2 { animation-delay: 0.1s; opacity: 0; }
    .stagger-3 { animation-delay: 0.15s; opacity: 0; }
    .stagger-4 { animation-delay: 0.2s; opacity: 0; }
    .stagger-5 { animation-delay: 0.25s; opacity: 0; }

    /* Magnetic button effect */
    .btn-magnetic {
      transition: all 0.35s var(--ease-spring);
      position: relative;
      overflow: hidden;
    }
    .btn-magnetic::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      opacity: 0;
      transition: opacity 0.3s ease;
      background: radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, transparent 70%);
    }
    .btn-magnetic:hover::after { opacity: 1; }
    .btn-magnetic:hover { transform: translateY(-2px) scale(1.02); }
    .btn-magnetic:active { transform: translateY(0) scale(0.97); }

    /* Glass card */
    .glass {
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
    }
    .glass-dark {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(148, 163, 184, 0.08);
    }
    .glass-light {
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(0, 0, 0, 0.08);
    }

    /* Task card hover */
    .task-card {
      transition: all 0.35s var(--ease-spring);
    }
    .task-card:hover {
      transform: translateY(-3px) scale(1.005);
    }

    /* Calendar cell */
    .cal-cell {
      transition: all 0.25s var(--ease-spring);
    }
    .cal-cell:hover {
      transform: scale(1.04);
      z-index: 10;
    }

    /* Nav item */
    .nav-item {
      transition: all 0.3s var(--ease-spring);
      position: relative;
    }
    .nav-item::before {
      content: '';
      position: absolute;
      left: 0; top: 50%;
      width: 3px; height: 0;
      border-radius: 0 2px 2px 0;
      background: currentColor;
      transform: translateY(-50%);
      transition: height 0.3s var(--ease-spring);
    }
    .nav-item.active::before { height: 60%; }

    /* Progress bar animation */
    .progress-bar {
      animation: progressFill 0.8s var(--ease-spring) forwards;
    }

    /* Ripple */
    .ripple-container { position: relative; overflow: hidden; }
    .ripple-effect {
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,0.3);
      animation: ripple 0.7s ease-out forwards;
      pointer-events: none;
    }

    /* Timer digits */
    .timer-digit {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
    }

    /* Focus overlay */
    .focus-overlay {
      backdrop-filter: blur(40px) brightness(0.3);
      -webkit-backdrop-filter: blur(40px) brightness(0.3);
    }

    /* Noise texture overlay */
    .noise::before {
      content: '';
      position: absolute;
      inset: 0;
      opacity: 0.03;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      pointer-events: none;
    }

    /* Empty state particles */
    .particle {
      animation: particleDrift 4s ease-in-out infinite;
    }
    .particle:nth-child(2) { animation-delay: 0.8s; animation-duration: 5s; }
    .particle:nth-child(3) { animation-delay: 1.6s; animation-duration: 3.5s; }
    .particle:nth-child(4) { animation-delay: 2.4s; animation-duration: 4.5s; }

    /* Input styling */
    .form-input {
      transition: all 0.3s var(--ease-spring);
      outline: none;
    }
    .form-input:focus {
      box-shadow: 0 0 0 2px var(--focus-ring, rgba(139,92,246,0.4));
      border-color: var(--focus-border, rgba(139,92,246,0.6));
    }

    /* Checkbox */
    .task-checkbox {
      transition: all 0.3s var(--ease-back);
    }
    .task-checkbox:checked {
      animation: scaleIn 0.3s var(--ease-back);
    }

    /* Tooltip */
    .tooltip-text {
      visibility: hidden;
      opacity: 0;
      transition: all 0.2s ease;
    }
    .tooltip:hover .tooltip-text {
      visibility: visible;
      opacity: 1;
    }

    /* Mobile menu */
    .mobile-menu {
      transition: transform 0.4s var(--ease-spring), opacity 0.3s ease;
    }
    .mobile-menu.closed {
      transform: translateX(-100%);
      opacity: 0;
      pointer-events: none;
    }
    .mobile-menu.open {
      transform: translateX(0);
      opacity: 1;
    }

    /* Subject card glow on hover */
    .subject-card { transition: all 0.4s var(--ease-spring); }
    .subject-card:hover { transform: translateY(-4px); }

    /* Pomodoro ring */
    .pomodoro-ring {
      transition: stroke-dashoffset 0.5s var(--ease-smooth);
    }

    /* Analytics bar */
    .analytics-bar {
      transition: width 1s var(--ease-spring);
    }
  `}</style>
);

// ─── ANIMATED LOGO ────────────────────────────────────────────────────────────
function AnimatedLogo({ size = 36 }) {
  return (
    <div style={{ width: size, height: size, flexShrink: 0 }}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        <defs>
          <linearGradient id="logoGrad1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="logoGrad2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
          <filter id="logoGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Background rounded square */}
        <rect width="40" height="40" rx="10" fill="url(#logoGrad1)" />

        {/* Animated orbit ring */}
        <circle cx="20" cy="20" r="11" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none">
          <animate attributeName="r" values="11;12;11" dur="3s" repeatCount="indefinite" />
        </circle>

        {/* Checklist lines */}
        <rect x="16" y="12" width="10" height="1.8" rx="0.9" fill="white" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.5;0.9" dur="2.5s" repeatCount="indefinite" />
        </rect>
        <rect x="16" y="17" width="8" height="1.8" rx="0.9" fill="white" opacity="0.7">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" begin="0.3s" repeatCount="indefinite" />
        </rect>
        <rect x="16" y="22" width="9" height="1.8" rx="0.9" fill="white" opacity="0.6">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" begin="0.6s" repeatCount="indefinite" />
        </rect>
        <rect x="16" y="27" width="6" height="1.8" rx="0.9" fill="white" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2.2s" begin="0.9s" repeatCount="indefinite" />
        </rect>

        {/* Animated checkmarks */}
        <g filter="url(#logoGlow)">
          {/* Check 1 - solid */}
          <path d="M11 13 L13.2 15.2 L15.5 12" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <animate attributeName="stroke-dasharray" values="0 20;20 20" dur="0.6s" fill="freeze" />
          </path>
          {/* Check 2 - animated pulse */}
          <path d="M11 18 L13.2 20.2 L15.5 17" stroke="rgba(167,139,250,1)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <animate attributeName="stroke" values="rgba(167,139,250,1);white;rgba(167,139,250,1)" dur="2s" repeatCount="indefinite" />
          </path>
          {/* Check 3 - orbiting dot */}
          <circle r="1.2" fill="rgba(255,255,255,0.6)">
            <animateMotion dur="4s" repeatCount="indefinite" path="M11,22 L13.2,24.2 L15.5,21" />
          </circle>
        </g>

        {/* Orbiting dot around the whole logo */}
        <circle r="1.5" fill="rgba(255,255,255,0.8)" filter="url(#logoGlow)">
          <animateMotion dur="3s" repeatCount="indefinite">
            <mpath href="#orbitPath" />
          </animateMotion>
        </circle>
        <path id="orbitPath" d="M20,8 A12,12 0 1,1 19.99,8" fill="none" />
      </svg>
    </div>
  );
}

// ─── SUPABASE ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://vwohpwoexrfrruoyyjoj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3b2hwd29leHJmcnJ1b3l5am9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3OTA3NTUsImV4cCI6MjA5NTM2Njc1NX0.jSpmBPi2vjdg-caXfYgg5BdT1LBAPC74E0ut-SIXN-g";

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function dbGetTasks() {
  return await sbFetch("tasks?order=created_at.desc");
}
async function dbInsertTask(task) {
  return await sbFetch("tasks", {
    method: "POST",
    body: JSON.stringify({
      id: task.id,
      title: task.title,
      description: task.description || "",
      due_date: task.dueDate,
      priority: task.priority,
      status: task.status,
      subject: task.subject,
      created_at: task.createdAt || new Date().toISOString(),
    }),
  });
}
async function dbUpdateTask(task) {
  return await sbFetch(`tasks?id=eq.${task.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      title: task.title,
      description: task.description || "",
      due_date: task.dueDate,
      priority: task.priority,
      status: task.status,
      subject: task.subject,
    }),
  });
}
async function dbDeleteTask(id) {
  return await sbFetch(`tasks?id=eq.${id}`, {
    method: "DELETE",
    prefer: "return=minimal",
  });
}

function dbToTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    priority: row.priority,
    status: row.status,
    subject: row.subject,
    createdAt: row.created_at,
  };
}

// ─── STORAGE (localStorage for non-task state) ─────────────────────────────────
function useLocalStorage(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : initial;
    } catch { return initial; }
  });
  const set = useCallback((v) => {
    setState(prev => {
      const next = typeof v === "function" ? v(prev) : v;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);
  return [state, set];
}

// ─── TASK FORM MODAL ──────────────────────────────────────────────────────────
function TaskModal({ task, onSave, onClose, dark }) {
  const blank = { id: null, title: "", description: "", dueDate: today(), priority: "medium", status: "pending", subject: "statistics" };
  const [form, setForm] = useState(task || blank);
  const sub = getSubject(form.subject);

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  function handleSave() {
    if (!form.title.trim()) return;
    onSave({ ...form, id: form.id || uuid(), createdAt: form.createdAt || new Date().toISOString() });
    onClose();
  }

  const base = dark
    ? "bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-violet-500/60"
    : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-violet-400";
  const labelCls = dark ? "text-slate-400 text-xs font-medium uppercase tracking-wider" : "text-slate-500 text-xs font-medium uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className={`relative w-full max-w-lg rounded-2xl glass ${dark ? "glass-dark" : "glass-light"} shadow-2xl animate-scaleIn overflow-hidden`}>
        {/* Header */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${sub.gradient}`} />
        <div className="p-6 pb-2 flex items-center justify-between">
          <div>
            <h2 className={`text-lg font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{form.id ? "Edit Task" : "New Task"}</h2>
            <p className={`text-sm mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>Add details for your task</p>
          </div>
          <button onClick={onClose} className={`w-8 h-8 flex items-center justify-center rounded-lg btn-magnetic ${dark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}>✕</button>
        </div>

        <div className="p-6 pt-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Subject */}
          <div>
            <label className={labelCls}>Subject</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {SUBJECTS.map(s => (
                <button key={s.id} onClick={() => set("subject", s.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 btn-magnetic ${form.subject === s.id ? `${s.badge} border` : dark ? "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500" : "bg-slate-100 border-slate-200 text-slate-600"}`}>
                  <span>{s.icon}</span>{s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className={labelCls}>Title *</label>
            <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Task title…" className={`form-input mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm ${base}`} />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Add a description…" rows={3} className={`form-input mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm resize-none ${base}`} />
          </div>

          {/* Row: Due Date + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} className={`form-input mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm ${base}`} />
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <div className="mt-1.5 flex gap-1.5">
                {PRIORITIES.map(p => (
                  <button key={p.id} onClick={() => set("priority", p.id)} className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all duration-200 btn-magnetic ${form.priority === p.id ? `${p.bg} ${p.color} border` : dark ? "bg-slate-800 border-slate-700 text-slate-500" : "bg-slate-100 border-slate-200 text-slate-400"}`}>{p.label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className={labelCls}>Status</label>
            <div className="mt-1.5 flex gap-2">
              {STATUSES.map(s => (
                <button key={s.id} onClick={() => set("status", s.id)} className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all duration-200 btn-magnetic ${form.status === s.id ? `${s.bg} ${s.color} border` : dark ? "bg-slate-800 border-slate-700 text-slate-500" : "bg-slate-100 border-slate-200 text-slate-400"}`}>{s.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 pt-2 flex gap-3">
          <button onClick={onClose} className={`flex-1 py-2.5 rounded-xl text-sm font-medium btn-magnetic transition-all ${dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Cancel</button>
          <button onClick={handleSave} className={`flex-1 py-2.5 rounded-xl text-sm font-medium btn-magnetic text-white bg-gradient-to-r ${sub.gradient} shadow-lg ${sub.glow}`}>
            {form.id ? "Save Changes" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyState({ subject, onAdd, dark }) {
  const sub = subject ? getSubject(subject) : null;
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fadeUp">
      <div className="relative mb-6">
        <div className={`w-24 h-24 rounded-full ${dark ? "bg-slate-800" : "bg-slate-100"} flex items-center justify-center text-4xl animate-float`}>
          {sub ? sub.icon : "✨"}
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`particle absolute w-2 h-2 rounded-full ${dark ? "bg-violet-500/60" : "bg-violet-400/60"}`}
            style={{ left: `${20 + i * 20}%`, top: `${20 + (i % 2) * 40}%` }} />
        ))}
      </div>
      <h3 className={`text-lg font-semibold mb-2 ${dark ? "text-slate-300" : "text-slate-700"}`}>No tasks yet</h3>
      <p className={`text-sm max-w-xs mb-6 ${dark ? "text-slate-500" : "text-slate-400"}`}>
        {sub ? `Start adding ${sub.label} tasks to track your progress` : "Create your first task to get started"}
      </p>
      {onAdd && (
        <button onClick={onAdd} className={`px-5 py-2.5 rounded-xl text-sm font-medium text-white btn-magnetic ${sub ? `bg-gradient-to-r ${sub.gradient}` : "bg-gradient-to-r from-violet-500 to-purple-600"} shadow-lg`}>
          + Add First Task
        </button>
      )}
    </div>
  );
}

// ─── TASK CARD ────────────────────────────────────────────────────────────────
function TaskCard({ task, onEdit, onDelete, onStatusChange, dark, index }) {
  const sub = getSubject(task.subject);
  const pri = PRIORITIES.find(p => p.id === task.priority);
  const sta = STATUSES.find(s => s.id === task.status);
  const isOverdue = task.dueDate < today() && task.status !== "completed";
  const isDueToday = task.dueDate === today();

  function addRipple(e) {
    const card = e.currentTarget.closest(".task-card");
    if (!card) return;
    const ripple = document.createElement("span");
    const rect = card.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
    ripple.className = "ripple-effect";
    card.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  }

  return (
    <div className={`task-card glass ripple-container rounded-2xl p-4 border transition-all animate-fadeUp stagger-${Math.min(index + 1, 5)} ${dark ? `glass-dark ${isOverdue ? "border-rose-500/30" : `${sub.border}`}` : `glass-light ${isOverdue ? "border-rose-300" : "border-slate-200"}`} ${task.status === "completed" ? "opacity-60" : ""}`}
      style={{ "--glow-color": `${sub.hex}33` }}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button onClick={(e) => { addRipple(e); onStatusChange(task.id, task.status === "completed" ? "pending" : "completed"); }}
          className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded-md border-2 flex items-center justify-center task-checkbox btn-magnetic transition-all ${task.status === "completed" ? `border-transparent ${sub.bar.replace("bg-gradient-to-r","").split(" ").join(" ")} bg-gradient-to-r ${sub.gradient}` : dark ? "border-slate-600 hover:border-slate-400" : "border-slate-300 hover:border-slate-500"}`}>
          {task.status === "completed" && <span className="text-white text-xs">✓</span>}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-medium text-sm leading-snug ${task.status === "completed" ? "line-through" : ""} ${dark ? "text-slate-200" : "text-slate-800"}`}>{task.title}</h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={onEdit} className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs btn-magnetic ${dark ? "hover:bg-slate-700 text-slate-500 hover:text-slate-300" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"}`}>✏</button>
              <button onClick={onDelete} className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs btn-magnetic ${dark ? "hover:bg-rose-500/20 text-slate-500 hover:text-rose-400" : "hover:bg-rose-50 text-slate-400 hover:text-rose-500"}`}>🗑</button>
            </div>
          </div>

          {task.description && (
            <p className={`text-xs mt-1 line-clamp-2 ${dark ? "text-slate-500" : "text-slate-500"}`}>{task.description}</p>
          )}

          <div className="mt-2.5 flex items-center flex-wrap gap-1.5">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${sub.badge}`}>
              {sub.icon} {sub.label}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${pri.bg} ${pri.color}`}>{pri.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${sta.bg} ${sta.color}`}>{sta.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ml-auto ${isOverdue ? "text-rose-400 bg-rose-500/20 border border-rose-500/30" : isDueToday ? "text-amber-400 bg-amber-500/20 border border-amber-500/30" : dark ? "text-slate-500 bg-slate-800 border-slate-700" : "text-slate-500 bg-slate-100 border-slate-200"}`}>
              {isOverdue ? "⚠ " : isDueToday ? "⏰ " : "📅 "}
              {task.dueDate}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FOCUS TIMER ──────────────────────────────────────────────────────────────
function FocusView({ dark, tasks }) {
  const [running, setRunning] = useLocalStorage("ypt_running", false);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [activeSubject, setActiveSubject] = useLocalStorage("ypt_subject", "statistics");
  // Permanent session log — fuels the Insights "study hours per day" chart and is
  // NEVER cleared automatically. Each entry: { subject, duration(seconds), date, type }.
  const [history, setHistory] = useLocalStorage("ypt_history", []);
  const [fullscreen, setFullscreen] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState(false);
  const [pomodoroLen, setPomodoroLen] = useState(25);
  const [breakLen, setBreakLen] = useState(5);
  const [onBreak, setOnBreak] = useState(false);
  const [pomodoroElapsed, setPomodoroElapsed] = useState(0);
  const [pomodoroCount, setPomodoroCount] = useLocalStorage("ypt_pomo_count", 0);
  const [dailyTarget, setDailyTarget] = useLocalStorage("ypt_daily_target", 14400); // 4 hrs
  const startTimeRef = useRef(0);
  // Live config snapshot read by the ticking interval — avoids stale closures so the
  // interval is created ONCE per run and never drifts when mode/phase/subject changes.
  const cfgRef = useRef({});
  cfgRef.current = { pomodoroMode, onBreak, pomodoroLen, breakLen, activeSubject };

  const sub = getSubject(activeSubject);
  const todayStr = today();

  // Single interval, subscribed only to `running`. All mutable config comes from cfgRef,
  // so a pomodoro phase flip (focus → break) keeps the same anchor and counts smoothly.
  useEffect(() => {
    if (!running) return;
    startTimeRef.current = Date.now() - sessionElapsed * 1000;
    const id = setInterval(() => {
      const cfg = cfgRef.current;
      setSessionElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      if (cfg.pomodoroMode) {
        setPomodoroElapsed(prev => {
          const total = (cfg.onBreak ? cfg.breakLen : cfg.pomodoroLen) * 60;
          const next = prev + 1;
          if (next >= total) {
            // A focus round just finished → bank it permanently. Breaks are not logged.
            if (!cfg.onBreak) {
              setPomodoroCount(c => c + 1);
              setHistory(h => [...h, { subject: cfg.activeSubject, duration: cfg.pomodoroLen * 60, date: today(), type: "pomodoro" }]);
            }
            setOnBreak(b => !b);
            return 0;
          }
          return next;
        });
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // Bank whatever live study time exists, then clear the live counters. Avoids
  // double-counting: completed pomodoro rounds are already logged, so on pause we
  // only log the in-progress focus phase (never an active break).
  function logCurrentSession() {
    if (pomodoroMode) {
      if (!onBreak && pomodoroElapsed > 0) {
        setHistory(h => [...h, { subject: activeSubject, duration: pomodoroElapsed, date: today(), type: "pomodoro" }]);
      }
    } else if (sessionElapsed > 0) {
      setHistory(h => [...h, { subject: activeSubject, duration: sessionElapsed, date: today(), type: "manual" }]);
    }
    setSessionElapsed(0);
    setPomodoroElapsed(0);
  }

  function toggle() {
    if (running) logCurrentSession();
    setRunning(r => !r);
  }
  // Reset discards the current unlogged session and the phase, but never touches the
  // permanent history (so Insights and past days stay intact).
  function reset() {
    setRunning(false);
    setSessionElapsed(0);
    setPomodoroElapsed(0);
    setOnBreak(false);
  }

  function fmt(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`
      : `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  }

  const pomodoroTotal = onBreak ? breakLen * 60 : pomodoroLen * 60;
  const pomodoroProgress = pomodoroMode ? (pomodoroElapsed / pomodoroTotal) : (sessionElapsed / Math.max(sessionElapsed, 1));
  const pomodoroCircumference = 2 * Math.PI * 45;
  const strokeDashoffset = pomodoroCircumference * (1 - (pomodoroMode ? pomodoroElapsed / pomodoroTotal : 0));

  // ── Focus stats: TODAY ONLY (resets at midnight automatically) ──
  // Live, not-yet-logged study seconds: the running stopwatch, or the in-progress
  // pomodoro focus phase (breaks don't count as study time).
  const liveOngoing = running ? (pomodoroMode ? (onBreak ? 0 : pomodoroElapsed) : sessionElapsed) : 0;
  const loggedToday = history.filter(h => h.date === todayStr).reduce((a, b) => a + b.duration, 0);
  const elapsed = loggedToday + liveOngoing; // today's total study seconds
  const dailyProgress = Math.min(elapsed / dailyTarget, 1);

  // Per-subject study times for TODAY (Live Study Room) — also resets daily.
  const subjectTimes = SUBJECTS.map(s => {
    let total = history.filter(h => h.date === todayStr && h.subject === s.id).reduce((a, b) => a + b.duration, 0);
    if (running && activeSubject === s.id) total += liveOngoing;
    return { ...s, total };
  });
  const maxTime = Math.max(...subjectTimes.map(s => s.total), 1);

  const TimerDisplay = ({ big = false }) => (
    <div className="flex flex-col items-center">
      <div className={`relative ${big ? "w-52 h-52" : "w-40 h-40"}`}>
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke={dark ? "rgba(148,163,184,0.1)" : "rgba(0,0,0,0.06)"} strokeWidth="3" />
          <circle cx="50" cy="50" r="45" fill="none" stroke={sub.hex} strokeWidth="3"
            strokeDasharray={pomodoroCircumference}
            strokeDashoffset={pomodoroMode ? strokeDashoffset : pomodoroCircumference * (1 - (sessionElapsed % 3600) / 3600)}
            strokeLinecap="round"
            className="pomodoro-ring transition-all duration-500" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`timer-digit ${big ? "text-5xl" : "text-3xl"} font-bold ${running ? "animate-ticker" : ""} ${dark ? "text-white" : "text-slate-900"}`}
            style={{ color: running ? sub.hex : undefined }}>
            {pomodoroMode ? fmt(pomodoroElapsed) : fmt(sessionElapsed)}
          </div>
          {pomodoroMode && (
            <div className={`text-xs mt-1 font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>
              {onBreak ? "🍵 Break" : `🍅 Round ${pomodoroCount + 1}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (fullscreen) return (
    <div className="fixed inset-0 z-50 focus-overlay bg-slate-950 flex flex-col items-center justify-center animate-fadeIn"
      style={{ "--glow-color": `${sub.hex}44` }}>
      <div className="animate-pulse-glow absolute inset-0 rounded-full" style={{ background: `radial-gradient(ellipse 60% 40% at 50% 50%, ${sub.hex}15, transparent)` }} />
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="text-center">
          <div className="text-5xl mb-3">{sub.icon}</div>
          <h2 className="text-2xl font-bold text-white">{sub.label}</h2>
          <p className="text-slate-400 text-sm mt-1">Focus Mode Active</p>
        </div>
        <TimerDisplay big />
        <div className="flex gap-4">
          <button onClick={toggle} className={`px-8 py-3 rounded-2xl font-semibold text-white btn-magnetic shadow-2xl bg-gradient-to-r ${sub.gradient}`}>
            {running ? "⏸ Pause" : "▶ Resume"}
          </button>
          <button onClick={() => setFullscreen(false)} className="px-6 py-3 rounded-2xl font-medium text-slate-400 btn-magnetic hover:bg-white/10">Exit</button>
        </div>
        <div className="text-center">
          <div className="text-slate-500 text-xs mb-2">Today's Total</div>
          <div className="timer-digit text-3xl font-bold" style={{ color: sub.hex }}>{fmt(elapsed)}</div>
          <div className="mt-3 w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${dailyProgress * 100}%`, background: `linear-gradient(90deg, ${sub.hex}, ${sub.hex}aa)` }} />
          </div>
          <div className="text-slate-600 text-xs mt-1">{Math.round(dailyProgress * 100)}% of daily goal</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeUp">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>YPT Focus Engine</h2>
          <p className={`text-sm mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>Elite study tracker inspired by Yeolpumta</p>
        </div>
        <button onClick={() => { if (!running) setRunning(true); setFullscreen(true); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium btn-magnetic text-white bg-gradient-to-r ${sub.gradient}`}>
          ⛶ Full Screen
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timer */}
        <div className={`lg:col-span-2 glass rounded-2xl p-6 border ${dark ? "glass-dark" : "glass-light"}`}
          style={{ "--glow-color": `${sub.hex}33` }}>
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3 self-start w-full">
              <div className={`text-sm font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>Active Subject</div>
              <div className="flex flex-wrap gap-1.5">
                {SUBJECTS.map(s => (
                  <button key={s.id} onClick={() => { if (!running) setActiveSubject(s.id); }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border btn-magnetic transition-all ${activeSubject === s.id ? `${s.badge} border` : dark ? "bg-slate-800 border-slate-700 text-slate-500" : "bg-slate-100 border-slate-200 text-slate-400"}`}>
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>

            <TimerDisplay />

            {/* Mode toggle */}
            <div className={`flex rounded-xl p-1 ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
              <button onClick={() => { setPomodoroMode(false); setPomodoroElapsed(0); }} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all btn-magnetic ${!pomodoroMode ? `text-white bg-gradient-to-r ${sub.gradient}` : dark ? "text-slate-400" : "text-slate-500"}`}>Stopwatch</button>
              <button onClick={() => { setPomodoroMode(true); setPomodoroElapsed(0); }} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all btn-magnetic ${pomodoroMode ? `text-white bg-gradient-to-r ${sub.gradient}` : dark ? "text-slate-400" : "text-slate-500"}`}>🍅 Pomodoro</button>
            </div>

            {pomodoroMode && (
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className={`text-xs mb-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>Focus (min)</div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPomodoroLen(l => Math.max(1, l - 5))} className={`w-6 h-6 rounded-lg btn-magnetic ${dark ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600"}`}>-</button>
                    <span className={`w-8 text-center text-sm font-mono font-bold ${dark ? "text-white" : "text-slate-900"}`}>{pomodoroLen}</span>
                    <button onClick={() => setPomodoroLen(l => Math.min(60, l + 5))} className={`w-6 h-6 rounded-lg btn-magnetic ${dark ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600"}`}>+</button>
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-xs mb-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>Break (min)</div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setBreakLen(l => Math.max(1, l - 1))} className={`w-6 h-6 rounded-lg btn-magnetic ${dark ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600"}`}>-</button>
                    <span className={`w-8 text-center text-sm font-mono font-bold ${dark ? "text-white" : "text-slate-900"}`}>{breakLen}</span>
                    <button onClick={() => setBreakLen(l => Math.min(30, l + 1))} className={`w-6 h-6 rounded-lg btn-magnetic ${dark ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600"}`}>+</button>
                  </div>
                </div>
                <div className={`text-sm px-3 py-1 rounded-lg ${dark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>🍅 × {pomodoroCount}</div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={toggle}
                className={`px-8 py-3 rounded-2xl font-semibold text-white btn-magnetic shadow-lg bg-gradient-to-r ${sub.gradient} ${running ? `animate-pulse-glow` : ""}`}
                style={{ "--glow-color": `${sub.hex}44` }}>
                {running ? "⏸ Pause" : sessionElapsed > 0 ? "▶ Resume" : "▶ Start"}
              </button>
              <button onClick={reset} className={`px-5 py-3 rounded-2xl font-medium btn-magnetic ${dark ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>↺ Reset</button>
            </div>

            {/* Daily progress */}
            <div className="w-full">
              <div className="flex justify-between text-xs mb-1.5">
                <span className={dark ? "text-slate-400" : "text-slate-500"}>Daily Goal Progress</span>
                <span className={dark ? "text-slate-300" : "text-slate-700"}>{fmt(elapsed)} / {fmt(dailyTarget)}</span>
              </div>
              <div className={`h-2 rounded-full ${dark ? "bg-slate-800" : "bg-slate-200"} overflow-hidden`}>
                <div className="h-full rounded-full transition-all duration-1000 progress-bar" style={{ width: `${dailyProgress * 100}%`, background: `linear-gradient(90deg, ${sub.hex}, ${sub.hex}99)` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className={`text-xs ${dark ? "text-slate-600" : "text-slate-400"}`}>{Math.round(dailyProgress * 100)}%</span>
                <div className="flex items-center gap-1">
                  <span className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>Target (hrs):</span>
                  <select value={dailyTarget / 3600} onChange={e => setDailyTarget(Number(e.target.value) * 3600)}
                    className={`text-xs rounded-lg px-1 py-0.5 border ${dark ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-white border-slate-200 text-slate-600"}`}>
                    {[2, 3, 4, 5, 6, 8, 10].map(h => <option key={h} value={h}>{h}h</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Study Room */}
        <div className={`glass rounded-2xl p-5 border ${dark ? "glass-dark" : "glass-light"}`}>
          <h3 className={`text-sm font-semibold mb-4 ${dark ? "text-slate-300" : "text-slate-700"}`}>📡 Live Study Room <span className={`font-normal ${dark ? "text-slate-500" : "text-slate-400"}`}>· Today</span></h3>
          {running && (
            <div className={`mb-4 flex items-center gap-3 p-3 rounded-xl border ${sub.bg} ${sub.border}`}>
              <div className={`w-2.5 h-2.5 rounded-full animate-pulse-glow flex-shrink-0`} style={{ background: sub.hex }} />
              <div>
                <div className={`text-xs font-semibold ${sub.text}`}>Live: {sub.label}</div>
                <div className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>Session: {fmt(sessionElapsed)}</div>
              </div>
            </div>
          )}
          <div className="space-y-2.5">
            {subjectTimes.map(s => (
              <div key={s.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={`flex items-center gap-1 ${s.text}`}>{s.icon} {s.label}</span>
                  <span className={`font-mono ${dark ? "text-slate-400" : "text-slate-500"}`}>{fmt(s.total)}</span>
                </div>
                <div className={`h-1.5 rounded-full ${dark ? "bg-slate-800" : "bg-slate-200"} overflow-hidden`}>
                  <div className={`h-full rounded-full analytics-bar ${s.bar}`} style={{ width: `${(s.total / maxTime) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          {history.length > 0 && (
            <div className="mt-4">
              <div className={`text-xs font-medium mb-2 ${dark ? "text-slate-400" : "text-slate-500"}`}>Recent Sessions</div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {[...history].reverse().slice(0, 8).map((h, i) => {
                  const s = getSubject(h.subject);
                  return (
                    <div key={i} className={`flex items-center justify-between text-xs p-2 rounded-lg ${dark ? "bg-slate-800/60" : "bg-slate-50"}`}>
                      <span className={`flex items-center gap-1 ${s.text}`}>{s.icon} {s.label}</span>
                      <span className={`font-mono ${dark ? "text-slate-400" : "text-slate-500"}`}>{fmt(h.duration)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {history.length > 0 && (
            <button onClick={() => { if(confirm("Clear session history?")) setHistory([]); }}
              className={`mt-3 w-full text-xs py-1.5 rounded-lg btn-magnetic ${dark ? "text-slate-500 hover:bg-rose-500/10 hover:text-rose-400" : "text-slate-400 hover:bg-rose-50 hover:text-rose-500"}`}>
              Clear History
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CALENDAR VIEW ────────────────────────────────────────────────────────────
function CalendarView({ tasks, dark, onEdit, onAdd }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array(daysInMonth).fill(null).map((_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  function dateStr(d) {
    if (!d) return null;
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  function tasksFor(d) {
    const ds = dateStr(d);
    return ds ? tasks.filter(t => t.dueDate === ds) : [];
  }

  const todayStr = today();

  return (
    <div className="animate-fadeUp">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center btn-magnetic ${dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>‹</button>
          <h2 className={`text-xl font-bold min-w-36 text-center ${dark ? "text-white" : "text-slate-900"}`}>{MONTHS[month]} {year}</h2>
          <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center btn-magnetic ${dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>›</button>
        </div>
        <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }}
          className={`text-xs px-3 py-1.5 rounded-lg btn-magnetic ${dark ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>Today</button>
      </div>

      <div className={`glass rounded-2xl overflow-hidden border ${dark ? "glass-dark" : "glass-light"}`}>
        {/* Day headers */}
        <div className="grid grid-cols-7">
          {DAYS.map(d => (
            <div key={d} className={`text-center py-3 text-xs font-semibold uppercase tracking-wider ${dark ? "text-slate-500 border-b border-slate-800" : "text-slate-400 border-b border-slate-200"}`}>{d}</div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7 divide-x divide-y" style={{ borderColor: dark ? "rgba(51,65,85,0.4)" : "rgba(226,232,240,0.8)" }}>
          {cells.map((d, i) => {
            const ts = tasksFor(d);
            const isToday = dateStr(d) === todayStr;
            return (
              <div key={i} onClick={() => d && onAdd(dateStr(d))}
                className={`cal-cell min-h-24 p-2 cursor-pointer relative ${d ? dark ? "hover:bg-slate-800/60" : "hover:bg-slate-50" : ""} ${!d ? dark ? "bg-slate-900/30" : "bg-slate-50/50" : ""}`}>
                {d && (
                  <>
                    <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1.5 ${isToday ? "bg-violet-500 text-white shadow-lg shadow-violet-500/40" : dark ? "text-slate-400" : "text-slate-600"}`}>{d}</div>
                    <div className="space-y-0.5">
                      {ts.slice(0, 3).map(t => {
                        const s = getSubject(t.subject);
                        return (
                          <div key={t.id} onClick={e => { e.stopPropagation(); onEdit(t); }}
                            className={`text-xs px-1.5 py-0.5 rounded-md truncate border ${s.badge} btn-magnetic`} title={t.title}>
                            {t.title}
                          </div>
                        );
                      })}
                      {ts.length > 3 && <div className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>+{ts.length - 3} more</div>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4">
        {SUBJECTS.map(s => (
          <div key={s.id} className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded-sm" style={{ background: s.hex }} />
            <span className={dark ? "text-slate-400" : "text-slate-500"}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── INSIGHTS VIEW ────────────────────────────────────────────────────────────
function InsightsView({ tasks, dark }) {
  // Permanent study log written by the Focus engine — never reset, so it accumulates
  // across days. (Same localStorage key the Focus view uses.)
  const [studyHistory] = useLocalStorage("ypt_history", []);

  const completedBySubject = SUBJECTS.map(s => {
    const all = tasks.filter(t => t.subject === s.id);
    const done = all.filter(t => t.status === "completed");
    return { ...s, total: all.length, done: done.length, rate: all.length ? done.length / all.length : 0 };
  });

  // Study hours for the last 7 days (from the permanent focus history)
  const last7 = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
  const studyByDay = last7.map(d => {
    const seconds = studyHistory.filter(h => h.date === d).reduce((a, b) => a + b.duration, 0);
    return {
      date: d,
      label: new Date(d).toLocaleDateString("en", { weekday: "short" }),
      seconds,
      hours: seconds / 3600,
    };
  });
  const maxStudySecs = Math.max(...studyByDay.map(d => d.seconds), 1);
  const weekStudySecs = studyByDay.reduce((a, b) => a + b.seconds, 0);
  const avgStudySecs = weekStudySecs / 7;
  const fmtHrs = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h === 0 && m === 0) return "0m";
    return `${h > 0 ? `${h}h ` : ""}${m > 0 ? `${m}m` : ""}`.trim();
  };

  // Weekly velocity (last 7 days)
  const weekDays = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
  const weeklyData = weekDays.map(d => ({
    date: d,
    label: new Date(d).toLocaleDateString("en", { weekday: "short" }),
    count: tasks.filter(t => t.dueDate === d && t.status === "completed").length,
    total: tasks.filter(t => t.dueDate === d).length,
  }));
  const maxCount = Math.max(...weeklyData.map(d => d.total), 1);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const overdueTasks = tasks.filter(t => t.dueDate < today() && t.status !== "completed").length;
  const dueTodayTasks = tasks.filter(t => t.dueDate === today() && t.status !== "completed").length;

  return (
    <div className="space-y-6 animate-fadeUp">
      <div>
        <h2 className={`text-2xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>Insights</h2>
        <p className={`text-sm mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>Track your progress across all subjects</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Tasks", val: totalTasks, icon: "📋", color: "from-violet-500 to-purple-600" },
          { label: "Completed", val: completedTasks, icon: "✅", color: "from-emerald-500 to-green-600" },
          { label: "Overdue", val: overdueTasks, icon: "⚠️", color: "from-rose-500 to-red-600" },
          { label: "Due Today", val: dueTodayTasks, icon: "📅", color: "from-amber-500 to-yellow-600" },
        ].map((s, i) => (
          <div key={i} className={`glass rounded-2xl p-4 border animate-fadeUp stagger-${i + 1} ${dark ? "glass-dark" : "glass-light"}`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-3xl font-bold font-mono bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.val}</div>
            <div className={`text-xs mt-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Study hours per day (from Focus engine) */}
      <div className={`glass rounded-2xl p-6 border ${dark ? "glass-dark" : "glass-light"}`}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className={`text-sm font-semibold ${dark ? "text-slate-300" : "text-slate-700"}`}>Study Hours · Last 7 Days</h3>
            <p className={`text-xs mt-0.5 ${dark ? "text-slate-500" : "text-slate-400"}`}>Tracked from your Focus sessions</p>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold font-mono ${dark ? "text-violet-400" : "text-violet-600"}`}>{fmtHrs(weekStudySecs)}</div>
            <div className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>this week · ~{fmtHrs(avgStudySecs)}/day</div>
          </div>
        </div>
        <div className="flex items-end justify-between gap-2 h-40">
          {studyByDay.map((d, i) => {
            const isToday = d.date === today();
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full">
                <div className={`text-xs font-mono font-semibold ${d.seconds > 0 ? (dark ? "text-slate-300" : "text-slate-600") : (dark ? "text-slate-600" : "text-slate-300")}`}>
                  {d.seconds > 0 ? fmtHrs(d.seconds) : "–"}
                </div>
                <div className="flex-1 w-full flex items-end">
                  <div className="w-full rounded-t-lg transition-all duration-700"
                    style={{
                      height: `${Math.max((d.seconds / maxStudySecs) * 100, d.seconds > 0 ? 4 : 0)}%`,
                      minHeight: d.seconds > 0 ? "6px" : "0",
                      background: isToday
                        ? "linear-gradient(to top, #7c3aed, #a78bfa)"
                        : "linear-gradient(to top, #8b5cf6, #6366f1)",
                      boxShadow: d.seconds > 0 ? "0 0 12px rgba(139,92,246,0.35)" : "none",
                    }} />
                </div>
                <div className={`text-xs ${isToday ? (dark ? "text-violet-400 font-semibold" : "text-violet-600 font-semibold") : (dark ? "text-slate-500" : "text-slate-400")}`}>{d.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completion rate by subject */}
      <div className={`glass rounded-2xl p-6 border ${dark ? "glass-dark" : "glass-light"}`}>
        <h3 className={`text-sm font-semibold mb-5 ${dark ? "text-slate-300" : "text-slate-700"}`}>Completion Rate by Subject</h3>
        <div className="space-y-4">
          {completedBySubject.map(s => (
            <div key={s.id} className="animate-fadeUp">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span>{s.icon}</span>
                  <span className={`text-sm font-medium ${dark ? "text-slate-300" : "text-slate-700"}`}>{s.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>{s.done}/{s.total}</span>
                  <span className={`text-sm font-semibold font-mono ${s.text}`}>{Math.round(s.rate * 100)}%</span>
                </div>
              </div>
              <div className={`h-2.5 rounded-full ${dark ? "bg-slate-800" : "bg-slate-200"} overflow-hidden`}>
                <div className={`h-full rounded-full progress-bar ${s.bar}`} style={{ width: `${s.rate * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly velocity */}
      <div className={`glass rounded-2xl p-6 border ${dark ? "glass-dark" : "glass-light"}`}>
        <h3 className={`text-sm font-semibold mb-5 ${dark ? "text-slate-300" : "text-slate-700"}`}>Weekly Output Velocity</h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {weeklyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="flex-1 w-full flex items-end gap-0.5">
                {d.total > 0 && (
                  <div className="w-full rounded-t-lg transition-all duration-700 bg-violet-500/30" style={{ height: `${(d.total / maxCount) * 100}%` }} />
                )}
              </div>
              {d.count > 0 && (
                <div className="w-full rounded-t-lg -mb-1 transition-all duration-700 bg-gradient-to-t from-violet-600 to-violet-400 absolute" style={{ height: `${(d.count / maxCount) * 100}%`, position: "relative" }} />
              )}
              <div className="w-full relative flex items-end h-full">
                <div className="w-full rounded-t-lg transition-all duration-700"
                  style={{ height: `${Math.max((d.count / maxCount) * 100, d.count > 0 ? 8 : 0)}%`, background: `linear-gradient(to top, #8b5cf6, #7c3aed)`, minHeight: d.count > 0 ? "8px" : "0" }} />
              </div>
              <div className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>{d.label}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded-sm bg-violet-500/30" />
            <span className={dark ? "text-slate-500" : "text-slate-400"}>Total due</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded-sm bg-violet-600" />
            <span className={dark ? "text-slate-500" : "text-slate-400"}>Completed</span>
          </div>
        </div>
      </div>

      {/* Priority breakdown */}
      <div className={`glass rounded-2xl p-6 border ${dark ? "glass-dark" : "glass-light"}`}>
        <h3 className={`text-sm font-semibold mb-4 ${dark ? "text-slate-300" : "text-slate-700"}`}>Priority Breakdown</h3>
        <div className="grid grid-cols-3 gap-3">
          {PRIORITIES.map(p => {
            const count = tasks.filter(t => t.priority === p.id).length;
            const done = tasks.filter(t => t.priority === p.id && t.status === "completed").length;
            return (
              <div key={p.id} className={`rounded-xl p-4 border text-center ${p.bg} ${dark ? "" : "bg-opacity-30"}`}>
                <div className={`text-2xl font-bold font-mono ${p.color}`}>{count}</div>
                <div className={`text-xs font-medium mt-1 ${p.color}`}>{p.label}</div>
                <div className={`text-xs mt-0.5 ${dark ? "text-slate-500" : "text-slate-400"}`}>{done} done</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({ tasks, dark, onAdd, onView }) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const todayTasks = tasks.filter(t => t.dueDate === today() && t.status !== "completed");
  const overdueTasks = tasks.filter(t => t.dueDate < today() && t.status !== "completed");
  const overallProgress = totalTasks ? completedTasks / totalTasks : 0;

  return (
    <div className="space-y-6 animate-fadeUp">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"} ✦
          </h2>
          <p className={`text-sm mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>{new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <button onClick={() => onAdd()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white btn-magnetic bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30">
          + New Task
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { l: "Total", v: totalTasks, i: "📋", g: "from-slate-500 to-slate-600" },
          { l: "Completed", v: completedTasks, i: "✅", g: "from-emerald-500 to-green-600" },
          { l: "Due Today", v: todayTasks.length, i: "📅", g: "from-amber-500 to-yellow-600" },
          { l: "Overdue", v: overdueTasks.length, i: "⚠️", g: "from-rose-500 to-red-600" },
        ].map((s, i) => (
          <div key={i} className={`glass rounded-2xl p-4 border animate-fadeUp stagger-${i + 1} ${dark ? "glass-dark" : "glass-light"}`}>
            <div className="text-xl">{s.i}</div>
            <div className={`text-3xl font-bold font-mono mt-1 bg-gradient-to-r ${s.g} bg-clip-text text-transparent`}>{s.v}</div>
            <div className={`text-xs mt-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      <div className={`glass rounded-2xl p-5 border ${dark ? "glass-dark" : "glass-light"}`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-sm font-medium ${dark ? "text-slate-300" : "text-slate-700"}`}>Overall Progress</span>
          <span className={`text-sm font-bold font-mono ${dark ? "text-violet-400" : "text-violet-600"}`}>{Math.round(overallProgress * 100)}%</span>
        </div>
        <div className={`h-2.5 rounded-full ${dark ? "bg-slate-800" : "bg-slate-200"} overflow-hidden`}>
          <div className="h-full rounded-full progress-bar bg-gradient-to-r from-violet-500 to-purple-600" style={{ width: `${overallProgress * 100}%` }} />
        </div>
      </div>

      {/* Subject cards */}
      <div>
        <h3 className={`text-sm font-semibold mb-3 ${dark ? "text-slate-400" : "text-slate-500"}`}>SUBJECTS</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {SUBJECTS.map((s, i) => {
            const subTasks = tasks.filter(t => t.subject === s.id);
            const subDone = subTasks.filter(t => t.status === "completed").length;
            const subProgress = subTasks.length ? subDone / subTasks.length : 0;
            return (
              <button key={s.id} onClick={() => onView("tasks", s.id)}
                className={`subject-card glass rounded-2xl p-4 border text-left animate-fadeUp stagger-${Math.min(i + 1, 5)} ${dark ? "glass-dark" : "glass-light"} ${s.glow} hover:shadow-lg`}
                style={{ "--glow-color": `${s.hex}33` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${s.bg} ${s.border} border`}>{s.icon}</div>
                  <span className={`text-xs font-mono font-semibold ${s.text}`}>{subTasks.length}</span>
                </div>
                <div className={`text-sm font-semibold mb-1 ${dark ? "text-slate-200" : "text-slate-800"}`}>{s.label}</div>
                <div className={`text-xs mb-2.5 ${dark ? "text-slate-500" : "text-slate-400"}`}>{subDone}/{subTasks.length} done</div>
                <div className={`h-1 rounded-full ${dark ? "bg-slate-800" : "bg-slate-200"} overflow-hidden`}>
                  <div className={`h-full rounded-full progress-bar ${s.bar}`} style={{ width: `${subProgress * 100}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Due Today */}
      {todayTasks.length > 0 && (
        <div>
          <h3 className={`text-sm font-semibold mb-3 ${dark ? "text-slate-400" : "text-slate-500"}`}>DUE TODAY</h3>
          <div className="space-y-2">
            {todayTasks.slice(0, 5).map((t, i) => {
              const s = getSubject(t.subject);
              const p = PRIORITIES.find(pr => pr.id === t.priority);
              return (
                <div key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border btn-magnetic animate-fadeUp stagger-${Math.min(i + 1, 5)} ${dark ? "glass-dark" : "glass-light"}`}>
                  <div className={`w-1 h-8 rounded-full bg-gradient-to-b ${s.gradient} flex-shrink-0`} />
                  <div className={`text-lg`}>{s.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${dark ? "text-slate-200" : "text-slate-800"}`}>{t.title}</div>
                    <div className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>{s.label}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${p.bg} ${p.color}`}>{p.label}</span>
                </div>
              );
            })}
            {todayTasks.length > 5 && (
              <button onClick={() => onView("tasks")} className={`w-full text-xs py-2 rounded-xl btn-magnetic ${dark ? "text-slate-500 hover:bg-slate-800" : "text-slate-400 hover:bg-slate-100"}`}>
                View all {todayTasks.length} tasks →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Overdue warning */}
      {overdueTasks.length > 0 && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <div className="text-sm font-medium text-rose-400">{overdueTasks.length} overdue task{overdueTasks.length !== 1 ? "s" : ""}</div>
            <button onClick={() => onView("tasks")} className="text-xs text-rose-500 hover:text-rose-400 underline">View all overdue tasks →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TASKS VIEW ───────────────────────────────────────────────────────────────
function TasksView({ tasks, dark, onAdd, onEdit, onDelete, onStatusChange, filterSubject, setFilterSubject }) {
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("dueDate");
  const [viewMode, setViewMode] = useState("list"); // list | calendar

  const filtered = tasks
    .filter(t => !filterSubject || t.subject === filterSubject)
    .filter(t => filterPriority === "all" || t.priority === filterPriority)
    // Completed tasks leave the task list automatically (they stay in the database
    // and keep counting toward Insights). They only reappear if you explicitly
    // filter by the "Completed" status.
    .filter(t => filterStatus === "all" ? t.status !== "completed" : t.status === filterStatus)
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "dueDate") return a.dueDate.localeCompare(b.dueDate);
      if (sortBy === "priority") { const o = { high: 0, medium: 1, low: 2 }; return o[a.priority] - o[b.priority]; }
      if (sortBy === "subject") return a.subject.localeCompare(b.subject);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const inputCls = dark
    ? "bg-slate-800/80 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-violet-500/50"
    : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-violet-400";

  if (viewMode === "calendar") return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setViewMode("list")} className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg btn-magnetic ${dark ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
          ← List View
        </button>
      </div>
      <CalendarView tasks={tasks} dark={dark} onEdit={onEdit} onAdd={(date) => onAdd(null, date)} />
    </div>
  );

  return (
    <div className="space-y-4 animate-fadeUp">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>Tasks</h2>
          <p className={`text-sm mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>{filtered.length} of {tasks.length} tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode("calendar")} className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl btn-magnetic ${dark ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>📅 Calendar</button>
          <button onClick={() => onAdd()} className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium text-white btn-magnetic bg-gradient-to-r from-violet-500 to-purple-600">+ Add</button>
        </div>
      </div>

      {/* Filters */}
      <div className={`glass rounded-2xl p-4 border ${dark ? "glass-dark" : "glass-light"}`}>
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-48 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks…"
              className={`form-input w-full pl-9 pr-4 py-2 rounded-xl border text-sm ${inputCls}`} />
          </div>
          {/* Subject filter */}
          <select value={filterSubject || "all"} onChange={e => setFilterSubject(e.target.value === "all" ? null : e.target.value)}
            className={`form-input px-3 py-2 rounded-xl border text-sm ${inputCls}`}>
            <option value="all">All Subjects</option>
            {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
          </select>
          {/* Priority */}
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            className={`form-input px-3 py-2 rounded-xl border text-sm ${inputCls}`}>
            <option value="all">All Priority</option>
            {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          {/* Status */}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className={`form-input px-3 py-2 rounded-xl border text-sm ${inputCls}`}>
            <option value="all">All Status</option>
            {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className={`form-input px-3 py-2 rounded-xl border text-sm ${inputCls}`}>
            <option value="dueDate">Sort: Due Date</option>
            <option value="priority">Sort: Priority</option>
            <option value="subject">Sort: Subject</option>
            <option value="created">Sort: Created</option>
          </select>
        </div>
      </div>

      {/* Subject tab pills */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterSubject(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border btn-magnetic transition-all ${!filterSubject ? "bg-violet-500/20 text-violet-300 border-violet-500/40" : dark ? "bg-slate-800 border-slate-700 text-slate-500" : "bg-slate-100 border-slate-200 text-slate-500"}`}>
          All
        </button>
        {SUBJECTS.map(s => (
          <button key={s.id} onClick={() => setFilterSubject(s.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border btn-magnetic transition-all ${filterSubject === s.id ? `${s.badge} border` : dark ? "bg-slate-800 border-slate-700 text-slate-500" : "bg-slate-100 border-slate-200 text-slate-500"}`}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <EmptyState subject={filterSubject} onAdd={() => onAdd()} dark={dark} />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((t, i) => (
            <TaskCard key={t.id} task={t} index={i} dark={dark}
              onEdit={() => onEdit(t)}
              onDelete={() => onDelete(t.id)}
              onStatusChange={onStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useLocalStorage("theme_dark", true);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | saving | error
  const [view, setView] = useLocalStorage("view", "dashboard");
  const [modal, setModal] = useState(null);
  const [filterSubject, setFilterSubject] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Load tasks from Supabase on mount
  useEffect(() => {
    setLoading(true);
    dbGetTasks()
      .then(rows => setTasks((rows || []).map(dbToTask)))
      .catch(() => setSyncStatus("error"))
      .finally(() => setLoading(false));
  }, []);

  function openAdd(prefill = {}) { setModal({ prefill }); }
  function openEdit(task) { setModal({ task }); }

  async function saveTask(task) {
    setSyncStatus("saving");
    try {
      const isNew = !tasks.find(t => t.id === task.id);
      if (isNew) {
        await dbInsertTask(task);
        setTasks(ts => [task, ...ts]);
      } else {
        await dbUpdateTask(task);
        setTasks(ts => ts.map(t => t.id === task.id ? task : t));
      }
      setSyncStatus("idle");
    } catch {
      setSyncStatus("error");
      setTimeout(() => setSyncStatus("idle"), 3000);
    }
  }

  async function deleteTask(id) {
    if (!confirm("Delete this task?")) return;
    setSyncStatus("saving");
    try {
      await dbDeleteTask(id);
      setTasks(ts => ts.filter(t => t.id !== id));
      setSyncStatus("idle");
    } catch {
      setSyncStatus("error");
      setTimeout(() => setSyncStatus("idle"), 3000);
    }
  }

  async function changeStatus(id, status) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const updated = { ...task, status };
    setSyncStatus("saving");
    try {
      await dbUpdateTask(updated);
      setTasks(ts => ts.map(t => t.id === id ? updated : t));
      setSyncStatus("idle");
    } catch {
      setSyncStatus("error");
      setTimeout(() => setSyncStatus("idle"), 3000);
    }
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ tasks, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `tasks-backup-${today()}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  async function importData() {
    const input = document.createElement("input"); input.type = "file"; input.accept = ".json";
    input.onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = async ev => {
        try {
          const d = JSON.parse(ev.target.result);
          if (d.tasks && Array.isArray(d.tasks)) {
            setSyncStatus("saving");
            for (const task of d.tasks) {
              const exists = tasks.find(t => t.id === task.id);
              if (exists) await dbUpdateTask(task);
              else await dbInsertTask(task);
            }
            const rows = await dbGetTasks();
            setTasks((rows || []).map(dbToTask));
            setSyncStatus("idle");
            alert(`Imported ${d.tasks.length} tasks!`);
          } else alert("Invalid backup file.");
        } catch { alert("Failed to import."); setSyncStatus("error"); }
      };
      reader.readAsText(f);
    };
    input.click();
  }

  function navTo(v, subj = null) {
    setView(v);
    if (subj) setFilterSubject(subj);
    setMobileOpen(false);
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const todayCount = tasks.filter(t => t.dueDate === today() && t.status !== "completed").length;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "⊡" },
    { id: "tasks", label: "Tasks", icon: "☑" },
    { id: "calendar", label: "Calendar", icon: "📅" },
    { id: "focus", label: "Focus", icon: "⏱" },
    { id: "insights", label: "Insights", icon: "📊" },
  ];

  const bg = dark ? "bg-slate-950" : "bg-slate-50";
  const sidebar = dark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200";
  const topbar = dark ? "bg-slate-900/80 border-slate-800" : "bg-white/90 border-slate-200";

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <GlobalStyle />
      <AnimatedLogo size={64} />
      <div className="text-center">
        <div className="text-white text-lg font-semibold mb-1">Task Manager</div>
        <div className="text-slate-400 text-sm">Loading your tasks…</div>
      </div>
      <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full animate-shimmer" style={{ width: "60%" }} />
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${bg} noise relative`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <GlobalStyle />

      {/* Sync status toast */}
      {syncStatus !== "idle" && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg animate-scaleIn ${syncStatus === "saving" ? "bg-violet-500/20 border border-violet-500/40 text-violet-300" : "bg-rose-500/20 border border-rose-500/40 text-rose-300"}`}>
          {syncStatus === "saving" ? (
            <><span className="w-3 h-3 rounded-full border-2 border-violet-400 border-t-transparent animate-spin inline-block" /> Syncing…</>
          ) : (
            <><span>⚠️</span> Sync failed — check connection</>
          )}
        </div>
      )}

      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10 animate-spin-slow" style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)" }} />
        <div className="absolute top-1/3 -right-40 w-80 h-80 rounded-full opacity-8 animate-float" style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)", animationDelay: "1.5s" }} />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full opacity-8" style={{ background: "radial-gradient(circle, #10b981 0%, transparent 70%)" }} />
      </div>

      <div className="relative flex h-screen overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside className={`hidden lg:flex flex-col w-60 flex-shrink-0 glass border-r ${sidebar} z-20`}>
          {/* Logo */}
          <div className="p-5 border-b border-inherit">
            <div className="flex items-center gap-3">
              <AnimatedLogo size={36} />
              <div>
                <div className={`text-sm font-bold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>Task Manager</div>
                <div className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>Elite Study Planner</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {navItems.map(item => (
              <button key={item.id} onClick={() => navTo(item.id)}
                className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all btn-magnetic ${view === item.id ? "active bg-violet-500/15 text-violet-400 border border-violet-500/20" : dark ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
                <span className="text-base">{item.icon}</span>
                {item.label}
                {item.id === "tasks" && tasks.length > 0 && (
                  <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-mono ${dark ? "bg-slate-800 text-slate-400" : "bg-slate-200 text-slate-500"}`}>{tasks.length}</span>
                )}
                {item.id === "focus" && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            ))}

            <div className={`pt-3 mt-3 border-t ${dark ? "border-slate-800" : "border-slate-200"}`}>
              <div className={`px-3 pb-2 text-xs font-semibold uppercase tracking-wider ${dark ? "text-slate-600" : "text-slate-400"}`}>Subjects</div>
              {SUBJECTS.map(s => {
                const count = tasks.filter(t => t.subject === s.id && t.status !== "completed").length;
                return (
                  <button key={s.id} onClick={() => navTo("tasks", s.id)}
                    className={`nav-item w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all btn-magnetic ${filterSubject === s.id && view === "tasks" ? `${s.bg} ${s.text} border ${s.border}` : dark ? "text-slate-500 hover:bg-slate-800 hover:text-slate-300" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`}>
                    <span>{s.icon}</span>
                    {s.label}
                    {count > 0 && <span className={`ml-auto text-xs font-mono ${s.text}`}>{count}</span>}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Stats mini */}
          <div className={`p-4 border-t ${dark ? "border-slate-800" : "border-slate-200"}`}>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[{ v: totalTasks, l: "Total" }, { v: completedTasks, l: "Done" }, { v: todayCount, l: "Today" }].map((s, i) => (
                <div key={i} className={`text-center rounded-lg p-2 ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <div className={`text-lg font-bold font-mono ${dark ? "text-violet-400" : "text-violet-600"}`}>{s.v}</div>
                  <div className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Export/Import */}
            <div className="flex gap-1.5">
              <button onClick={exportData} className={`flex-1 text-xs py-1.5 rounded-lg btn-magnetic ${dark ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`} title="Export backup">↑ Export</button>
              <button onClick={importData} className={`flex-1 text-xs py-1.5 rounded-lg btn-magnetic ${dark ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`} title="Import backup">↓ Import</button>
            </div>

            {/* Dark mode */}
            <button onClick={() => setDark(d => !d)} className={`w-full mt-1.5 text-xs py-2 rounded-lg btn-magnetic flex items-center justify-center gap-2 ${dark ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
              {dark ? "☀ Light Mode" : "🌙 Dark Mode"}
            </button>
          </div>
        </aside>

        {/* Mobile sidebar */}
        <div className={`mobile-menu lg:hidden fixed inset-y-0 left-0 w-72 z-40 flex flex-col glass ${sidebar} shadow-2xl ${mobileOpen ? "open" : "closed"}`}>
          <div className="p-5 flex items-center justify-between border-b border-inherit">
            <div className="flex items-center gap-3">
              <AnimatedLogo size={36} />
              <div className={`text-sm font-bold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>Task Manager</div>
            </div>
            <button onClick={() => setMobileOpen(false)} className={`text-slate-400 hover:text-slate-300 p-1`}>✕</button>
          </div>
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {navItems.map(item => (
              <button key={item.id} onClick={() => navTo(item.id)}
                className={`nav-item w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${view === item.id ? "active bg-violet-500/15 text-violet-400" : dark ? "text-slate-400 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"}`}>
                <span className="text-base">{item.icon}</span>{item.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-inherit">
            <div className="flex gap-1.5 mb-2">
              <button onClick={exportData} className={`flex-1 text-xs py-2 rounded-lg ${dark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>↑ Export</button>
              <button onClick={importData} className={`flex-1 text-xs py-2 rounded-lg ${dark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>↓ Import</button>
            </div>
            <button onClick={() => setDark(d => !d)} className={`w-full text-xs py-2 rounded-lg ${dark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
              {dark ? "☀ Light Mode" : "🌙 Dark Mode"}
            </button>
          </div>
        </div>
        {/* Mobile overlay */}
        {mobileOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden animate-fadeIn" onClick={() => setMobileOpen(false)} />}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Topbar */}
          <header className={`flex-shrink-0 flex items-center justify-between px-4 lg:px-6 py-3 glass border-b ${topbar} z-10`}>
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2 rounded-xl btn-magnetic" onClick={() => setMobileOpen(true)}>
                <div className={`w-5 h-0.5 mb-1 rounded ${dark ? "bg-slate-400" : "bg-slate-600"}`} />
                <div className={`w-4 h-0.5 mb-1 rounded ${dark ? "bg-slate-400" : "bg-slate-600"}`} />
                <div className={`w-5 h-0.5 rounded ${dark ? "bg-slate-400" : "bg-slate-600"}`} />
              </button>
              <div className={`hidden sm:flex items-center gap-2 text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>
                <span className="capitalize font-medium">{view}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {todayCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  📅 {todayCount} due today
                </div>
              )}
              <button onClick={() => openAdd()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white btn-magnetic bg-gradient-to-r from-violet-500 to-purple-600">
                + Task
              </button>
              <button onClick={() => setDark(d => !d)} className={`w-8 h-8 rounded-xl flex items-center justify-center btn-magnetic ${dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {dark ? "☀" : "🌙"}
              </button>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto p-4 lg:p-6 pb-24">
              {view === "dashboard" && (
                <Dashboard tasks={tasks} dark={dark} onAdd={openAdd}
                  onView={(v, s) => { setView(v); if (s) setFilterSubject(s); }} />
              )}
              {view === "tasks" && (
                <TasksView tasks={tasks} dark={dark}
                  onAdd={(task, date) => openAdd(date ? { dueDate: date } : {})}
                  onEdit={openEdit}
                  onDelete={deleteTask}
                  onStatusChange={changeStatus}
                  filterSubject={filterSubject}
                  setFilterSubject={setFilterSubject} />
              )}
              {view === "calendar" && (
                <div className="animate-fadeUp">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className={`text-2xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>Calendar</h2>
                      <p className={`text-sm mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>Monthly task overview</p>
                    </div>
                  </div>
                  <CalendarView tasks={tasks} dark={dark} onEdit={openEdit} onAdd={(date) => openAdd(date ? { dueDate: date } : {})} />
                </div>
              )}
              {view === "focus" && <FocusView dark={dark} tasks={tasks} />}
              {view === "insights" && <InsightsView tasks={tasks} dark={dark} />}
            </div>
          </main>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <TaskModal
          task={modal.task}
          onSave={saveTask}
          onClose={() => setModal(null)}
          dark={dark}
          prefill={modal.prefill}
        />
      )}

      {/* Mobile bottom nav */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-20 glass border-t ${topbar} px-2 py-2`}>
        <div className="flex justify-around">
          {navItems.map(item => (
            <button key={item.id} onClick={() => navTo(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all btn-magnetic ${view === item.id ? "text-violet-400" : dark ? "text-slate-500" : "text-slate-400"}`}>
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
