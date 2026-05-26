import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SUBJECTS = [
  { id:"statistics", label:"Statistics", color:"purple", gradient:"from-violet-600 to-purple-800", glow:"shadow-violet-500/40", bg:"bg-violet-500/10", border:"border-violet-500/30", text:"text-violet-400", badge:"bg-violet-500/20 text-violet-300 border-violet-500/30", bar:"bg-gradient-to-r from-violet-500 to-purple-600", hex:"#8b5cf6" },
  { id:"english",    label:"English",    color:"amber",  gradient:"from-amber-500 to-yellow-600",  glow:"shadow-amber-500/40",  bg:"bg-amber-500/10",  border:"border-amber-500/30",  text:"text-amber-400",  badge:"bg-amber-500/20 text-amber-300 border-amber-500/30",  bar:"bg-gradient-to-r from-amber-500 to-yellow-500",  hex:"#f59e0b" },
  { id:"physics",    label:"Physics",    color:"blue",   gradient:"from-blue-500 to-cyan-600",     glow:"shadow-blue-500/40",   bg:"bg-blue-500/10",   border:"border-blue-500/30",   text:"text-blue-400",   badge:"bg-blue-500/20 text-blue-300 border-blue-500/30",   bar:"bg-gradient-to-r from-blue-500 to-cyan-500",    hex:"#3b82f6" },
  { id:"chemistry",  label:"Chemistry",  color:"green",  gradient:"from-emerald-500 to-green-600", glow:"shadow-emerald-500/40",bg:"bg-emerald-500/10",border:"border-emerald-500/30",text:"text-emerald-400",badge:"bg-emerald-500/20 text-emerald-300 border-emerald-500/30",bar:"bg-gradient-to-r from-emerald-500 to-green-500", hex:"#10b981" },
  { id:"digitaltech",label:"Digital Tech",color:"indigo",gradient:"from-indigo-500 to-cyan-500",  glow:"shadow-indigo-500/40", bg:"bg-indigo-500/10", border:"border-indigo-500/30", text:"text-indigo-400", badge:"bg-indigo-500/20 text-indigo-300 border-indigo-500/30", bar:"bg-gradient-to-r from-indigo-500 to-cyan-500",  hex:"#6366f1" },
];
const PRIORITIES = [
  { id:"low",    label:"Low",    color:"text-emerald-400", bg:"bg-emerald-500/20 border-emerald-500/30" },
  { id:"medium", label:"Medium", color:"text-amber-400",   bg:"bg-amber-500/20 border-amber-500/30" },
  { id:"high",   label:"High",   color:"text-rose-400",    bg:"bg-rose-500/20 border-rose-500/30" },
];
const STATUSES = [
  { id:"pending",    label:"Pending",     color:"text-slate-400",   bg:"bg-slate-500/20 border-slate-500/30" },
  { id:"inprogress", label:"In Progress", color:"text-blue-400",    bg:"bg-blue-500/20 border-blue-500/30" },
  { id:"completed",  label:"Completed",   color:"text-emerald-400", bg:"bg-emerald-500/20 border-emerald-500/30" },
];
const NAV_VIEWS = ["dashboard","tasks","calendar","focus","insights"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const SUPABASE_URL = "https://vwohpwoexrfrruoyyjoj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3b2hwd29leHJmcnJ1b3l5am9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3OTA3NTUsImV4cCI6MjA5NTM2Njc1NX0.jSpmBPi2vjdg-caXfYgg5BdT1LBAPC74E0ut-SIXN-g";

function uuid()       { return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2); }
function today()      { return new Date().toISOString().split("T")[0]; }
function getSubject(id){ return SUBJECTS.find(s=>s.id===id)||SUBJECTS[0]; }

// ─── SUPABASE HELPERS ─────────────────────────────────────────────────────────
async function sbFetch(path, options={}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers:{ "apikey":SUPABASE_KEY, "Authorization":`Bearer ${SUPABASE_KEY}`, "Content-Type":"application/json", "Prefer":options.prefer||"return=representation", ...(options.headers||{}) },
  });
  if (!res.ok) throw new Error(await res.text());
  const t = await res.text(); return t ? JSON.parse(t) : null;
}
const dbGetTasks    = ()     => sbFetch("tasks?order=created_at.desc");
const dbInsertTask  = (task) => sbFetch("tasks",{ method:"POST", body:JSON.stringify({ id:task.id, title:task.title, description:task.description||"", due_date:task.dueDate, priority:task.priority, status:task.status, subject:task.subject, created_at:task.createdAt||new Date().toISOString() }) });
const dbUpdateTask  = (task) => sbFetch(`tasks?id=eq.${task.id}`,{ method:"PATCH", body:JSON.stringify({ title:task.title, description:task.description||"", due_date:task.dueDate, priority:task.priority, status:task.status, subject:task.subject }) });
const dbDeleteTask  = (id)   => sbFetch(`tasks?id=eq.${id}`,{ method:"DELETE", prefer:"return=minimal" });
const dbToTask      = (row)  => ({ id:row.id, title:row.title, description:row.description, dueDate:row.due_date, priority:row.priority, status:row.status, subject:row.subject, createdAt:row.created_at });

// ─── LOCAL STORAGE HOOK ───────────────────────────────────────────────────────
function useLocalStorage(key, initial) {
  const [state, setState] = useState(()=>{ try{ const v=localStorage.getItem(key); return v?JSON.parse(v):initial; }catch{ return initial; } });
  const set = useCallback((v)=>{ setState(prev=>{ const next=typeof v==="function"?v(prev):v; try{ localStorage.setItem(key,JSON.stringify(next)); }catch{} return next; }); },[key]);
  return [state, set];
}

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin:0; }
    :root {
      --ease-spring: cubic-bezier(0.25, 1, 0.5, 1);
      --ease-back:   cubic-bezier(0.34, 1.56, 0.64, 1);
      --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
      --ease-decel:  cubic-bezier(0.0, 0.0, 0.2, 1);
    }
    html, body { height:100%; overflow:hidden; }
    body { font-family:'Space Grotesk',sans-serif; }
    .font-mono { font-family:'JetBrains Mono',monospace; }
    ::-webkit-scrollbar { width:4px; height:4px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:rgba(148,163,184,0.2); border-radius:2px; }

    /* ── Keyframes ── */
    @keyframes fadeUp      { from{ opacity:0; transform:translateY(16px); } to{ opacity:1; transform:translateY(0); } }
    @keyframes fadeIn      { from{ opacity:0; } to{ opacity:1; } }
    @keyframes scaleIn     { from{ opacity:0; transform:scale(0.92); } to{ opacity:1; transform:scale(1); } }
    @keyframes pulse-glow  { 0%,100%{ box-shadow:0 0 20px 2px var(--glow-color,rgba(139,92,246,0.3)); } 50%{ box-shadow:0 0 40px 8px var(--glow-color,rgba(139,92,246,0.5)); } }
    @keyframes float       { 0%,100%{ transform:translateY(0px); } 50%{ transform:translateY(-8px); } }
    @keyframes ripple      { 0%{ transform:scale(0); opacity:0.5; } 100%{ transform:scale(4); opacity:0; } }
    @keyframes ticker      { 0%,100%{ opacity:1; transform:scale(1); } 50%{ opacity:0.7; transform:scale(1.02); } }
    @keyframes shimmer     { 0%{ background-position:-200% center; } 100%{ background-position:200% center; } }
    @keyframes spin-slow   { to{ transform:rotate(360deg); } }
    @keyframes particleDrift { 0%{ transform:translate(0,0) scale(1); opacity:0.6; } 33%{ transform:translate(12px,-18px) scale(1.3); opacity:1; } 66%{ transform:translate(-8px,-30px) scale(0.8); opacity:0.4; } 100%{ transform:translate(4px,-50px) scale(0.3); opacity:0; } }
    @keyframes progressFill { from{ width:0%; } }
    @keyframes navPillSlide { from{ left:var(--pill-from); } to{ left:var(--pill-to); } }

    /* ── View Transition ── */
    @keyframes slideInFromRight { from{ opacity:0; transform:translate3d(48px,0,0); } to{ opacity:1; transform:translate3d(0,0,0); } }
    @keyframes slideInFromLeft  { from{ opacity:0; transform:translate3d(-48px,0,0); } to{ opacity:1; transform:translate3d(0,0,0); } }
    @keyframes slideOutToLeft   { from{ opacity:1; transform:translate3d(0,0,0); } to{ opacity:0; transform:translate3d(-48px,0,0); } }
    @keyframes slideOutToRight  { from{ opacity:1; transform:translate3d(0,0,0); } to{ opacity:0; transform:translate3d(48px,0,0); } }
    @keyframes calSlideInRight  { from{ opacity:0; transform:translate3d(100%,0,0); } to{ opacity:1; transform:translate3d(0,0,0); } }
    @keyframes calSlideInLeft   { from{ opacity:0; transform:translate3d(-100%,0,0); } to{ opacity:1; transform:translate3d(0,0,0); } }

    .view-enter-right { animation: slideInFromRight 0.38s var(--ease-decel) forwards; }
    .view-enter-left  { animation: slideInFromLeft  0.38s var(--ease-decel) forwards; }
    .cal-enter-right  { animation: calSlideInRight  0.32s var(--ease-decel) forwards; }
    .cal-enter-left   { animation: calSlideInLeft   0.32s var(--ease-decel) forwards; }

    .animate-fadeUp    { animation: fadeUp 0.45s var(--ease-spring) forwards; }
    .animate-fadeIn    { animation: fadeIn 0.3s ease forwards; }
    .animate-scaleIn   { animation: scaleIn 0.35s var(--ease-back) forwards; }
    .animate-pulse-glow{ animation: pulse-glow 2s ease-in-out infinite; }
    .animate-float     { animation: float 3s ease-in-out infinite; }
    .animate-spin-slow { animation: spin-slow 8s linear infinite; }
    .animate-ticker    { animation: ticker 1s ease-in-out infinite; }
    .animate-shimmer   { background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.08) 50%,transparent 100%); background-size:200% auto; animation:shimmer 2s linear infinite; }

    .stagger-1{ animation-delay:0.05s; opacity:0; }
    .stagger-2{ animation-delay:0.10s; opacity:0; }
    .stagger-3{ animation-delay:0.15s; opacity:0; }
    .stagger-4{ animation-delay:0.20s; opacity:0; }
    .stagger-5{ animation-delay:0.25s; opacity:0; }

    /* ── Magnetic Button ── */
    .btn-magnetic { transition:all 0.35s var(--ease-spring); position:relative; overflow:hidden; }
    .btn-magnetic::after { content:''; position:absolute; inset:0; border-radius:inherit; opacity:0; transition:opacity 0.3s ease; background:radial-gradient(circle at center,rgba(255,255,255,0.15) 0%,transparent 70%); }
    .btn-magnetic:hover::after { opacity:1; }
    .btn-magnetic:hover  { transform:translateY(-2px) scale(1.02); }
    .btn-magnetic:active { transform:translateY(0) scale(0.97); }

    /* ── Glass ── */
    .glass      { backdrop-filter:blur(20px) saturate(180%); -webkit-backdrop-filter:blur(20px) saturate(180%); }
    .glass-dark { background:rgba(15,23,42,0.75); border:1px solid rgba(148,163,184,0.08); }
    .glass-light{ background:rgba(255,255,255,0.75); border:1px solid rgba(0,0,0,0.08); }

    /* ── Task card ── */
    .task-card { transition:all 0.35s var(--ease-spring); }
    .task-card:hover { transform:translateY(-3px) scale(1.005); }

    /* ── Cal cell ── */
    .cal-cell { transition:all 0.25s var(--ease-spring); }
    .cal-cell:hover { transform:scale(1.04); z-index:10; }

    /* ── Nav item ── */
    .nav-item { transition:all 0.3s var(--ease-spring); position:relative; }
    .nav-item::before { content:''; position:absolute; left:0; top:50%; width:3px; height:0; border-radius:0 2px 2px 0; background:currentColor; transform:translateY(-50%); transition:height 0.3s var(--ease-spring); }
    .nav-item.active::before { height:60%; }

    /* ── Bottom nav pill ── */
    .bottom-nav-pill { transition:left 0.35s var(--ease-spring), width 0.35s var(--ease-spring); }

    .progress-bar { animation:progressFill 0.8s var(--ease-spring) forwards; }
    .analytics-bar{ transition:width 1s var(--ease-spring); }
    .pomodoro-ring{ transition:stroke-dashoffset 0.5s var(--ease-smooth); }

    .ripple-container { position:relative; overflow:hidden; }
    .ripple-effect { position:absolute; border-radius:50%; background:rgba(255,255,255,0.3); animation:ripple 0.7s ease-out forwards; pointer-events:none; }

    .timer-digit { font-family:'JetBrains Mono',monospace; font-weight:700; }

    /* ── Focus overlay – covers notch/island ── */
    .focus-overlay { position:fixed; inset:0; z-index:60; background:rgba(2,6,23,0.97); backdrop-filter:blur(40px); -webkit-backdrop-filter:blur(40px); padding-top:env(safe-area-inset-top); padding-bottom:env(safe-area-inset-bottom); }

    .noise::before { content:''; position:absolute; inset:0; opacity:0.03; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); pointer-events:none; }

    .particle { animation:particleDrift 4s ease-in-out infinite; }
    .particle:nth-child(2){ animation-delay:0.8s; animation-duration:5s; }
    .particle:nth-child(3){ animation-delay:1.6s; animation-duration:3.5s; }
    .particle:nth-child(4){ animation-delay:2.4s; animation-duration:4.5s; }

    .form-input { transition:all 0.3s var(--ease-spring); outline:none; }
    .form-input:focus { box-shadow:0 0 0 2px var(--focus-ring,rgba(139,92,246,0.4)); border-color:var(--focus-border,rgba(139,92,246,0.6)); }

    .subject-card { transition:all 0.4s var(--ease-spring); }
    .subject-card:hover { transform:translateY(-4px); }

    .mobile-menu { transition:transform 0.4s var(--ease-spring), opacity 0.3s ease; }
    .mobile-menu.closed { transform:translateX(-100%); opacity:0; pointer-events:none; }
    .mobile-menu.open   { transform:translateX(0);    opacity:1; }

    /* SVG icon transitions */
    .svg-icon { transition:all 0.3s var(--ease-spring); }
    .svg-icon path, .svg-icon circle, .svg-icon rect, .svg-icon line, .svg-icon ellipse, .svg-icon polyline { transition:stroke 0.3s ease, opacity 0.3s ease; }
  `}</style>
);

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
const Icons = {
  Statistics: ({ size=20, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="svg-icon" {...p}>
      <rect x="3" y="14" width="3" height="7" rx="1"/>
      <rect x="9" y="9"  width="3" height="12" rx="1"/>
      <rect x="15" y="4" width="3" height="17" rx="1"/>
      <circle cx="4.5"  cy="11" r="1.2" fill={color} stroke="none"/>
      <circle cx="10.5" cy="6"  r="1.2" fill={color} stroke="none"/>
      <circle cx="16.5" cy="1.5" r="1.2" fill={color} stroke="none"/>
      <polyline points="4.5,11 10.5,6 16.5,1.5" strokeWidth="1.2" opacity="0.5"/>
    </svg>
  ),
  English: ({ size=20, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="svg-icon" {...p}>
      <path d="M12 19L3 21l3-8L17 2l6 6-11 11z"/>
      <path d="M17 2l2 2" strokeWidth="1.5" opacity="0.6"/>
      <path d="M6 13l5 5" strokeWidth="1.5" opacity="0.6"/>
      <path d="M9 16l-2 4" strokeWidth="1.2" opacity="0.4"/>
    </svg>
  ),
  Physics: ({ size=20, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="svg-icon" {...p}>
      <circle cx="12" cy="12" r="2" fill={color} stroke="none"/>
      <ellipse cx="12" cy="12" rx="10" ry="4"/>
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" opacity="0.6"/>
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" opacity="0.4"/>
    </svg>
  ),
  Chemistry: ({ size=20, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="svg-icon" {...p}>
      <path d="M9 3h6v8l3.5 6.5A2 2 0 0116.8 20H7.2a2 2 0 01-1.7-2.5L9 11V3z"/>
      <path d="M9 3H7m8 0h2" strokeWidth="1.2" opacity="0.5"/>
      <circle cx="10.5" cy="15" r="0.8" fill={color} stroke="none" opacity="0.8"/>
      <circle cx="13.5" cy="13" r="0.6" fill={color} stroke="none" opacity="0.6"/>
      <circle cx="12"   cy="17" r="0.6" fill={color} stroke="none" opacity="0.5"/>
    </svg>
  ),
  DigitalTech: ({ size=20, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="svg-icon" {...p}>
      <polyline points="16,18 22,12 16,6"/>
      <polyline points="8,6 2,12 8,18"/>
      <line x1="12" y1="3" x2="12" y2="21" strokeWidth="1.2" opacity="0.5"/>
    </svg>
  ),
  Dashboard: ({ size=20, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="svg-icon" {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  Tasks: ({ size=20, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="svg-icon" {...p}>
      <polyline points="9,11 12,14 22,4"/>
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  ),
  Calendar: ({ size=20, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="svg-icon" {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8"  y1="2" x2="8"  y2="6"/>
      <line x1="3"  y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Focus: ({ size=20, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="svg-icon" {...p}>
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12,6 12,12 16,14"/>
    </svg>
  ),
  Insights: ({ size=20, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="svg-icon" {...p}>
      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
    </svg>
  ),
  Plus: ({ size=18, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" className="svg-icon" {...p}>
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Edit: ({ size=16, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="svg-icon" {...p}>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Trash: ({ size=16, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="svg-icon" {...p}>
      <polyline points="3,6 5,6 21,6"/>
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
      <path d="M10 11v6m4-6v6"/>
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
    </svg>
  ),
  Check: ({ size=14, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="svg-icon" {...p}>
      <polyline points="20,6 9,17 4,12"/>
    </svg>
  ),
  Sun: ({ size=18, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="svg-icon" {...p}>
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1"  x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1"  y1="12" x2="3"  y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64"  y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  Moon: ({ size=18, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="svg-icon" {...p}>
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  ),
  Menu: ({ size=20, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="svg-icon" {...p}>
      <line x1="3" y1="6"  x2="21" y2="6"/>
      <line x1="3" y1="12" x2="17" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  Close: ({ size=18, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" className="svg-icon" {...p}>
      <line x1="18" y1="6"  x2="6"  y2="18"/>
      <line x1="6"  y1="6"  x2="18" y2="18"/>
    </svg>
  ),
  Upload:   ({ size=16, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="svg-icon" {...p}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17,8 12,3 7,8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  Download: ({ size=16, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="svg-icon" {...p}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="7,10 12,15 17,10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Alert: ({ size=18, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="svg-icon" {...p}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  ChevronLeft:  ({ size=18, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="svg-icon" {...p}><polyline points="15,18 9,12 15,6"/></svg>
  ),
  ChevronRight: ({ size=18, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="svg-icon" {...p}><polyline points="9,18 15,12 9,6"/></svg>
  ),
  Expand: ({ size=18, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="svg-icon" {...p}>
      <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
    </svg>
  ),
  Pause:  ({ size=20, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="svg-icon" {...p}>
      <rect x="6" y="4" width="4" height="16" rx="1"/>
      <rect x="14" y="4" width="4" height="16" rx="1"/>
    </svg>
  ),
  Play:   ({ size=20, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" className="svg-icon" {...p}>
      <polygon points="5,3 19,12 5,21"/>
    </svg>
  ),
  Reset:  ({ size=18, color="currentColor", ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="svg-icon" {...p}>
      <polyline points="1,4 1,10 7,10"/>
      <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
    </svg>
  ),
  SubjectIcon: ({ subject, ...p }) => {
    const map = { statistics:<Icons.Statistics {...p}/>, english:<Icons.English {...p}/>, physics:<Icons.Physics {...p}/>, chemistry:<Icons.Chemistry {...p}/>, digitaltech:<Icons.DigitalTech {...p}/> };
    return map[subject] || <Icons.Tasks {...p}/>;
  },
};

// ─── ANIMATED LOGO ────────────────────────────────────────────────────────────
function AnimatedLogo({ size=36 }) {
  return (
    <div style={{ width:size, height:size, flexShrink:0 }}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        <defs>
          <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#8b5cf6"/><stop offset="100%" stopColor="#6366f1"/></linearGradient>
          <filter id="lglow"><feGaussianBlur stdDeviation="1.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <rect width="40" height="40" rx="10" fill="url(#lg1)"/>
        <circle cx="20" cy="20" r="11" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none"><animate attributeName="r" values="11;12;11" dur="3s" repeatCount="indefinite"/></circle>
        <rect x="16" y="12" width="10" height="1.8" rx="0.9" fill="white" opacity="0.9"><animate attributeName="opacity" values="0.9;0.5;0.9" dur="2.5s" repeatCount="indefinite"/></rect>
        <rect x="16" y="17" width="8"  height="1.8" rx="0.9" fill="white" opacity="0.7"><animate attributeName="opacity" values="0.7;1;0.7" dur="2s" begin="0.3s" repeatCount="indefinite"/></rect>
        <rect x="16" y="22" width="9"  height="1.8" rx="0.9" fill="white" opacity="0.6"><animate attributeName="opacity" values="0.6;1;0.6" dur="3s" begin="0.6s" repeatCount="indefinite"/></rect>
        <rect x="16" y="27" width="6"  height="1.8" rx="0.9" fill="white" opacity="0.5"><animate attributeName="opacity" values="0.5;0.9;0.5" dur="2.2s" begin="0.9s" repeatCount="indefinite"/></rect>
        <g filter="url(#lglow)">
          <path d="M11 13 L13.2 15.2 L15.5 12" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"><animate attributeName="stroke-dasharray" values="0 20;20 20" dur="0.6s" fill="freeze"/></path>
          <path d="M11 18 L13.2 20.2 L15.5 17" stroke="rgba(167,139,250,1)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"><animate attributeName="stroke" values="rgba(167,139,250,1);white;rgba(167,139,250,1)" dur="2s" repeatCount="indefinite"/></path>
        </g>
        <circle r="1.5" fill="rgba(255,255,255,0.8)" filter="url(#lglow)"><animateMotion dur="3s" repeatCount="indefinite"><mpath href="#op"/></animateMotion></circle>
        <path id="op" d="M20,8 A12,12 0 1,1 19.99,8" fill="none"/>
      </svg>
    </div>
  );
}

// ─── TOUCH GESTURE HOOK ───────────────────────────────────────────────────────
function useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold=60, velocityThreshold=0.3, disabled=false }) {
  const ref = useRef(null);
  const touch = useRef({ startX:0, startY:0, startTime:0, active:false, locked:null });

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;

    function onStart(e) {
      const t = e.touches[0];
      touch.current = { startX:t.clientX, startY:t.clientY, startTime:Date.now(), active:true, locked:null };
    }
    function onMove(e) {
      if (!touch.current.active) return;
      const t = e.touches[0];
      const dx = t.clientX - touch.current.startX;
      const dy = t.clientY - touch.current.startY;
      if (touch.current.locked === null) {
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
          touch.current.locked = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
        }
      }
      if (touch.current.locked === "h") { e.preventDefault(); }
    }
    function onEnd(e) {
      if (!touch.current.active) return;
      touch.current.active = false;
      if (touch.current.locked !== "h") return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touch.current.startX;
      const dt = Date.now() - touch.current.startTime;
      const velocity = Math.abs(dx) / dt;
      if (Math.abs(dx) >= threshold || velocity >= velocityThreshold) {
        if (dx < 0) onSwipeLeft?.();
        else onSwipeRight?.();
      }
    }
    el.addEventListener("touchstart", onStart, { passive:true });
    el.addEventListener("touchmove",  onMove,  { passive:false });
    el.addEventListener("touchend",   onEnd,   { passive:true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove",  onMove);
      el.removeEventListener("touchend",   onEnd);
    };
  }, [onSwipeLeft, onSwipeRight, threshold, velocityThreshold, disabled]);

  return ref;
}

// ─── TASK MODAL ───────────────────────────────────────────────────────────────
function TaskModal({ task, onSave, onClose, dark, prefill }) {
  const blank = { id:null, title:"", description:"", dueDate:today(), priority:"medium", status:"pending", subject:"statistics" };
  const [form, setForm] = useState(task || { ...blank, ...(prefill||{}) });
  const sub = getSubject(form.subject);
  function set(k,v){ setForm(p=>({...p,[k]:v})); }
  function handleSave(){ if(!form.title.trim()) return; onSave({...form,id:form.id||uuid(),createdAt:form.createdAt||new Date().toISOString()}); onClose(); }
  const base = dark ? "bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500" : "bg-white border-slate-200 text-slate-800 placeholder-slate-400";
  const lbl  = "text-xs font-medium uppercase tracking-wider " + (dark?"text-slate-400":"text-slate-500");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
      <div className={`relative w-full max-w-lg rounded-2xl glass ${dark?"glass-dark":"glass-light"} shadow-2xl animate-scaleIn overflow-hidden`}>
        <div className={`h-1.5 w-full bg-gradient-to-r ${sub.gradient}`}/>
        <div className="p-6 pb-2 flex items-center justify-between">
          <div>
            <h2 className={`text-lg font-semibold ${dark?"text-white":"text-slate-900"}`}>{form.id?"Edit Task":"New Task"}</h2>
            <p className={`text-sm mt-0.5 ${dark?"text-slate-400":"text-slate-500"}`}>Add details for your task</p>
          </div>
          <button onClick={onClose} className={`w-8 h-8 flex items-center justify-center rounded-lg btn-magnetic ${dark?"hover:bg-slate-800 text-slate-400":"hover:bg-slate-100 text-slate-500"}`}><Icons.Close size={16}/></button>
        </div>
        <div className="p-6 pt-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className={lbl}>Subject</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {SUBJECTS.map(s=>(
                <button key={s.id} onClick={()=>set("subject",s.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all btn-magnetic ${form.subject===s.id?`${s.badge} border`:dark?"bg-slate-800 border-slate-700 text-slate-400":"bg-slate-100 border-slate-200 text-slate-600"}`}>
                  <Icons.SubjectIcon subject={s.id} size={14} color="currentColor"/>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={lbl}>Title *</label>
            <input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="Task title…" className={`form-input mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm ${base}`}/>
          </div>
          <div>
            <label className={lbl}>Description</label>
            <textarea value={form.description} onChange={e=>set("description",e.target.value)} placeholder="Add a description…" rows={3} className={`form-input mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm resize-none ${base}`}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Due Date</label>
              <input type="date" value={form.dueDate} onChange={e=>set("dueDate",e.target.value)} className={`form-input mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm ${base}`}/>
            </div>
            <div>
              <label className={lbl}>Priority</label>
              <div className="mt-1.5 flex gap-1.5">
                {PRIORITIES.map(p=>(
                  <button key={p.id} onClick={()=>set("priority",p.id)} className={`flex-1 py-2.5 rounded-xl text-xs font-medium border btn-magnetic ${form.priority===p.id?`${p.bg} ${p.color}`:dark?"bg-slate-800 border-slate-700 text-slate-500":"bg-slate-100 border-slate-200 text-slate-400"}`}>{p.label}</button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className={lbl}>Status</label>
            <div className="mt-1.5 flex gap-2">
              {STATUSES.map(s=>(
                <button key={s.id} onClick={()=>set("status",s.id)} className={`flex-1 py-2 rounded-xl text-xs font-medium border btn-magnetic ${form.status===s.id?`${s.bg} ${s.color}`:dark?"bg-slate-800 border-slate-700 text-slate-500":"bg-slate-100 border-slate-200 text-slate-400"}`}>{s.label}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 pt-2 flex gap-3">
          <button onClick={onClose} className={`flex-1 py-2.5 rounded-xl text-sm font-medium btn-magnetic ${dark?"bg-slate-800 text-slate-300 hover:bg-slate-700":"bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Cancel</button>
          <button onClick={handleSave} className={`flex-1 py-2.5 rounded-xl text-sm font-medium btn-magnetic text-white bg-gradient-to-r ${sub.gradient} shadow-lg`}>{form.id?"Save Changes":"Create Task"}</button>
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
        <div className={`w-24 h-24 rounded-full ${dark?"bg-slate-800":"bg-slate-100"} flex items-center justify-center animate-float`}>
          {sub ? <Icons.SubjectIcon subject={sub.id} size={40} color={sub.hex}/> : <Icons.Tasks size={40} color="#8b5cf6"/>}
        </div>
        {[...Array(4)].map((_,i)=>(
          <div key={i} className={`particle absolute w-2 h-2 rounded-full ${dark?"bg-violet-500/60":"bg-violet-400/60"}`} style={{left:`${20+i*20}%`,top:`${20+(i%2)*40}%`}}/>
        ))}
      </div>
      <h3 className={`text-lg font-semibold mb-2 ${dark?"text-slate-300":"text-slate-700"}`}>No tasks yet</h3>
      <p className={`text-sm max-w-xs mb-6 ${dark?"text-slate-500":"text-slate-400"}`}>{sub?`Start adding ${sub.label} tasks`:"Create your first task to get started"}</p>
      {onAdd && <button onClick={onAdd} className={`px-5 py-2.5 rounded-xl text-sm font-medium text-white btn-magnetic ${sub?`bg-gradient-to-r ${sub.gradient}`:"bg-gradient-to-r from-violet-500 to-purple-600"} shadow-lg`}><span className="flex items-center gap-2"><Icons.Plus size={16}/>Add First Task</span></button>}
    </div>
  );
}

// ─── TASK CARD ────────────────────────────────────────────────────────────────
function TaskCard({ task, onEdit, onDelete, onStatusChange, dark, index }) {
  const sub = getSubject(task.subject);
  const pri = PRIORITIES.find(p=>p.id===task.priority);
  const sta = STATUSES.find(s=>s.id===task.status);
  const isOverdue  = task.dueDate < today() && task.status !== "completed";
  const isDueToday = task.dueDate === today();

  function addRipple(e) {
    const card = e.currentTarget.closest(".task-card");
    if (!card) return;
    const r = document.createElement("span");
    const rect = card.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
    r.className = "ripple-effect";
    card.appendChild(r);
    setTimeout(()=>r.remove(), 700);
  }

  return (
    <div className={`task-card glass ripple-container rounded-2xl p-4 border animate-fadeUp stagger-${Math.min(index+1,5)} ${dark?`glass-dark ${isOverdue?"border-rose-500/30":sub.border}`:`glass-light ${isOverdue?"border-rose-300":"border-slate-200"}`} ${task.status==="completed"?"opacity-60":""}`} style={{"--glow-color":`${sub.hex}33`}}>
      <div className="flex items-start gap-3">
        <button onClick={e=>{ addRipple(e); onStatusChange(task.id, task.status==="completed"?"pending":"completed"); }}
          className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded-md border-2 flex items-center justify-center btn-magnetic ${task.status==="completed"?`border-transparent bg-gradient-to-r ${sub.gradient}`:dark?"border-slate-600 hover:border-slate-400":"border-slate-300 hover:border-slate-500"}`}>
          {task.status==="completed" && <Icons.Check size={12} color="white"/>}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-medium text-sm leading-snug ${task.status==="completed"?"line-through":""} ${dark?"text-slate-200":"text-slate-800"}`}>{task.title}</h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={onEdit}   className={`w-7 h-7 flex items-center justify-center rounded-lg btn-magnetic ${dark?"hover:bg-slate-700 text-slate-500 hover:text-slate-300":"hover:bg-slate-100 text-slate-400 hover:text-slate-600"}`}><Icons.Edit size={13}/></button>
              <button onClick={onDelete} className={`w-7 h-7 flex items-center justify-center rounded-lg btn-magnetic ${dark?"hover:bg-rose-500/20 text-slate-500 hover:text-rose-400":"hover:bg-rose-50 text-slate-400 hover:text-rose-500"}`}><Icons.Trash size={13}/></button>
            </div>
          </div>
          {task.description && <p className={`text-xs mt-1 line-clamp-2 ${dark?"text-slate-500":"text-slate-500"}`}>{task.description}</p>}
          <div className="mt-2.5 flex items-center flex-wrap gap-1.5">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${sub.badge}`}>
              <Icons.SubjectIcon subject={sub.id} size={11} color="currentColor"/>
              {sub.label}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${pri.bg} ${pri.color}`}>{pri.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${sta.bg} ${sta.color}`}>{sta.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ml-auto ${isOverdue?"text-rose-400 bg-rose-500/20 border border-rose-500/30":isDueToday?"text-amber-400 bg-amber-500/20 border border-amber-500/30":dark?"text-slate-500 bg-slate-800 border-slate-700":"text-slate-500 bg-slate-100 border-slate-200"}`}>
              {isOverdue?"⚠ ":isDueToday?"⏰ ":""}{task.dueDate}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CALENDAR VIEW ────────────────────────────────────────────────────────────
function CalendarView({ tasks, dark, onEdit, onAdd }) {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [calDir, setCalDir] = useState(null); // "left"|"right"|null
  const [calKey, setCalKey] = useState(0);

  function changeMonth(dir) {
    setCalDir(dir);
    setCalKey(k=>k+1);
    if (dir==="left") { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }
    else              { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }
    setTimeout(()=>setCalDir(null), 400);
  }

  // Swipe on the calendar grid itself
  const calRef = useSwipeGesture({
    onSwipeLeft:  ()=>changeMonth("left"),
    onSwipeRight: ()=>changeMonth("right"),
  });

  const firstDay     = new Date(year,month,1).getDay();
  const daysInMonth  = new Date(year,month+1,0).getDate();
  const cells        = [...Array(firstDay).fill(null), ...Array(daysInMonth).fill(null).map((_,i)=>i+1)];
  while (cells.length%7!==0) cells.push(null);

  function dateStr(d){ if(!d)return null; return `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
  function tasksFor(d){ const ds=dateStr(d); return ds?tasks.filter(t=>t.dueDate===ds):[]; }
  const todayStr = today();

  const animCls = calDir==="left" ? "cal-enter-right" : calDir==="right" ? "cal-enter-left" : "";

  return (
    <div className="animate-fadeUp">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={()=>changeMonth("right")} className={`w-9 h-9 rounded-xl flex items-center justify-center btn-magnetic ${dark?"bg-slate-800 text-slate-300 hover:bg-slate-700":"bg-slate-100 text-slate-600 hover:bg-slate-200"}`}><Icons.ChevronLeft/></button>
          <h2 className={`text-lg font-bold min-w-36 text-center ${dark?"text-white":"text-slate-900"}`}>{MONTHS[month]} {year}</h2>
          <button onClick={()=>changeMonth("left")}  className={`w-9 h-9 rounded-xl flex items-center justify-center btn-magnetic ${dark?"bg-slate-800 text-slate-300 hover:bg-slate-700":"bg-slate-100 text-slate-600 hover:bg-slate-200"}`}><Icons.ChevronRight/></button>
        </div>
        <button onClick={()=>{setYear(now.getFullYear());setMonth(now.getMonth());}} className={`text-xs px-3 py-1.5 rounded-lg btn-magnetic ${dark?"bg-slate-800 text-slate-400":"bg-slate-100 text-slate-500"}`}>Today</button>
      </div>

      <div ref={calRef} className={`glass rounded-2xl overflow-hidden border ${dark?"glass-dark":"glass-light"} touch-pan-y`}>
        <div className="grid grid-cols-7">
          {DAYS.map(d=>(
            <div key={d} className={`text-center py-2 text-xs font-semibold uppercase tracking-wider ${dark?"text-slate-500 border-b border-slate-800":"text-slate-400 border-b border-slate-200"}`}>{d}</div>
          ))}
        </div>
        <div key={calKey} className={`grid grid-cols-7 divide-x divide-y ${animCls}`} style={{borderColor:dark?"rgba(51,65,85,0.4)":"rgba(226,232,240,0.8)"}}>
          {cells.map((d,i)=>{
            const ts = tasksFor(d);
            const isToday = dateStr(d)===todayStr;
            return (
              <div key={i} onClick={()=>d&&onAdd(dateStr(d))} className={`cal-cell min-h-20 p-1.5 cursor-pointer relative ${d?dark?"hover:bg-slate-800/60":"hover:bg-slate-50":""} ${!d?dark?"bg-slate-900/30":"bg-slate-50/50":""}`}>
                {d && (
                  <>
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1 ${isToday?"bg-violet-500 text-white shadow-lg shadow-violet-500/40":dark?"text-slate-400":"text-slate-600"}`}>{d}</div>
                    <div className="space-y-0.5">
                      {ts.slice(0,2).map(t=>{
                        const s=getSubject(t.subject);
                        return <div key={t.id} onClick={e=>{e.stopPropagation();onEdit(t);}} className={`text-xs px-1 py-0.5 rounded truncate border ${s.badge} btn-magnetic`} title={t.title}>{t.title}</div>;
                      })}
                      {ts.length>2 && <div className={`text-xs ${dark?"text-slate-500":"text-slate-400"}`}>+{ts.length-2}</div>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-3">
        {SUBJECTS.map(s=>(
          <div key={s.id} className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded-sm" style={{background:s.hex}}/>
            <span className={dark?"text-slate-400":"text-slate-500"}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FOCUS VIEW ───────────────────────────────────────────────────────────────
function FocusView({ dark }) {
  const [running,        setRunning]        = useLocalStorage("ypt_running", false);
  const [elapsed,        setElapsed]        = useLocalStorage("ypt_elapsed", 0);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [activeSubject,  setActiveSubject]  = useLocalStorage("ypt_subject", "statistics");
  const [history,        setHistory]        = useLocalStorage("ypt_history", []);
  const [fullscreen,     setFullscreen]     = useState(false);
  const [pomodoroMode,   setPomodoroMode]   = useState(false);
  const [pomodoroLen,    setPomodoroLen]    = useState(25);
  const [breakLen,       setBreakLen]       = useState(5);
  const [onBreak,        setOnBreak]        = useState(false);
  const [pomodoroElapsed,setPomodoroElapsed]= useState(0);
  const [pomodoroCount,  setPomodoroCount]  = useLocalStorage("ypt_pomo_count", 0);
  const [dailyTarget,    setDailyTarget]    = useLocalStorage("ypt_daily_target", 14400);
  const intervalRef  = useRef(null);
  const startTimeRef = useRef(null);
  const sub = getSubject(activeSubject);

  useEffect(()=>{
    if (running) {
      startTimeRef.current = Date.now() - sessionElapsed*1000;
      intervalRef.current = setInterval(()=>{
        const diff = Math.floor((Date.now()-startTimeRef.current)/1000);
        setSessionElapsed(diff);
        setElapsed(e=>e+1);
        if (pomodoroMode) {
          setPomodoroElapsed(p=>{
            const total = onBreak ? breakLen*60 : pomodoroLen*60;
            if (p+1>=total){ if(!onBreak){setPomodoroCount(c=>c+1);setHistory(h=>[...h,{subject:activeSubject,duration:pomodoroLen*60,date:today(),type:"pomodoro"}]);} setOnBreak(b=>!b); return 0; }
            return p+1;
          });
        }
      },1000);
    } else { clearInterval(intervalRef.current); }
    return ()=>clearInterval(intervalRef.current);
  },[running,pomodoroMode,onBreak,pomodoroLen,breakLen]);

  function toggle(){ if(running){ setHistory(h=>[...h,{subject:activeSubject,duration:sessionElapsed,date:today(),type:"manual"}]); setSessionElapsed(0); setPomodoroElapsed(0); } setRunning(r=>!r); }
  function reset(){ setRunning(false); setSessionElapsed(0); setPomodoroElapsed(0); setElapsed(0); }
  function fmt(s){ const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60; return h>0?`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`:`${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`; }

  const pomodoroTotal       = onBreak ? breakLen*60 : pomodoroLen*60;
  const pomodoroCircumference = 2*Math.PI*45;
  const strokeDashoffset    = pomodoroMode ? pomodoroCircumference*(1-pomodoroElapsed/pomodoroTotal) : pomodoroCircumference*(1-(sessionElapsed%3600)/3600);
  const dailyProgress       = Math.min(elapsed/dailyTarget,1);
  const subjectTimes        = SUBJECTS.map(s=>({...s,total:history.filter(h=>h.subject===s.id).reduce((a,b)=>a+b.duration,0)}));
  const maxTime             = Math.max(...subjectTimes.map(s=>s.total),1);

  const TimerDisplay = ({big=false})=>(
    <div className="flex flex-col items-center">
      <div className={`relative ${big?"w-52 h-52":"w-40 h-40"}`}>
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke={dark?"rgba(148,163,184,0.1)":"rgba(0,0,0,0.06)"} strokeWidth="3"/>
          <circle cx="50" cy="50" r="45" fill="none" stroke={sub.hex} strokeWidth="3" strokeDasharray={pomodoroCircumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="pomodoro-ring"/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`timer-digit ${big?"text-5xl":"text-3xl"} font-bold ${running?"animate-ticker":""}`} style={{color:running?sub.hex:dark?"white":"#0f172a"}}>
            {pomodoroMode?fmt(pomodoroElapsed):fmt(sessionElapsed)}
          </div>
          {pomodoroMode&&<div className={`text-xs mt-1 font-medium ${dark?"text-slate-400":"text-slate-500"}`}>{onBreak?"Break":`Round ${pomodoroCount+1}`}</div>}
        </div>
      </div>
    </div>
  );

  if (fullscreen) return (
    <div className="focus-overlay flex flex-col items-center justify-center gap-8 animate-fadeIn" style={{"--glow-color":`${sub.hex}44`}}>
      <div className="animate-pulse-glow absolute inset-0 pointer-events-none" style={{background:`radial-gradient(ellipse 60% 40% at 50% 50%,${sub.hex}15,transparent)`}}/>
      <div className="relative z-10 flex flex-col items-center gap-6 w-full px-6">
        <div className="text-center">
          <div className="flex justify-center mb-3"><Icons.SubjectIcon subject={sub.id} size={48} color={sub.hex}/></div>
          <h2 className="text-2xl font-bold text-white">{sub.label}</h2>
          <p className="text-slate-400 text-sm mt-1">Focus Mode Active</p>
        </div>
        <TimerDisplay big/>
        <div className="flex gap-4">
          <button onClick={toggle} className={`px-8 py-3 rounded-2xl font-semibold text-white btn-magnetic shadow-2xl bg-gradient-to-r ${sub.gradient} flex items-center gap-2`}>
            {running?<><Icons.Pause size={18}/> Pause</>:<><Icons.Play size={18}/> Resume</>}
          </button>
          <button onClick={()=>setFullscreen(false)} className="px-6 py-3 rounded-2xl font-medium text-slate-400 btn-magnetic hover:bg-white/10">Exit</button>
        </div>
        <div className="text-center w-full max-w-xs">
          <div className="text-slate-500 text-xs mb-2">Today's Total</div>
          <div className="timer-digit text-3xl font-bold" style={{color:sub.hex}}>{fmt(elapsed)}</div>
          <div className="mt-3 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000" style={{width:`${dailyProgress*100}%`,background:`linear-gradient(90deg,${sub.hex},${sub.hex}aa)`}}/>
          </div>
          <div className="text-slate-600 text-xs mt-1">{Math.round(dailyProgress*100)}% of daily goal</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 animate-fadeUp">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${dark?"text-white":"text-slate-900"}`}>YPT Focus Engine</h2>
          <p className={`text-sm mt-0.5 ${dark?"text-slate-400":"text-slate-500"}`}>Elite Yeolpumta-inspired tracker</p>
        </div>
        <button onClick={()=>{if(!running)setRunning(true);setFullscreen(true);}} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium btn-magnetic text-white bg-gradient-to-r ${sub.gradient}`}>
          <Icons.Expand size={15}/>Full Screen
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`lg:col-span-2 glass rounded-2xl p-5 border ${dark?"glass-dark":"glass-light"}`}>
          <div className="flex flex-col items-center gap-5">
            <div className="flex items-center gap-2 self-start w-full flex-wrap">
              <span className={`text-xs font-medium ${dark?"text-slate-400":"text-slate-500"}`}>Subject:</span>
              {SUBJECTS.map(s=>(
                <button key={s.id} onClick={()=>{if(!running)setActiveSubject(s.id);}} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border btn-magnetic ${activeSubject===s.id?`${s.badge} border`:dark?"bg-slate-800 border-slate-700 text-slate-500":"bg-slate-100 border-slate-200 text-slate-400"}`}>
                  <Icons.SubjectIcon subject={s.id} size={12}/> {s.label}
                </button>
              ))}
            </div>
            <TimerDisplay/>
            <div className={`flex rounded-xl p-1 ${dark?"bg-slate-800":"bg-slate-100"}`}>
              <button onClick={()=>{setPomodoroMode(false);setPomodoroElapsed(0);}} className={`px-4 py-1.5 rounded-lg text-xs font-medium btn-magnetic ${!pomodoroMode?`text-white bg-gradient-to-r ${sub.gradient}`:dark?"text-slate-400":"text-slate-500"}`}>Stopwatch</button>
              <button onClick={()=>{setPomodoroMode(true);setPomodoroElapsed(0);}}  className={`px-4 py-1.5 rounded-lg text-xs font-medium btn-magnetic ${pomodoroMode?`text-white bg-gradient-to-r ${sub.gradient}`:dark?"text-slate-400":"text-slate-500"}`}>Pomodoro</button>
            </div>
            {pomodoroMode&&(
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className={`text-xs mb-1 ${dark?"text-slate-400":"text-slate-500"}`}>Focus (min)</div>
                  <div className="flex items-center gap-1">
                    <button onClick={()=>setPomodoroLen(l=>Math.max(1,l-5))} className={`w-6 h-6 rounded-lg btn-magnetic ${dark?"bg-slate-700 text-slate-300":"bg-slate-200 text-slate-600"}`}>-</button>
                    <span className={`w-8 text-center text-sm font-mono font-bold ${dark?"text-white":"text-slate-900"}`}>{pomodoroLen}</span>
                    <button onClick={()=>setPomodoroLen(l=>Math.min(60,l+5))} className={`w-6 h-6 rounded-lg btn-magnetic ${dark?"bg-slate-700 text-slate-300":"bg-slate-200 text-slate-600"}`}>+</button>
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-xs mb-1 ${dark?"text-slate-400":"text-slate-500"}`}>Break (min)</div>
                  <div className="flex items-center gap-1">
                    <button onClick={()=>setBreakLen(l=>Math.max(1,l-1))} className={`w-6 h-6 rounded-lg btn-magnetic ${dark?"bg-slate-700 text-slate-300":"bg-slate-200 text-slate-600"}`}>-</button>
                    <span className={`w-8 text-center text-sm font-mono font-bold ${dark?"text-white":"text-slate-900"}`}>{breakLen}</span>
                    <button onClick={()=>setBreakLen(l=>Math.min(30,l+1))} className={`w-6 h-6 rounded-lg btn-magnetic ${dark?"bg-slate-700 text-slate-300":"bg-slate-200 text-slate-600"}`}>+</button>
                  </div>
                </div>
                <div className={`text-sm px-3 py-1 rounded-lg ${dark?"bg-slate-800 text-slate-400":"bg-slate-100 text-slate-500"}`}>Rounds: {pomodoroCount}</div>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={toggle} className={`px-8 py-3 rounded-2xl font-semibold text-white btn-magnetic shadow-lg bg-gradient-to-r ${sub.gradient} flex items-center gap-2 ${running?"animate-pulse-glow":""}`} style={{"--glow-color":`${sub.hex}44`}}>
                {running?<><Icons.Pause size={18}/> Pause</>:<><Icons.Play size={18}/> {sessionElapsed>0?"Resume":"Start"}</>}
              </button>
              <button onClick={reset} className={`px-5 py-3 rounded-2xl font-medium btn-magnetic flex items-center gap-2 ${dark?"bg-slate-800 text-slate-400 hover:bg-slate-700":"bg-slate-100 text-slate-500 hover:bg-slate-200"}`}><Icons.Reset size={16}/>Reset</button>
            </div>
            <div className="w-full">
              <div className="flex justify-between text-xs mb-1.5">
                <span className={dark?"text-slate-400":"text-slate-500"}>Daily Goal</span>
                <span className={dark?"text-slate-300":"text-slate-700"}>{fmt(elapsed)} / {fmt(dailyTarget)}</span>
              </div>
              <div className={`h-2 rounded-full ${dark?"bg-slate-800":"bg-slate-200"} overflow-hidden`}>
                <div className="h-full rounded-full transition-all duration-1000 progress-bar" style={{width:`${dailyProgress*100}%`,background:`linear-gradient(90deg,${sub.hex},${sub.hex}99)`}}/>
              </div>
              <div className="flex justify-end mt-1">
                <select value={dailyTarget/3600} onChange={e=>setDailyTarget(Number(e.target.value)*3600)} className={`text-xs rounded-lg px-1 py-0.5 border ${dark?"bg-slate-800 border-slate-700 text-slate-300":"bg-white border-slate-200 text-slate-600"}`}>
                  {[2,3,4,5,6,8,10].map(h=><option key={h} value={h}>{h}h goal</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className={`glass rounded-2xl p-5 border ${dark?"glass-dark":"glass-light"}`}>
          <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${dark?"text-slate-300":"text-slate-700"}`}>
            <span className={`w-2 h-2 rounded-full ${running?"animate-pulse":""}`} style={{background:running?sub.hex:"#64748b"}}/>
            Live Study Room
          </h3>
          {running&&(
            <div className={`mb-4 flex items-center gap-3 p-3 rounded-xl border ${sub.bg} ${sub.border}`}>
              <div className="w-2.5 h-2.5 rounded-full animate-pulse-glow flex-shrink-0" style={{background:sub.hex}}/>
              <div>
                <div className={`text-xs font-semibold ${sub.text}`}>Live: {sub.label}</div>
                <div className={`text-xs ${dark?"text-slate-500":"text-slate-400"}`}>Session: {fmt(sessionElapsed)}</div>
              </div>
            </div>
          )}
          <div className="space-y-2.5">
            {subjectTimes.map(s=>(
              <div key={s.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={`flex items-center gap-1.5 ${s.text}`}><Icons.SubjectIcon subject={s.id} size={11}/>{s.label}</span>
                  <span className={`font-mono ${dark?"text-slate-400":"text-slate-500"}`}>{fmt(s.total)}</span>
                </div>
                <div className={`h-1.5 rounded-full ${dark?"bg-slate-800":"bg-slate-200"} overflow-hidden`}>
                  <div className={`h-full rounded-full analytics-bar ${s.bar}`} style={{width:`${(s.total/maxTime)*100}%`}}/>
                </div>
              </div>
            ))}
          </div>
          {history.length>0&&(
            <div className="mt-4">
              <div className={`text-xs font-medium mb-2 ${dark?"text-slate-400":"text-slate-500"}`}>Recent Sessions</div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {[...history].reverse().slice(0,8).map((h,i)=>{
                  const s=getSubject(h.subject);
                  return <div key={i} className={`flex items-center justify-between text-xs p-2 rounded-lg ${dark?"bg-slate-800/60":"bg-slate-50"}`}><span className={`flex items-center gap-1.5 ${s.text}`}><Icons.SubjectIcon subject={s.id} size={11}/>{s.label}</span><span className={`font-mono ${dark?"text-slate-400":"text-slate-500"}`}>{fmt(h.duration)}</span></div>;
                })}
              </div>
            </div>
          )}
          {history.length>0&&<button onClick={()=>{if(confirm("Clear session history?"))setHistory([]);}} className={`mt-3 w-full text-xs py-1.5 rounded-lg btn-magnetic ${dark?"text-slate-500 hover:bg-rose-500/10 hover:text-rose-400":"text-slate-400 hover:bg-rose-50 hover:text-rose-500"}`}>Clear History</button>}
        </div>
      </div>
    </div>
  );
}

// ─── INSIGHTS VIEW ────────────────────────────────────────────────────────────
function InsightsView({ tasks, dark }) {
  const bySubject = SUBJECTS.map(s=>{ const all=tasks.filter(t=>t.subject===s.id),done=all.filter(t=>t.status==="completed"); return {...s,total:all.length,done:done.length,rate:all.length?done.length/all.length:0}; });
  const weekDays  = [...Array(7)].map((_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return d.toISOString().split("T")[0]; });
  const weekData  = weekDays.map(d=>({ date:d, label:new Date(d).toLocaleDateString("en",{weekday:"short"}), done:tasks.filter(t=>t.dueDate===d&&t.status==="completed").length, total:tasks.filter(t=>t.dueDate===d).length }));
  const maxW      = Math.max(...weekData.map(d=>d.total),1);
  const totalTasks     = tasks.length;
  const completedTasks = tasks.filter(t=>t.status==="completed").length;
  const overdueTasks   = tasks.filter(t=>t.dueDate<today()&&t.status!=="completed").length;
  const dueTodayTasks  = tasks.filter(t=>t.dueDate===today()&&t.status!=="completed").length;
  return (
    <div className="space-y-5 animate-fadeUp">
      <div><h2 className={`text-2xl font-bold ${dark?"text-white":"text-slate-900"}`}>Insights</h2><p className={`text-sm mt-0.5 ${dark?"text-slate-400":"text-slate-500"}`}>Track your progress across all subjects</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[{l:"Total",v:totalTasks,g:"from-violet-500 to-purple-600"},{l:"Completed",v:completedTasks,g:"from-emerald-500 to-green-600"},{l:"Overdue",v:overdueTasks,g:"from-rose-500 to-red-600"},{l:"Due Today",v:dueTodayTasks,g:"from-amber-500 to-yellow-600"}].map((s,i)=>(
          <div key={i} className={`glass rounded-2xl p-4 border animate-fadeUp stagger-${i+1} ${dark?"glass-dark":"glass-light"}`}>
            <div className={`text-3xl font-bold font-mono bg-gradient-to-r ${s.g} bg-clip-text text-transparent`}>{s.v}</div>
            <div className={`text-xs mt-1 ${dark?"text-slate-400":"text-slate-500"}`}>{s.l}</div>
          </div>
        ))}
      </div>
      <div className={`glass rounded-2xl p-5 border ${dark?"glass-dark":"glass-light"}`}>
        <h3 className={`text-sm font-semibold mb-4 ${dark?"text-slate-300":"text-slate-700"}`}>Completion Rate by Subject</h3>
        <div className="space-y-4">
          {bySubject.map(s=>(
            <div key={s.id}>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`flex items-center gap-2 text-sm font-medium ${dark?"text-slate-300":"text-slate-700"}`}><Icons.SubjectIcon subject={s.id} size={14} color={s.hex}/>{s.label}</span>
                <div className="flex items-center gap-3"><span className={`text-xs ${dark?"text-slate-500":"text-slate-400"}`}>{s.done}/{s.total}</span><span className={`text-sm font-semibold font-mono ${s.text}`}>{Math.round(s.rate*100)}%</span></div>
              </div>
              <div className={`h-2.5 rounded-full ${dark?"bg-slate-800":"bg-slate-200"} overflow-hidden`}>
                <div className={`h-full rounded-full progress-bar ${s.bar}`} style={{width:`${s.rate*100}%`}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={`glass rounded-2xl p-5 border ${dark?"glass-dark":"glass-light"}`}>
        <h3 className={`text-sm font-semibold mb-4 ${dark?"text-slate-300":"text-slate-700"}`}>Weekly Output Velocity</h3>
        <div className="flex items-end justify-between gap-2 h-28">
          {weekData.map((d,i)=>(
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full">
              <div className="flex-1 w-full flex items-end gap-0.5">
                <div className="w-full rounded-t-lg transition-all duration-700" style={{height:`${d.total>0?(d.total/maxW)*100:0}%`,background:"rgba(139,92,246,0.2)",minHeight:d.total>0?"4px":"0"}}/>
              </div>
              <div className="w-full relative" style={{height:`${d.done>0?(d.done/maxW)*100:0}%`,minHeight:d.done>0?"4px":"0",marginTop:"auto"}}>
                <div className="w-full h-full rounded-t-lg" style={{background:"linear-gradient(to top,#7c3aed,#8b5cf6)"}}/>
              </div>
              <div className={`text-xs ${dark?"text-slate-500":"text-slate-400"}`}>{d.label}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded-sm bg-violet-500/30"/><span className={dark?"text-slate-500":"text-slate-400"}>Total due</span></div>
          <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded-sm bg-violet-600"/><span className={dark?"text-slate-500":"text-slate-400"}>Completed</span></div>
        </div>
      </div>
      <div className={`glass rounded-2xl p-5 border ${dark?"glass-dark":"glass-light"}`}>
        <h3 className={`text-sm font-semibold mb-3 ${dark?"text-slate-300":"text-slate-700"}`}>Priority Breakdown</h3>
        <div className="grid grid-cols-3 gap-3">
          {PRIORITIES.map(p=>{ const count=tasks.filter(t=>t.priority===p.id).length,done=tasks.filter(t=>t.priority===p.id&&t.status==="completed").length; return (
            <div key={p.id} className={`rounded-xl p-4 border text-center ${p.bg}`}><div className={`text-2xl font-bold font-mono ${p.color}`}>{count}</div><div className={`text-xs font-medium mt-1 ${p.color}`}>{p.label}</div><div className={`text-xs mt-0.5 ${dark?"text-slate-500":"text-slate-400"}`}>{done} done</div></div>
          );})}
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ tasks, dark, onAdd, onView }) {
  const completedTasks = tasks.filter(t=>t.status==="completed").length;
  const todayTasks     = tasks.filter(t=>t.dueDate===today()&&t.status!=="completed");
  const overdueTasks   = tasks.filter(t=>t.dueDate<today()&&t.status!=="completed");
  const overallProgress= tasks.length ? completedTasks/tasks.length : 0;
  const hour = new Date().getHours();
  const greeting = hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";

  return (
    <div className="space-y-5 animate-fadeUp">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${dark?"text-white":"text-slate-900"}`}>{greeting} ✦</h2>
          <p className={`text-sm mt-0.5 ${dark?"text-slate-400":"text-slate-500"}`}>{new Date().toLocaleDateString("en",{weekday:"long",month:"long",day:"numeric"})}</p>
        </div>
        <button onClick={()=>onAdd()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white btn-magnetic bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30"><Icons.Plus size={16}/>New Task</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[{l:"Total",v:tasks.length,g:"from-slate-500 to-slate-600"},{l:"Completed",v:completedTasks,g:"from-emerald-500 to-green-600"},{l:"Due Today",v:todayTasks.length,g:"from-amber-500 to-yellow-600"},{l:"Overdue",v:overdueTasks.length,g:"from-rose-500 to-red-600"}].map((s,i)=>(
          <div key={i} className={`glass rounded-2xl p-4 border animate-fadeUp stagger-${i+1} ${dark?"glass-dark":"glass-light"}`}>
            <div className={`text-3xl font-bold font-mono mt-1 bg-gradient-to-r ${s.g} bg-clip-text text-transparent`}>{s.v}</div>
            <div className={`text-xs mt-1 ${dark?"text-slate-400":"text-slate-500"}`}>{s.l}</div>
          </div>
        ))}
      </div>

      <div className={`glass rounded-2xl p-4 border ${dark?"glass-dark":"glass-light"}`}>
        <div className="flex items-center justify-between mb-2.5">
          <span className={`text-sm font-medium ${dark?"text-slate-300":"text-slate-700"}`}>Overall Progress</span>
          <span className={`text-sm font-bold font-mono ${dark?"text-violet-400":"text-violet-600"}`}>{Math.round(overallProgress*100)}%</span>
        </div>
        <div className={`h-2.5 rounded-full ${dark?"bg-slate-800":"bg-slate-200"} overflow-hidden`}>
          <div className="h-full rounded-full progress-bar bg-gradient-to-r from-violet-500 to-purple-600" style={{width:`${overallProgress*100}%`}}/>
        </div>
      </div>

      <div>
        <h3 className={`text-xs font-semibold mb-3 uppercase tracking-wider ${dark?"text-slate-500":"text-slate-400"}`}>Subjects</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {SUBJECTS.map((s,i)=>{ const st=tasks.filter(t=>t.subject===s.id),sd=st.filter(t=>t.status==="completed"),sp=st.length?sd.length/st.length:0; return (
            <button key={s.id} onClick={()=>onView("tasks",s.id)} className={`subject-card glass rounded-2xl p-4 border text-left animate-fadeUp stagger-${Math.min(i+1,5)} ${dark?"glass-dark":"glass-light"} hover:shadow-lg`} style={{"--glow-color":`${s.hex}33`}}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg} ${s.border} border`}><Icons.SubjectIcon subject={s.id} size={20} color={s.hex}/></div>
                <span className={`text-xs font-mono font-semibold ${s.text}`}>{st.length}</span>
              </div>
              <div className={`text-sm font-semibold mb-1 ${dark?"text-slate-200":"text-slate-800"}`}>{s.label}</div>
              <div className={`text-xs mb-2.5 ${dark?"text-slate-500":"text-slate-400"}`}>{sd.length}/{st.length} done</div>
              <div className={`h-1 rounded-full ${dark?"bg-slate-800":"bg-slate-200"} overflow-hidden`}><div className={`h-full rounded-full progress-bar ${s.bar}`} style={{width:`${sp*100}%`}}/></div>
            </button>
          );})}
        </div>
      </div>

      {todayTasks.length>0&&(
        <div>
          <h3 className={`text-xs font-semibold mb-3 uppercase tracking-wider ${dark?"text-slate-500":"text-slate-400"}`}>Due Today</h3>
          <div className="space-y-2">
            {todayTasks.slice(0,5).map((t,i)=>{ const s=getSubject(t.subject),p=PRIORITIES.find(pr=>pr.id===t.priority); return (
              <div key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border btn-magnetic animate-fadeUp stagger-${Math.min(i+1,5)} ${dark?"glass-dark":"glass-light"}`}>
                <div className={`w-1 h-8 rounded-full bg-gradient-to-b ${s.gradient} flex-shrink-0`}/>
                <Icons.SubjectIcon subject={s.id} size={18} color={s.hex}/>
                <div className="flex-1 min-w-0"><div className={`text-sm font-medium truncate ${dark?"text-slate-200":"text-slate-800"}`}>{t.title}</div><div className={`text-xs ${dark?"text-slate-500":"text-slate-400"}`}>{s.label}</div></div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${p.bg} ${p.color}`}>{p.label}</span>
              </div>
            );})}
            {todayTasks.length>5&&<button onClick={()=>onView("tasks")} className={`w-full text-xs py-2 rounded-xl btn-magnetic ${dark?"text-slate-500 hover:bg-slate-800":"text-slate-400 hover:bg-slate-100"}`}>View all {todayTasks.length} tasks →</button>}
          </div>
        </div>
      )}

      {overdueTasks.length>0&&(
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 flex items-center gap-3">
          <Icons.Alert size={20} color="#f87171"/>
          <div><div className="text-sm font-medium text-rose-400">{overdueTasks.length} overdue task{overdueTasks.length!==1?"s":""}</div><button onClick={()=>onView("tasks")} className="text-xs text-rose-500 hover:text-rose-400 underline">View all overdue →</button></div>
        </div>
      )}
    </div>
  );
}

// ─── TASKS VIEW ───────────────────────────────────────────────────────────────
function TasksView({ tasks, dark, onAdd, onEdit, onDelete, onStatusChange, filterSubject, setFilterSubject }) {
  const [search,         setSearch]         = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus,   setFilterStatus]   = useState("all");
  const [sortBy,         setSortBy]         = useState("dueDate");
  const [viewMode,       setViewMode]       = useState("list");

  const filtered = tasks
    .filter(t=>!filterSubject||t.subject===filterSubject)
    .filter(t=>filterPriority==="all"||t.priority===filterPriority)
    .filter(t=>filterStatus==="all"||t.status===filterStatus)
    .filter(t=>!search||t.title.toLowerCase().includes(search.toLowerCase())||t.description?.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>{ if(sortBy==="dueDate")return a.dueDate.localeCompare(b.dueDate); if(sortBy==="priority"){const o={high:0,medium:1,low:2};return o[a.priority]-o[b.priority];} if(sortBy==="subject")return a.subject.localeCompare(b.subject); return new Date(b.createdAt)-new Date(a.createdAt); });

  const inputCls = dark ? "bg-slate-800/80 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-violet-500/50" : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-violet-400";

  if (viewMode==="calendar") return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={()=>setViewMode("list")} className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg btn-magnetic ${dark?"bg-slate-800 text-slate-400 hover:bg-slate-700":"bg-slate-100 text-slate-500 hover:bg-slate-200"}`}><Icons.ChevronLeft size={16}/>List View</button>
      </div>
      <CalendarView tasks={tasks} dark={dark} onEdit={onEdit} onAdd={date=>onAdd(null,date)}/>
    </div>
  );

  return (
    <div className="space-y-4 animate-fadeUp">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${dark?"text-white":"text-slate-900"}`}>Tasks</h2>
          <p className={`text-sm mt-0.5 ${dark?"text-slate-400":"text-slate-500"}`}>{filtered.length} of {tasks.length} tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setViewMode("calendar")} className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl btn-magnetic ${dark?"bg-slate-800 text-slate-400 hover:bg-slate-700":"bg-slate-100 text-slate-500 hover:bg-slate-200"}`}><Icons.Calendar size={15}/>Calendar</button>
          <button onClick={()=>onAdd()} className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium text-white btn-magnetic bg-gradient-to-r from-violet-500 to-purple-600"><Icons.Plus size={15}/>Add</button>
        </div>
      </div>

      <div className={`glass rounded-2xl p-3 border ${dark?"glass-dark":"glass-light"}`}>
        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-40 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tasks…" className={`form-input w-full pl-9 pr-4 py-2 rounded-xl border text-sm ${inputCls}`}/>
          </div>
          <select value={filterSubject||"all"} onChange={e=>setFilterSubject(e.target.value==="all"?null:e.target.value)} className={`form-input px-3 py-2 rounded-xl border text-sm ${inputCls}`}>
            <option value="all">All Subjects</option>
            {SUBJECTS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select value={filterPriority} onChange={e=>setFilterPriority(e.target.value)} className={`form-input px-3 py-2 rounded-xl border text-sm ${inputCls}`}>
            <option value="all">All Priority</option>
            {PRIORITIES.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className={`form-input px-3 py-2 rounded-xl border text-sm ${inputCls}`}>
            <option value="all">All Status</option>
            {STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className={`form-input px-3 py-2 rounded-xl border text-sm ${inputCls}`}>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="subject">Subject</option>
            <option value="created">Created</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={()=>setFilterSubject(null)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border btn-magnetic ${!filterSubject?"bg-violet-500/20 text-violet-300 border-violet-500/40":dark?"bg-slate-800 border-slate-700 text-slate-500":"bg-slate-100 border-slate-200 text-slate-500"}`}>All</button>
        {SUBJECTS.map(s=>(
          <button key={s.id} onClick={()=>setFilterSubject(s.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border btn-magnetic ${filterSubject===s.id?`${s.badge} border`:dark?"bg-slate-800 border-slate-700 text-slate-500":"bg-slate-100 border-slate-200 text-slate-500"}`}>
            <Icons.SubjectIcon subject={s.id} size={12}/>{s.label}
          </button>
        ))}
      </div>

      {filtered.length===0 ? <EmptyState subject={filterSubject} onAdd={()=>onAdd()} dark={dark}/> : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((t,i)=><TaskCard key={t.id} task={t} index={i} dark={dark} onEdit={()=>onEdit(t)} onDelete={()=>onDelete(t.id)} onStatusChange={onStatusChange}/>)}
        </div>
      )}
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ view, navTo, dark }) {
  const items = [
    { id:"dashboard", label:"Home",     Icon:Icons.Dashboard },
    { id:"tasks",     label:"Tasks",    Icon:Icons.Tasks },
    { id:"calendar",  label:"Calendar", Icon:Icons.Calendar },
    { id:"focus",     label:"Focus",    Icon:Icons.Focus },
    { id:"insights",  label:"Insights", Icon:Icons.Insights },
  ];
  const activeIdx = items.findIndex(i=>i.id===view);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 glass border-t" style={{background:dark?"rgba(2,6,23,0.88)":"rgba(255,255,255,0.88)",borderColor:dark?"rgba(51,65,85,0.6)":"rgba(226,232,240,0.8)",paddingBottom:"env(safe-area-inset-bottom)"}}>
      <div className="relative flex">
        {/* Sliding pill */}
        <div className="bottom-nav-pill absolute top-1 h-10 rounded-xl" style={{ left:`calc(${activeIdx/items.length*100}% + 4px)`, width:`calc(${100/items.length}% - 8px)`, background:dark?"rgba(139,92,246,0.15)":"rgba(139,92,246,0.1)", border:"1px solid rgba(139,92,246,0.25)" }}/>
        {items.map(({id,label,Icon})=>(
          <button key={id} onClick={()=>navTo(id)} style={{minHeight:"56px",flex:1}} className={`flex flex-col items-center justify-center gap-0.5 py-2 transition-all duration-300 ${view===id?"text-violet-400":dark?"text-slate-500":"text-slate-400"}`}>
            <Icon size={20} color="currentColor"/>
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [dark,          setDark]          = useLocalStorage("theme_dark", true);
  const [tasks,         setTasks]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [syncStatus,    setSyncStatus]    = useState("idle");
  const [view,          setView]          = useLocalStorage("view","dashboard");
  const [viewDir,       setViewDir]       = useState(null); // "left"|"right"
  const [viewKey,       setViewKey]       = useState(0);
  const [modal,         setModal]         = useState(null);
  const [filterSubject, setFilterSubject] = useState(null);
  const [mobileOpen,    setMobileOpen]    = useState(false);

  // Load tasks
  useEffect(()=>{ setLoading(true); dbGetTasks().then(rows=>setTasks((rows||[]).map(dbToTask))).catch(()=>setSyncStatus("error")).finally(()=>setLoading(false)); },[]);

  function openAdd(prefill={})   { setModal({prefill}); }
  function openEdit(task)        { setModal({task}); }

  async function saveTask(task) {
    setSyncStatus("saving");
    try { const isNew=!tasks.find(t=>t.id===task.id); if(isNew){await dbInsertTask(task);setTasks(ts=>[task,...ts]);}else{await dbUpdateTask(task);setTasks(ts=>ts.map(t=>t.id===task.id?task:t));} setSyncStatus("idle"); }
    catch { setSyncStatus("error"); setTimeout(()=>setSyncStatus("idle"),3000); }
  }
  async function deleteTask(id) {
    if(!confirm("Delete this task?"))return;
    setSyncStatus("saving");
    try { await dbDeleteTask(id); setTasks(ts=>ts.filter(t=>t.id!==id)); setSyncStatus("idle"); }
    catch { setSyncStatus("error"); setTimeout(()=>setSyncStatus("idle"),3000); }
  }
  async function changeStatus(id,status) {
    const task=tasks.find(t=>t.id===id); if(!task)return;
    const updated={...task,status};
    setSyncStatus("saving");
    try { await dbUpdateTask(updated); setTasks(ts=>ts.map(t=>t.id===id?updated:t)); setSyncStatus("idle"); }
    catch { setSyncStatus("error"); setTimeout(()=>setSyncStatus("idle"),3000); }
  }

  function exportData() { const blob=new Blob([JSON.stringify({tasks,exportedAt:new Date().toISOString()},null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`tasks-backup-${today()}.json`; a.click(); URL.revokeObjectURL(url); }
  async function importData() {
    const input=document.createElement("input"); input.type="file"; input.accept=".json";
    input.onchange=e=>{ const f=e.target.files[0]; if(!f)return; const reader=new FileReader(); reader.onload=async ev=>{ try{ const d=JSON.parse(ev.target.result); if(d.tasks&&Array.isArray(d.tasks)){ setSyncStatus("saving"); for(const t of d.tasks){ const exists=tasks.find(x=>x.id===t.id); if(exists)await dbUpdateTask(t);else await dbInsertTask(t);} const rows=await dbGetTasks(); setTasks((rows||[]).map(dbToTask)); setSyncStatus("idle"); alert(`Imported ${d.tasks.length} tasks!`); }else alert("Invalid backup file.");}catch{ alert("Failed to import."); setSyncStatus("error"); } }; reader.readAsText(f); };
    input.click();
  }

  // View navigation with direction tracking
  function navTo(v, subj=null) {
    if (v===view) return;
    const fromIdx = NAV_VIEWS.indexOf(view);
    const toIdx   = NAV_VIEWS.indexOf(v);
    const dir     = toIdx > fromIdx ? "left" : "right";
    setViewDir(dir);
    setViewKey(k=>k+1);
    setView(v);
    if (subj) setFilterSubject(subj);
    setMobileOpen(false);
    setTimeout(()=>setViewDir(null), 400);
  }

  // Global swipe — only fires when NOT inside calendar
  const globalSwipeRef = useSwipeGesture({
    onSwipeLeft:  ()=>{ const i=NAV_VIEWS.indexOf(view); if(i<NAV_VIEWS.length-1) navTo(NAV_VIEWS[i+1]); },
    onSwipeRight: ()=>{ const i=NAV_VIEWS.indexOf(view); if(i>0) navTo(NAV_VIEWS[i-1]); },
  });

  const totalTasks     = tasks.length;
  const completedTasks = tasks.filter(t=>t.status==="completed").length;
  const todayCount     = tasks.filter(t=>t.dueDate===today()&&t.status!=="completed").length;

  const navItems = [
    { id:"dashboard", label:"Dashboard", Icon:Icons.Dashboard },
    { id:"tasks",     label:"Tasks",     Icon:Icons.Tasks },
    { id:"calendar",  label:"Calendar",  Icon:Icons.Calendar },
    { id:"focus",     label:"Focus",     Icon:Icons.Focus },
    { id:"insights",  label:"Insights",  Icon:Icons.Insights },
  ];

  const bg      = dark ? "bg-slate-950" : "bg-slate-50";
  const sidebar = dark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200";
  const topbar  = dark ? "bg-slate-900/80 border-slate-800" : "bg-white/90 border-slate-200";

  const viewAnimCls = viewDir==="left" ? "view-enter-right" : viewDir==="right" ? "view-enter-left" : "animate-fadeUp";

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6" style={{fontFamily:"'Space Grotesk',sans-serif"}}>
      <GlobalStyle/>
      <AnimatedLogo size={64}/>
      <div className="text-center"><div className="text-white text-lg font-semibold mb-1">Task Manager</div><div className="text-slate-400 text-sm">Loading your tasks…</div></div>
      <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden"><div className="h-full w-3/5 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full animate-shimmer"/></div>
    </div>
  );

  return (
    <div className={`h-screen w-screen ${bg} noise relative overflow-hidden`} style={{fontFamily:"'Space Grotesk',sans-serif"}}>
      <GlobalStyle/>

      {/* Sync toast */}
      {syncStatus!=="idle"&&(
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg animate-scaleIn ${syncStatus==="saving"?"bg-violet-500/20 border border-violet-500/40 text-violet-300":"bg-rose-500/20 border border-rose-500/40 text-rose-300"}`}>
          {syncStatus==="saving"?<><span className="w-3 h-3 rounded-full border-2 border-violet-400 border-t-transparent animate-spin inline-block"/>Syncing…</>:<><Icons.Alert size={14}/>Sync failed</>}
        </div>
      )}

      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10 animate-spin-slow" style={{background:"radial-gradient(circle,#8b5cf6 0%,transparent 70%)"}}/>
        <div className="absolute top-1/3 -right-40 w-80 h-80 rounded-full opacity-8 animate-float" style={{background:"radial-gradient(circle,#3b82f6 0%,transparent 70%)",animationDelay:"1.5s"}}/>
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full opacity-8" style={{background:"radial-gradient(circle,#10b981 0%,transparent 70%)"}}/>
      </div>

      <div className="relative flex h-full">
        {/* ── Desktop Sidebar ── */}
        <aside className={`hidden lg:flex flex-col w-60 flex-shrink-0 glass border-r ${sidebar} z-20`}>
          <div className="p-5 border-b border-inherit">
            <div className="flex items-center gap-3">
              <AnimatedLogo size={36}/>
              <div><div className={`text-sm font-bold tracking-tight ${dark?"text-white":"text-slate-900"}`}>Task Manager</div><div className={`text-xs ${dark?"text-slate-500":"text-slate-400"}`}>Elite Study Planner</div></div>
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {navItems.map(({id,label,Icon})=>(
              <button key={id} onClick={()=>navTo(id)} className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all btn-magnetic ${view===id?"active bg-violet-500/15 text-violet-400 border border-violet-500/20":dark?"text-slate-400 hover:bg-slate-800 hover:text-slate-200":"text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
                <Icon size={18} color="currentColor"/>
                {label}
                {id==="tasks"&&tasks.length>0&&<span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-mono ${dark?"bg-slate-800 text-slate-400":"bg-slate-200 text-slate-500"}`}>{tasks.length}</span>}
                {id==="focus"&&<span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>}
              </button>
            ))}
            <div className={`pt-3 mt-3 border-t ${dark?"border-slate-800":"border-slate-200"}`}>
              <div className={`px-3 pb-2 text-xs font-semibold uppercase tracking-wider ${dark?"text-slate-600":"text-slate-400"}`}>Subjects</div>
              {SUBJECTS.map(s=>{ const count=tasks.filter(t=>t.subject===s.id&&t.status!=="completed").length; return (
                <button key={s.id} onClick={()=>{ setFilterSubject(s.id); navTo("tasks"); }} className={`nav-item w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all btn-magnetic ${filterSubject===s.id&&view==="tasks"?`${s.bg} ${s.text} border ${s.border}`:dark?"text-slate-500 hover:bg-slate-800 hover:text-slate-300":"text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`}>
                  <Icons.SubjectIcon subject={s.id} size={13} color="currentColor"/>
                  {s.label}
                  {count>0&&<span className={`ml-auto text-xs font-mono ${s.text}`}>{count}</span>}
                </button>
              );})}
            </div>
          </nav>
          <div className={`p-4 border-t ${dark?"border-slate-800":"border-slate-200"}`}>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[{v:totalTasks,l:"Total"},{v:completedTasks,l:"Done"},{v:todayCount,l:"Today"}].map((s,i)=>(
                <div key={i} className={`text-center rounded-lg p-2 ${dark?"bg-slate-800":"bg-slate-100"}`}><div className={`text-lg font-bold font-mono ${dark?"text-violet-400":"text-violet-600"}`}>{s.v}</div><div className={`text-xs ${dark?"text-slate-500":"text-slate-400"}`}>{s.l}</div></div>
              ))}
            </div>
            <div className="flex gap-1.5 mb-1.5">
              <button onClick={exportData} className={`flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg btn-magnetic ${dark?"bg-slate-800 text-slate-400 hover:bg-slate-700":"bg-slate-100 text-slate-500 hover:bg-slate-200"}`}><Icons.Upload size={13}/>Export</button>
              <button onClick={importData} className={`flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg btn-magnetic ${dark?"bg-slate-800 text-slate-400 hover:bg-slate-700":"bg-slate-100 text-slate-500 hover:bg-slate-200"}`}><Icons.Download size={13}/>Import</button>
            </div>
            <button onClick={()=>setDark(d=>!d)} className={`w-full flex items-center justify-center gap-2 text-xs py-2 rounded-lg btn-magnetic ${dark?"bg-slate-800 text-slate-400 hover:bg-slate-700":"bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
              {dark?<><Icons.Sun size={13}/>Light Mode</>:<><Icons.Moon size={13}/>Dark Mode</>}
            </button>
          </div>
        </aside>

        {/* ── Mobile Sidebar ── */}
        <div className={`mobile-menu lg:hidden fixed inset-y-0 left-0 w-72 z-40 flex flex-col glass ${sidebar} shadow-2xl ${mobileOpen?"open":"closed"}`} style={{paddingTop:"env(safe-area-inset-top)"}}>
          <div className="p-5 flex items-center justify-between border-b border-inherit">
            <div className="flex items-center gap-3"><AnimatedLogo size={34}/><div className={`text-sm font-bold ${dark?"text-white":"text-slate-900"}`}>Task Manager</div></div>
            <button onClick={()=>setMobileOpen(false)} className="text-slate-400 p-1 btn-magnetic"><Icons.Close size={18}/></button>
          </div>
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {navItems.map(({id,label,Icon})=>(
              <button key={id} onClick={()=>navTo(id)} className={`nav-item w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${view===id?"active bg-violet-500/15 text-violet-400":dark?"text-slate-400 hover:bg-slate-800":"text-slate-600 hover:bg-slate-100"}`}>
                <Icon size={18}/>{label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-inherit">
            <div className="flex gap-1.5 mb-2">
              <button onClick={exportData} className={`flex-1 flex items-center justify-center gap-1 text-xs py-2 rounded-lg ${dark?"bg-slate-800 text-slate-400":"bg-slate-100 text-slate-500"}`}><Icons.Upload size={13}/>Export</button>
              <button onClick={importData} className={`flex-1 flex items-center justify-center gap-1 text-xs py-2 rounded-lg ${dark?"bg-slate-800 text-slate-400":"bg-slate-100 text-slate-500"}`}><Icons.Download size={13}/>Import</button>
            </div>
            <button onClick={()=>setDark(d=>!d)} className={`w-full flex items-center justify-center gap-2 text-xs py-2 rounded-lg ${dark?"bg-slate-800 text-slate-400":"bg-slate-100 text-slate-500"}`}>
              {dark?<><Icons.Sun size={13}/>Light Mode</>:<><Icons.Moon size={13}/>Dark Mode</>}
            </button>
          </div>
        </div>
        {mobileOpen&&<div className="fixed inset-0 z-30 bg-black/50 lg:hidden animate-fadeIn" onClick={()=>setMobileOpen(false)}/>}

        {/* ── Main Content ── */}
        <div ref={globalSwipeRef} className="flex-1 flex flex-col min-w-0 overflow-hidden touch-pan-y">
          {/* Topbar */}
          <header className={`flex-shrink-0 flex items-center justify-between px-4 lg:px-6 py-3 glass border-b ${topbar} z-10`} style={{paddingTop:`calc(0.75rem + env(safe-area-inset-top))`}}>
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2 rounded-xl btn-magnetic" onClick={()=>setMobileOpen(true)}><Icons.Menu size={20} color={dark?"#94a3b8":"#475569"}/></button>
              <span className={`hidden sm:block text-sm font-medium capitalize ${dark?"text-slate-400":"text-slate-500"}`}>{view}</span>
            </div>
            <div className="flex items-center gap-2">
              {todayCount>0&&<div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20"><Icons.Calendar size={13}/>  {todayCount} due today</div>}
              <button onClick={()=>openAdd()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white btn-magnetic bg-gradient-to-r from-violet-500 to-purple-600"><Icons.Plus size={14}/>Task</button>
              <button onClick={()=>setDark(d=>!d)} className={`w-8 h-8 rounded-xl flex items-center justify-center btn-magnetic ${dark?"bg-slate-800 text-slate-300 hover:bg-slate-700":"bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {dark?<Icons.Sun size={16}/>:<Icons.Moon size={16}/>}
              </button>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
            <div key={viewKey} className={`max-w-5xl mx-auto p-4 lg:p-6 ${viewAnimCls}`}>
              {view==="dashboard" && <Dashboard tasks={tasks} dark={dark} onAdd={openAdd} onView={(v,s)=>{ if(s)setFilterSubject(s); navTo(v); }}/>}
              {view==="tasks"     && <TasksView tasks={tasks} dark={dark} onAdd={(t,date)=>openAdd(date?{dueDate:date}:{})} onEdit={openEdit} onDelete={deleteTask} onStatusChange={changeStatus} filterSubject={filterSubject} setFilterSubject={setFilterSubject}/>}
              {view==="calendar"  && (
                <div className="animate-fadeUp">
                  <div className="flex items-center justify-between mb-5">
                    <div><h2 className={`text-2xl font-bold ${dark?"text-white":"text-slate-900"}`}>Calendar</h2><p className={`text-sm mt-0.5 ${dark?"text-slate-400":"text-slate-500"}`}>Monthly task overview</p></div>
                  </div>
                  <CalendarView tasks={tasks} dark={dark} onEdit={openEdit} onAdd={date=>openAdd(date?{dueDate:date}:{})}/>
                </div>
              )}
              {view==="focus"    && <FocusView dark={dark}/>}
              {view==="insights" && <InsightsView tasks={tasks} dark={dark}/>}
            </div>
          </main>
        </div>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <BottomNav view={view} navTo={navTo} dark={dark}/>

      {/* ── Task Modal ── */}
      {modal && <TaskModal task={modal.task} onSave={saveTask} onClose={()=>setModal(null)} dark={dark} prefill={modal.prefill}/>}
    </div>
  );
}
