import React, { useState, useEffect, useRef } from "react";
import {
  Users, UserPlus, Trash2, Edit2, Shield, CalendarDays, Play, Trophy,
  X, ChevronRight, Plus, ArrowLeftRight, Check, Swords, ListChecks,
  Circle, Award, TrendingUp, ChevronLeft, RotateCcw, Coins, Lock, LogIn,
  LogOut, Eye, EyeOff
} from "lucide-react";

/* ----------------------------- constants ----------------------------- */

const ROLES = ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"];
const DISMISSALS = ["Bowled", "Caught", "LBW", "Run Out", "Stumped", "Hit Wicket", "Retired Out"];
const TEAM_COLORS = ["#2D6A4F", "#2A6F97", "#C1440E", "#7B2D8B", "#B08900", "#0F6B5C"];

/* ------------------------------ helpers ------------------------------ */

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function oversStr(balls) {
  return `${Math.floor(balls / 6)}.${balls % 6}`;
}
function runRate(runs, balls) {
  if (!balls) return "0.00";
  return ((runs / balls) * 6).toFixed(2);
}
function reqRunRate(target, runsScored, ballsRemaining) {
  if (ballsRemaining <= 0) return "-";
  const need = target - runsScored;
  if (need <= 0) return "0.00";
  return ((need / ballsRemaining) * 6).toFixed(2);
}
function structClone(obj) {
  return typeof structuredClone === "function" ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
}

const AUTH_SESSION_KEY = "cricktrack-session";
const APP_LOGIN_USERNAME = import.meta.env.VITE_CRICKTRACK_USERNAME || "";
const APP_LOGIN_PASSWORD = import.meta.env.VITE_CRICKTRACK_PASSWORD || "";

function normalizeUsername(value) {
  return value.trim().toLowerCase();
}

function readStoredSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredSession(user) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ username: user.username }));
}

function clearStoredSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_SESSION_KEY);
}

function scopedDataKey(username, key) {
  return `user:${normalizeUsername(username)}:${key}`;
}

async function authenticateUser({ username, password }) {
  const normalized = normalizeUsername(username);
  if (!normalized || !password) throw new Error("Please enter both a username and password.");
  if (!APP_LOGIN_USERNAME || !APP_LOGIN_PASSWORD) {
    throw new Error("Login credentials are not configured.");
  }
  if (normalized !== normalizeUsername(APP_LOGIN_USERNAME) || password !== APP_LOGIN_PASSWORD) {
    throw new Error("Invalid credentials");
  }

  return { username: normalized };
}

/* -------- storage layer: JSONBin.io (see src/storage.js) -------- */
import { loadKey, saveKey } from "./storage.js";

/* ------------------------------ UI atoms ------------------------------ */

function PageShell({ children }) {
  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: "var(--cream)", minHeight: "100dvh", paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }} className="w-full overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
        :root {
          --cream: #F7F5EF;
          --ink: #16211A;
          --pitch: #1B4332;
          --grass: #2D6A4F;
          --gold: #E9C46A;
          --red: #C1440E;
          --blue: #2A6F97;
          --line: #DCD6C8;
          --panel: #14181B;
        }
        .disp { font-family: 'Oswald', sans-serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: var(--line); border-radius: 4px; }
        @keyframes coinSpin { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(1440deg); } }
        .coin-flipping { animation: coinSpin 1s cubic-bezier(.3,.1,.3,1); }
      `}</style>
      {children}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", size = "md", disabled, className = "", type = "button" }) {
  const base = "inline-flex items-center justify-center gap-1.5 font-semibold rounded transition disp tracking-wide min-h-[44px] touch-manipulation";
  const sizes = { sm: "px-3 py-2.5 text-xs min-h-[40px]", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-base" };
  const variants = {
    primary: { background: "var(--pitch)", color: "white" },
    gold: { background: "var(--gold)", color: "var(--ink)" },
    danger: { background: "var(--red)", color: "white" },
    outline: { background: "transparent", color: "var(--pitch)", border: "1.5px solid var(--pitch)" },
    ghost: { background: "transparent", color: "var(--ink)" },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{ ...variants[variant], opacity: disabled ? 0.45 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
      className={`${base} ${sizes[size]} ${className} hover:brightness-110 active:scale-[0.98]`}
    >
      {children}
    </button>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-3 sm:py-2 rounded border text-base sm:text-sm outline-none focus:ring-2 ${props.className || ""}`}
      style={{ borderColor: "var(--line)", background: "white", ...props.style }}
    />
  );
}
function Select(props) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-3 sm:py-2 rounded border text-base sm:text-sm outline-none bg-white ${props.className || ""}`}
      style={{ borderColor: "var(--line)", ...props.style }}
    >
      {props.children}
    </select>
  );
}

function Card({ children, className = "", style = {} }) {
  return (
    <div className={`rounded-lg border bg-white p-4 ${className}`} style={{ borderColor: "var(--line)", ...style }}>
      {children}
    </div>
  );
}

function Badge({ children, color = "var(--grass)" }) {
  return (
    <span className="px-2 py-0.5 rounded text-xs font-semibold text-white disp tracking-wide" style={{ background: color }}>
      {children}
    </span>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,20,17,0.55)" }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-lg w-full ${wide ? "max-w-lg" : "max-w-sm"} max-h-[90vh] overflow-y-auto scrollbar-thin`}
        style={{ border: "1px solid var(--line)", maxWidth: "min(92vw, 32rem)" }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--line)", background: "var(--pitch)" }}>
          <h3 className="disp text-white font-semibold tracking-wide">{title}</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function AuthScreen({ onAuthenticated }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await authenticateUser({ username, password });
      writeStoredSession(user);
      onAuthenticated(user);
    } catch (err) {
      setError(err.message || "Unable to sign in right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--cream)" }}>
        <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: "var(--line)" }}>
          <div className="flex justify-center mb-4">
            <div className="rounded-full p-3" style={{ background: "var(--pitch)" }}>
              <Lock size={24} color="white" />
            </div>
          </div>
          <div className="text-center mb-4">
            <h2 className="disp text-2xl font-semibold" style={{ color: "var(--ink)" }}>Restricted access</h2>
            <p className="text-sm mt-1 opacity-70">Use the single username and password configured for this app to access your score tracker.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: "var(--ink)" }}>Username</label>
              <Input autoFocus value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: "var(--ink)" }}>Password</label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" className="pr-10" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[color:var(--pitch)]">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <p className="text-xs text-[color:var(--red)]">{error}</p>}
            <Btn type="submit" variant="primary" className="w-full justify-center" disabled={loading}>
              {loading ? "Please wait…" : <><LogIn size={16} /> Sign in</>}
            </Btn>
          </form>
        </div>
      </div>
    </PageShell>
  );
}

function EmptyState({ icon: Icon, text, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center gap-2 opacity-70">
      <Icon size={30} color="var(--pitch)" />
      <p className="disp text-sm font-semibold" style={{ color: "var(--ink)" }}>{text}</p>
      {sub && <p className="text-xs max-w-xs" style={{ color: "var(--ink)" }}>{sub}</p>}
    </div>
  );
}

/* ------------------------------ Tabs nav ------------------------------ */

function TopNav({ view, setView, hasLive, currentUser, onLogout }) {
  const tabs = [
    { id: "players", label: "Players", icon: Users },
    { id: "teams", label: "Teams", icon: Shield },
    { id: "matches", label: "Matches", icon: CalendarDays },
  ];
  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 gap-2" style={{ background: "var(--pitch)" }}>
      <div className="flex items-center gap-2">
        <Trophy size={20} color="var(--gold)" />
        <span className="disp text-white font-bold tracking-wide text-base sm:text-lg">CrickTrack</span>
      </div>
      <div className="flex items-center gap-1 bg-black/15 rounded-full p-1 flex-wrap">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = view === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold disp transition"
              style={{ background: active ? "var(--gold)" : "transparent", color: active ? "var(--ink)" : "white" }}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        {currentUser && <span className="hidden sm:block text-xs text-white/80">{currentUser.username}</span>}
        {hasLive ? (
          <button onClick={() => setView("live")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold disp" style={{ background: "var(--red)", color: "white" }}>
            <Circle size={8} fill="white" className="animate-pulse" /> LIVE
          </button>
        ) : <div style={{ width: 10 }} />}
        {onLogout && (
          <button onClick={onLogout} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold disp" style={{ background: "rgba(255,255,255,0.12)", color: "white" }}>
            <LogOut size={14} /> <span className="hidden sm:inline">Logout</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================= PLAYERS ============================= */

function PlayersPanel({ players, setPlayers }) {
  const [modal, setModal] = useState(null); // {mode:'new'|'edit', player}
  const [query, setQuery] = useState("");

  function openNew() { setModal({ mode: "new", player: { id: uid(), name: "", role: "All-Rounder" } }); }
  function openEdit(p) { setModal({ mode: "edit", player: { ...p } }); }

  function save(p) {
    if (!p.name.trim()) return;
    setPlayers((prev) => {
      const exists = prev.some((x) => x.id === p.id);
      return exists ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p];
    });
    setModal(null);
  }
  function remove(id) {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }

  const filtered = players.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="disp text-xl font-bold" style={{ color: "var(--ink)" }}>Master Player List</h2>
          <p className="text-xs opacity-60">All players available to assign to any team</p>
        </div>
        <Btn onClick={openNew} variant="primary"><UserPlus size={16} /> Add Player</Btn>
      </div>

      <Input placeholder="Search players..." value={query} onChange={(e) => setQuery(e.target.value)} className="mb-4 max-w-xs" />

      {filtered.length === 0 ? (
        <EmptyState icon={Users} text="No players yet" sub="Add players here first, then assign them to teams." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <Card key={p.id} className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{p.name}</p>
                <span className="text-xs px-1.5 py-0.5 rounded mt-1 inline-block" style={{ background: "var(--cream)", color: "var(--grass)", border: "1px solid var(--line)" }}>{p.role}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-black/5" title="Edit"><Edit2 size={14} color="var(--blue)" /></button>
                <button onClick={() => remove(p.id)} className="p-1.5 rounded hover:bg-black/5" title="Delete"><Trash2 size={14} color="var(--red)" /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal.mode === "new" ? "Add Player" : "Edit Player"} onClose={() => setModal(null)}>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: "var(--ink)" }}>Name</label>
              <Input autoFocus value={modal.player.name} onChange={(e) => setModal({ ...modal, player: { ...modal.player, name: e.target.value } })} placeholder="Player name" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: "var(--ink)" }}>Role</label>
              <Select value={modal.player.role} onChange={(e) => setModal({ ...modal, player: { ...modal.player, role: e.target.value } })}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </Select>
            </div>
            <Btn onClick={() => save(modal.player)} variant="primary" className="mt-1 justify-center"><Check size={16} /> Save Player</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ============================== TEAMS ============================== */

function TeamsPanel({ players, teams, setTeams }) {
  const [modal, setModal] = useState(null); // new team
  const [assignFor, setAssignFor] = useState(null); // team id for assign-players modal
  const [resetConfirm, setResetConfirm] = useState(false);
  const [toss, setToss] = useState(null); // {teamAId, teamBId, callTeamId, call, flipping, result}

  function openNew() {
    setModal({ id: uid(), name: "", shortName: "", color: TEAM_COLORS[teams.length % TEAM_COLORS.length], playerIds: [], captainId: null, viceCaptainId: null });
  }
  function save(t) {
    if (!t.name.trim()) return;
    setTeams((prev) => (prev.some((x) => x.id === t.id) ? prev.map((x) => (x.id === t.id ? t : x)) : [...prev, t]));
    setModal(null);
  }
  function remove(id) {
    setTeams((prev) => prev.filter((t) => t.id !== id));
  }
  function playerTeam(playerId, excludeTeamId) {
    return teams.find((t) => t.id !== excludeTeamId && t.playerIds.includes(playerId));
  }
  function togglePlayer(teamId, playerId) {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== teamId) return t;
        const has = t.playerIds.includes(playerId);
        if (!has && playerTeam(playerId, teamId)) return t; // already on another team, ignore
        const playerIds = has ? t.playerIds.filter((id) => id !== playerId) : [...t.playerIds, playerId];
        const captainId = has && t.captainId === playerId ? null : t.captainId;
        const viceCaptainId = has && t.viceCaptainId === playerId ? null : t.viceCaptainId;
        return { ...t, playerIds, captainId, viceCaptainId };
      })
    );
  }
  function setCaptain(teamId, playerId) {
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, captainId: playerId || null, viceCaptainId: t.viceCaptainId === playerId ? null : t.viceCaptainId } : t)));
  }
  function setViceCaptain(teamId, playerId) {
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, viceCaptainId: playerId || null, captainId: t.captainId === playerId ? null : t.captainId } : t)));
  }

  function resetAllAssignments() {
    setTeams((prev) => prev.map((t) => ({ ...t, playerIds: [], captainId: null, viceCaptainId: null })));
    setResetConfirm(false);
  }

  function openToss() {
    if (teams.length < 2) return;
    setToss({ teamAId: teams[0].id, teamBId: teams[1].id, callTeamId: teams[0].id, call: "Heads", flipping: false, result: null });
  }
  function flipCoin() {
    setToss((prev) => ({ ...prev, flipping: true, result: null }));
    setTimeout(() => {
      setToss((prev) => {
        if (!prev) return prev;
        const outcome = Math.random() < 0.5 ? "Heads" : "Tails";
        const winnerTeamId = outcome === prev.call ? prev.callTeamId : (prev.callTeamId === prev.teamAId ? prev.teamBId : prev.teamAId);
        return { ...prev, flipping: false, result: { outcome, winnerTeamId } };
      });
    }, 1000);
  }

  const assignTeam = teams.find((t) => t.id === assignFor);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="disp text-xl font-bold" style={{ color: "var(--ink)" }}>Teams</h2>
          <p className="text-xs opacity-60">Create teams and assign players from the master list</p>
        </div>
        <div className="flex gap-2">
          <Btn onClick={openToss} disabled={teams.length < 2} variant="outline"><Coins size={16} /> Online Toss</Btn>
          <Btn onClick={() => setResetConfirm(true)} disabled={teams.length === 0} variant="outline"><RotateCcw size={16} /> Reset Squads</Btn>
          <Btn onClick={openNew} variant="primary"><Plus size={16} /> Create Team</Btn>
        </div>
      </div>
      {teams.length < 2 && <p className="text-xs mb-3 opacity-60">Create at least 2 teams to use the online toss.</p>}

      {teams.length === 0 ? (
        <EmptyState icon={Shield} text="No teams yet" sub="Create a team, then assign players to its squad." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {teams.map((t) => (
            <Card key={t.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center disp text-white font-bold text-xs" style={{ background: t.color }}>
                    {(t.shortName || t.name.slice(0, 3)).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{t.name}</p>
                    <p className="text-xs opacity-60">{t.playerIds.length} player{t.playerIds.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <button onClick={() => remove(t.id)} className="p-1 rounded hover:bg-black/5"><Trash2 size={14} color="var(--red)" /></button>
              </div>
              <div className="flex flex-wrap gap-1 mt-3 mb-3 min-h-[24px]">
                {t.playerIds.slice(0, 5).map((pid) => {
                  const p = players.find((x) => x.id === pid);
                  if (!p) return null;
                  const tag = t.captainId === pid ? " (C)" : t.viceCaptainId === pid ? " (VC)" : "";
                  return <span key={pid} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--cream)", border: "1px solid var(--line)" }}>{p.name}{tag}</span>;
                })}
                {t.playerIds.length > 5 && <span className="text-xs opacity-60">+{t.playerIds.length - 5} more</span>}
              </div>
              <Btn size="sm" variant="outline" onClick={() => setAssignFor(t.id)} className="w-full justify-center"><Users size={14} /> Manage Squad</Btn>
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <Modal title="Create Team" onClose={() => setModal(null)}>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Team Name</label>
              <Input autoFocus value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} placeholder="e.g. Mumbai Titans" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Short Code (3 letters)</label>
              <Input value={modal.shortName} maxLength={4} onChange={(e) => setModal({ ...modal, shortName: e.target.value.toUpperCase() })} placeholder="e.g. MUT" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Color</label>
              <div className="flex gap-2">
                {TEAM_COLORS.map((c) => (
                  <button key={c} onClick={() => setModal({ ...modal, color: c })} className="w-7 h-7 rounded-full" style={{ background: c, outline: modal.color === c ? "2px solid var(--ink)" : "none", outlineOffset: 2 }} />
                ))}
              </div>
            </div>
            <Btn onClick={() => save(modal)} variant="primary" className="mt-1 justify-center"><Check size={16} /> Create Team</Btn>
          </div>
        </Modal>
      )}

      {assignTeam && (
        <Modal title={`Squad · ${assignTeam.name}`} onClose={() => setAssignFor(null)} wide>
          {assignTeam.playerIds.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b" style={{ borderColor: "var(--line)" }}>
              <div>
                <label className="text-xs font-semibold block mb-1">Captain</label>
                <Select value={assignTeam.captainId || ""} onChange={(e) => setCaptain(assignTeam.id, e.target.value)}>
                  <option value="">None</option>
                  {assignTeam.playerIds.map((pid) => {
                    const p = players.find((x) => x.id === pid);
                    return p ? <option key={pid} value={pid}>{p.name}</option> : null;
                  })}
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Vice-Captain</label>
                <Select value={assignTeam.viceCaptainId || ""} onChange={(e) => setViceCaptain(assignTeam.id, e.target.value)}>
                  <option value="">None</option>
                  {assignTeam.playerIds.map((pid) => {
                    const p = players.find((x) => x.id === pid);
                    return p ? <option key={pid} value={pid}>{p.name}</option> : null;
                  })}
                </Select>
              </div>
            </div>
          )}
          {players.length === 0 ? (
            <p className="text-sm opacity-60">No players in master list yet. Add players first.</p>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink)" }}>Selected players</p>
                <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ background: "var(--cream)", color: "var(--grass)", border: "1px solid var(--line)" }}>
                  {assignTeam.playerIds.length} selected
                </span>
              </div>
              <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto scrollbar-thin">
                {players.map((p, index) => {
                  const checked = assignTeam.playerIds.includes(p.id);
                  const otherTeam = !checked ? playerTeam(p.id, assignTeam.id) : null;
                  const disabled = !!otherTeam;
                  return (
                    <label key={p.id} className={`flex items-center justify-between px-2 py-1.5 rounded ${disabled ? "opacity-45 cursor-not-allowed" : "cursor-pointer hover:bg-black/5"}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold min-w-6" style={{ color: "var(--blue)" }}>{index + 1} -</span>
                        <div>
                          <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>{p.name}</span>
                          <span className="text-xs opacity-60 ml-2">{p.role}</span>
                          {disabled && <span className="text-xs ml-2" style={{ color: "var(--red)" }}>· in {otherTeam.name}</span>}
                        </div>
                      </div>
                      <input type="checkbox" checked={checked} disabled={disabled} onChange={() => togglePlayer(assignTeam.id, p.id)} />
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </Modal>
      )}
      {resetConfirm && (
        <Modal title="Reset Squads" onClose={() => setResetConfirm(false)}>
          <p className="text-sm mb-4" style={{ color: "var(--ink)" }}>
            This clears every team's assigned players, captain, and vice-captain so you can build squads from scratch. Teams themselves and the master player list are not deleted. This can't be undone.
          </p>
          <div className="flex gap-2">
            <Btn variant="outline" onClick={() => setResetConfirm(false)} className="flex-1 justify-center">Cancel</Btn>
            <Btn variant="danger" onClick={resetAllAssignments} className="flex-1 justify-center"><RotateCcw size={16} /> Reset</Btn>
          </div>
        </Modal>
      )}

      {toss && (
        <Modal title="Online Toss" onClose={() => setToss(null)}>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Team A</label>
                <Select value={toss.teamAId} onChange={(e) => setToss({ ...toss, teamAId: e.target.value, callTeamId: e.target.value === toss.callTeamId ? e.target.value : toss.callTeamId, result: null })}>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Team B</label>
                <Select value={toss.teamBId} onChange={(e) => setToss({ ...toss, teamBId: e.target.value, result: null })}>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </div>
            </div>
            {toss.teamAId === toss.teamBId && <p className="text-xs" style={{ color: "var(--red)" }}>Choose two different teams.</p>}

            <div>
              <label className="text-xs font-semibold block mb-1">Who calls?</label>
              <Select value={toss.callTeamId} onChange={(e) => setToss({ ...toss, callTeamId: e.target.value, result: null })}>
                <option value={toss.teamAId}>{teams.find((t) => t.id === toss.teamAId)?.name}</option>
                <option value={toss.teamBId}>{teams.find((t) => t.id === toss.teamBId)?.name}</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Call</label>
              <div className="flex gap-2">
                <Btn variant={toss.call === "Heads" ? "gold" : "outline"} onClick={() => setToss({ ...toss, call: "Heads", result: null })} className="flex-1 justify-center">Heads</Btn>
                <Btn variant={toss.call === "Tails" ? "gold" : "outline"} onClick={() => setToss({ ...toss, call: "Tails", result: null })} className="flex-1 justify-center">Tails</Btn>
              </div>
            </div>

            <div className="flex flex-col items-center py-4">
              <div
                className={toss.flipping ? "coin-flipping" : ""}
                style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid var(--ink)" }}
              >
                <Coins size={28} color="var(--ink)" />
              </div>
              {toss.result && (
                <div className="text-center mt-3">
                  <p className="disp text-sm font-semibold" style={{ color: "var(--ink)" }}>It's {toss.result.outcome}!</p>
                  <p className="disp text-base font-bold mt-1" style={{ color: "var(--grass)" }}>
                    {teams.find((t) => t.id === toss.result.winnerTeamId)?.name} wins the toss
                  </p>
                </div>
              )}
            </div>

            <Btn variant="primary" disabled={toss.teamAId === toss.teamBId || toss.flipping} onClick={flipCoin} className="w-full justify-center">
              <Coins size={16} /> {toss.flipping ? "Flipping…" : "Flip Coin"}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function MatchesPanel({ teams, matches, setMatches, goLive }) {
  const [modal, setModal] = useState(null);

  function openNew() {
    if (teams.length < 2) return;
    setModal({ id: uid(), teamAId: teams[0].id, teamBId: teams[1] ? teams[1].id : teams[0].id, venue: "", date: "", overs: 20, status: "scheduled", phase: "setup-toss", innings: [], toss: null, result: null });
  }
  function save(m) {
    if (m.teamAId === m.teamBId) return;
    if (!m.venue.trim()) return;
    setMatches((prev) => [...prev, m]);
    setModal(null);
  }
  function remove(id) {
    setMatches((prev) => prev.filter((m) => m.id !== id));
  }
  const teamName = (id) => teams.find((t) => t.id === id)?.name || "TBD";

  const statusColor = { scheduled: "var(--blue)", live: "var(--red)", completed: "var(--grass)" };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="disp text-xl font-bold" style={{ color: "var(--ink)" }}>Matches</h2>
          <p className="text-xs opacity-60">Schedule fixtures, start them, and score live</p>
        </div>
        <Btn onClick={openNew} disabled={teams.length < 2} variant="primary"><Plus size={16} /> Schedule Match</Btn>
      </div>
      {teams.length < 2 && <p className="text-xs mb-3" style={{ color: "var(--red)" }}>You need at least 2 teams before scheduling a match.</p>}

      {matches.length === 0 ? (
        <EmptyState icon={CalendarDays} text="No matches scheduled" sub="Schedule a fixture between two teams to get started." />
      ) : (
        <div className="flex flex-col gap-3">
          {matches.slice().reverse().map((m) => {
            const status = m.status === "live" ? "live" : m.result ? "completed" : "scheduled";
            return (
              <Card key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge color={statusColor[status]}>{status.toUpperCase()}</Badge>
                    {m.venue && <span className="text-xs opacity-60">{m.venue}</span>}
                    {m.date && <span className="text-xs opacity-60">· {m.date}</span>}
                    <span className="text-xs opacity-60">· {m.overs} overs</span>
                  </div>
                  <p className="disp font-bold text-sm" style={{ color: "var(--ink)" }}>{teamName(m.teamAId)} <span className="opacity-40 font-normal">vs</span> {teamName(m.teamBId)}</p>
                  {m.result && <p className="text-xs mt-1 font-semibold" style={{ color: "var(--grass)" }}>{m.result}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  {status === "scheduled" && <Btn size="sm" variant="primary" onClick={() => goLive(m.id)}><Play size={14} /> Start Match</Btn>}
                  {status === "live" && <Btn size="sm" variant="danger" onClick={() => goLive(m.id)}><Circle size={10} fill="white" /> Resume</Btn>}
                  {status === "completed" && <Btn size="sm" variant="outline" onClick={() => goLive(m.id)}><Trophy size={14} /> Scorecard</Btn>}
                  <button onClick={() => remove(m.id)} className="p-1.5 rounded hover:bg-black/5"><Trash2 size={14} color="var(--red)" /></button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title="Schedule Match" onClose={() => setModal(null)}>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Team A</label>
              <Select value={modal.teamAId} onChange={(e) => setModal({ ...modal, teamAId: e.target.value })}>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Team B</label>
              <Select value={modal.teamBId} onChange={(e) => setModal({ ...modal, teamBId: e.target.value })}>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </div>
            {modal.teamAId === modal.teamBId && <p className="text-xs" style={{ color: "var(--red)" }}>Choose two different teams.</p>}
            <div>
              <label className="text-xs font-semibold block mb-1">Venue</label>
              <Input value={modal.venue} onChange={(e) => setModal({ ...modal, venue: e.target.value })} placeholder="e.g. City Stadium" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Date</label>
                <Input type="date" value={modal.date} onChange={(e) => setModal({ ...modal, date: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Overs / side</label>
                <Input type="number" min={1} max={50} value={modal.overs} onChange={(e) => setModal({ ...modal, overs: Number(e.target.value) })} />
              </div>
            </div>
            <Btn onClick={() => save(modal)} variant="primary" className="mt-1 justify-center"><Check size={16} /> Schedule</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* =========================== LIVE SCORING =========================== */

function emptyInnings(battingTeamId, bowlingTeamId, target) {
  return {
    battingTeamId, bowlingTeamId, target: target || null,
    totalRuns: 0, totalWickets: 0, legalBalls: 0,
    extras: { wides: 0, noballs: 0, byes: 0, legbyes: 0 },
    batsmen: {}, bowlers: {},
    strikerId: null, nonStrikerId: null, currentBowlerId: null,
    needNewBowler: false, needNewBatsman: false, pendingOutSlot: null,
    timeline: [], complete: false,
  };
}

function LiveScoring({ match, teams, players, updateMatch, onBack }) {
  const teamA = teams.find((t) => t.id === match.teamAId);
  const teamB = teams.find((t) => t.id === match.teamBId);
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));

  const inning = match.innings[match.innings.length - 1];
  const battingTeam = inning ? teams.find((t) => t.id === inning.battingTeamId) : null;
  const bowlingTeam = inning ? teams.find((t) => t.id === inning.bowlingTeamId) : null;

  const [tossPick, setTossPick] = useState({ winner: match.teamAId, decision: "Bat" });
  const [openers, setOpeners] = useState({ striker: "", nonStriker: "", bowler: "" });
  const [nextBatsman, setNextBatsman] = useState("");
  const [nextBowler, setNextBowler] = useState("");
  const [wicketModal, setWicketModal] = useState(null); // {dismissal}
  const [byeRuns, setByeRuns] = useState(1);
  const [noBallRuns, setNoBallRuns] = useState(1);
  const [extraModal, setExtraModal] = useState(null); // 'bye' | 'legbye' | 'noball'
  const [undoStack, setUndoStack] = useState([]);

  function undoLastAction() {
    if (undoStack.length === 0) return;
    const previousMatch = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    updateMatch(match.id, () => previousMatch);
  }

  /* ---- phase: setup-toss ---- */
  function confirmToss() {
    const decision = tossPick.decision;
    const winner = tossPick.winner;
    const loser = winner === match.teamAId ? match.teamBId : match.teamAId;
    const battingTeamId = decision === "Bat" ? winner : loser;
    const bowlingTeamId = battingTeamId === match.teamAId ? match.teamBId : match.teamAId;
    updateMatch(match.id, (m) => {
      m.toss = { winner, decision };
      m.innings = [emptyInnings(battingTeamId, bowlingTeamId, null)];
      m.phase = "setup-openers";
      m.status = "live";
      return m;
    });
  }

  /* ---- phase: setup-openers (works for either innings) ---- */
  function confirmOpeners() {
    const soloSquad = squadSizeOf(inning?.battingTeamId) === 1;
    if (!openers.striker || !openers.bowler) return;
    if (!soloSquad && (!openers.nonStriker || openers.striker === openers.nonStriker)) return;
    updateMatch(match.id, (m) => {
      const inn = m.innings[m.innings.length - 1];
      inn.strikerId = openers.striker;
      inn.nonStrikerId = soloSquad ? null : openers.nonStriker;
      inn.currentBowlerId = openers.bowler;
      inn.batsmen[openers.striker] = inn.batsmen[openers.striker] || { runs: 0, balls: 0, fours: 0, sixes: 0, out: false, dismissal: null };
      if (!soloSquad) {
        inn.batsmen[openers.nonStriker] = inn.batsmen[openers.nonStriker] || { runs: 0, balls: 0, fours: 0, sixes: 0, out: false, dismissal: null };
      }
      inn.bowlers[openers.bowler] = inn.bowlers[openers.bowler] || { balls: 0, runs: 0, wickets: 0 };
      m.phase = "in-progress";
      return m;
    });
    setOpeners({ striker: "", nonStriker: "", bowler: "" });
  }
  function squadSizeOf(teamId) {
    const t = teams.find((x) => x.id === teamId);
    return t ? t.playerIds.length : 0;
  }

  /* ---- core ball engine ---- */
  function swapStrike(inn) {
    if (!inn.nonStrikerId) return; // last man batting alone — always stays on strike
    const t = inn.strikerId; inn.strikerId = inn.nonStrikerId; inn.nonStrikerId = t;
  }

  // Gully-cricket rule: innings only ends when every player has been dismissed
  // (the last remaining batsman carries on alone — "last man batting").
  function squadSize(teamId) {
    const t = teams.find((x) => x.id === teamId);
    return t ? Math.max(t.playerIds.length, 1) : 11;
  }

  function checkInningsEnd(m, inn) {
    const oversDone = inn.legalBalls >= m.overs * 6;
    const allOut = inn.totalWickets >= squadSize(inn.battingTeamId);
    const chased = inn.target != null && inn.totalRuns >= inn.target;
    if (oversDone || allOut || chased) {
      inn.complete = true;
      if (m.innings.length === 1) {
        m.phase = "innings-break";
      } else {
        m.phase = "completed";
        m.status = "completed";
        const inn1 = m.innings[0];
        const inn2 = m.innings[1];
        if (inn2.totalRuns > inn1.totalRuns) {
          const wLeft = squadSize(inn2.battingTeamId) - inn2.totalWickets;
          const winner = teams.find((t) => t.id === inn2.battingTeamId);
          m.result = `${winner ? winner.name : "Team"} won by ${wLeft} wicket${wLeft !== 1 ? "s" : ""}`;
        } else if (inn2.totalRuns === inn1.totalRuns) {
          m.result = "Match Tied";
        } else {
          const margin = inn1.totalRuns - inn2.totalRuns;
          const winner = teams.find((t) => t.id === inn1.battingTeamId);
          m.result = `${winner ? winner.name : "Team"} won by ${margin} run${margin !== 1 ? "s" : ""}`;
        }
      }
    }
  }

  function pushTimeline(inn, text) {
    inn.timeline = [text, ...inn.timeline].slice(0, 12);
  }

  function recordRun(runs) {
    const before = structClone(match);
    updateMatch(match.id, (m) => {
      const inn = m.innings[m.innings.length - 1];
      if (inn.needNewBowler || inn.needNewBatsman || inn.complete) return m;
      const bat = inn.batsmen[inn.strikerId];
      bat.runs += runs; bat.balls += 1;
      if (runs === 4) bat.fours += 1;
      if (runs === 6) bat.sixes += 1;
      inn.totalRuns += runs;
      inn.legalBalls += 1;
      const bowl = inn.bowlers[inn.currentBowlerId];
      bowl.balls += 1; bowl.runs += runs;
      pushTimeline(inn, `${runs === 0 ? "•" : runs}${runs === 4 ? " FOUR" : runs === 6 ? " SIX" : ""} — ${playerMap[inn.strikerId]?.name || "Batsman"}`);
      if (runs % 2 === 1) swapStrike(inn);
      if (inn.legalBalls % 6 === 0) {
        swapStrike(inn);
        inn.needNewBowler = true;
      }
      checkInningsEnd(m, inn);
      return m;
    });
    setUndoStack((prev) => [...prev, before].slice(-8));
  }

  function recordWide() {
    const before = structClone(match);
    updateMatch(match.id, (m) => {
      const inn = m.innings[m.innings.length - 1];
      if (inn.needNewBowler || inn.needNewBatsman || inn.complete) return m;
      inn.totalRuns += 1;
      inn.extras.wides += 1;
      inn.bowlers[inn.currentBowlerId].runs += 1;
      pushTimeline(inn, "Wide");
      checkInningsEnd(m, inn);
      return m;
    });
    setUndoStack((prev) => [...prev, before].slice(-8));
  }
  function recordNoBall(runs) {
    const before = structClone(match);
    updateMatch(match.id, (m) => {
      const inn = m.innings[m.innings.length - 1];
      if (inn.needNewBowler || inn.needNewBatsman || inn.complete) return m;
      inn.totalRuns += runs;
      inn.extras.noballs += 1;
      inn.bowlers[inn.currentBowlerId].runs += runs;
      inn.batsmen[inn.strikerId].runs += runs;
      inn.batsmen[inn.strikerId].balls += 1;
      pushTimeline(inn, `${runs} No Ball`);
      checkInningsEnd(m, inn);
      return m;
    });
    setUndoStack((prev) => [...prev, before].slice(-8));
    setExtraModal(null);
    setNoBallRuns(1);
  }
  function recordByeType(type, runs) {
    const before = structClone(match);
    updateMatch(match.id, (m) => {
      const inn = m.innings[m.innings.length - 1];
      if (inn.needNewBowler || inn.needNewBatsman || inn.complete) return m;
      inn.totalRuns += runs;
      inn.extras[type] += runs;
      inn.legalBalls += 1;
      inn.bowlers[inn.currentBowlerId].balls += 1;
      inn.batsmen[inn.strikerId].balls += 1;
      pushTimeline(inn, `${runs} ${type === "byes" ? "Bye" : "Leg Bye"}`);
      if (runs % 2 === 1) swapStrike(inn);
      if (inn.legalBalls % 6 === 0) {
        swapStrike(inn);
        inn.needNewBowler = true;
      }
      checkInningsEnd(m, inn);
      return m;
    });
    setUndoStack((prev) => [...prev, before].slice(-8));
    setExtraModal(null);
  }

  function confirmWicket(dismissal) {
    const before = structClone(match);
    updateMatch(match.id, (m) => {
      const inn = m.innings[m.innings.length - 1];
      const bat = inn.batsmen[inn.strikerId];
      bat.out = true; bat.dismissal = dismissal; bat.balls += 1;
      inn.totalWickets += 1;
      inn.legalBalls += 1;
      const bowl = inn.bowlers[inn.currentBowlerId];
      bowl.balls += 1;
      if (dismissal !== "Run Out") bowl.wickets += 1;
      pushTimeline(inn, `WICKET — ${playerMap[inn.strikerId]?.name || "Batsman"} (${dismissal})`);
      inn.pendingOutSlot = "striker";
      checkInningsEnd(m, inn);
      if (!inn.complete) {
        const bat = teams.find((t) => t.id === inn.battingTeamId);
        const squad = players.filter((p) => bat?.playerIds.includes(p.id));
        const replacementsLeft = squad.some(
          (p) => p.id !== inn.nonStrikerId && !(inn.batsmen[p.id] && inn.batsmen[p.id].out)
        );
        if (replacementsLeft) {
          inn.needNewBatsman = true;
        } else {
          // Last man batting: the not-out partner carries on alone, no replacement needed.
          inn.strikerId = inn.nonStrikerId;
          inn.nonStrikerId = null;
          inn.needNewBatsman = false;
          inn.pendingOutSlot = null;
          pushTimeline(inn, `${playerMap[inn.strikerId]?.name || "Batsman"} continues — last man batting`);
        }
      }
      if (inn.legalBalls % 6 === 0 && !inn.complete) {
        inn.needNewBowler = true;
      }
      return m;
    });
    setUndoStack((prev) => [...prev, before].slice(-8));
    setWicketModal(null);
  }

  function confirmNewBatsman() {
    if (!nextBatsman) return;
    const before = structClone(match);
    updateMatch(match.id, (m) => {
      const inn = m.innings[m.innings.length - 1];
      const rec = inn.batsmen[nextBatsman] || { runs: 0, balls: 0, fours: 0, sixes: 0, out: false, dismissal: null };
      if (rec.dismissal === "Retired Out") {
        rec.out = false;
        rec.dismissal = null;
      }
      inn.strikerId = nextBatsman;
      inn.batsmen[nextBatsman] = rec;
      inn.needNewBatsman = false;
      inn.pendingOutSlot = null;
      return m;
    });
    setUndoStack((prev) => [...prev, before].slice(-8));
    setNextBatsman("");
  }
  function confirmNewBowler() {
    if (!nextBowler) return;
    const before = structClone(match);
    updateMatch(match.id, (m) => {
      const inn = m.innings[m.innings.length - 1];
      inn.currentBowlerId = nextBowler;
      inn.bowlers[nextBowler] = inn.bowlers[nextBowler] || { balls: 0, runs: 0, wickets: 0 };
      inn.needNewBowler = false;
      return m;
    });
    setUndoStack((prev) => [...prev, before].slice(-8));
    setNextBowler("");
  }

  function startSecondInnings() {
    const before = structClone(match);
    updateMatch(match.id, (m) => {
      const inn1 = m.innings[0];
      const target = inn1.totalRuns + 1;
      m.innings.push(emptyInnings(inn1.bowlingTeamId, inn1.battingTeamId, target));
      m.phase = "setup-openers";
      return m;
    });
    setUndoStack((prev) => [...prev, before].slice(-8));
  }

  /* ------------------------------ render ------------------------------ */

  if (match.phase === "setup-toss" || !match.phase) {
    return (
      <div className="p-4 sm:p-6 max-w-md mx-auto">
        <button onClick={onBack} className="flex items-center gap-1 text-sm mb-4 opacity-70 hover:opacity-100"><ChevronLeft size={16} /> Back to Matches</button>
        <Card>
          <h3 className="disp font-bold text-lg mb-3 flex items-center gap-2" style={{ color: "var(--ink)" }}><Swords size={18} /> Toss</h3>
          <label className="text-xs font-semibold block mb-1">Toss won by</label>
          <Select value={tossPick.winner} onChange={(e) => setTossPick({ ...tossPick, winner: e.target.value })} className="mb-3">
            <option value={match.teamAId}>{teamA?.name}</option>
            <option value={match.teamBId}>{teamB?.name}</option>
          </Select>
          <label className="text-xs font-semibold block mb-1">Elected to</label>
          <Select value={tossPick.decision} onChange={(e) => setTossPick({ ...tossPick, decision: e.target.value })} className="mb-4">
            <option value="Bat">Bat</option>
            <option value="Bowl">Bowl</option>
          </Select>
          <Btn variant="primary" onClick={confirmToss} className="w-full justify-center"><Check size={16} /> Confirm Toss & Start</Btn>
        </Card>
      </div>
    );
  }

  if (match.phase === "setup-openers") {
    const bat = teams.find((t) => t.id === inning.battingTeamId);
    const bowl = teams.find((t) => t.id === inning.bowlingTeamId);
    const batPlayers = players.filter((p) => bat?.playerIds.includes(p.id));
    const bowlPlayers = players.filter((p) => bowl?.playerIds.includes(p.id));
    return (
      <div className="p-4 sm:p-6 max-w-md mx-auto">
        <button onClick={onBack} className="flex items-center gap-1 text-sm mb-4 opacity-70 hover:opacity-100"><ChevronLeft size={16} /> Back to Matches</button>
        <Card>
          <h3 className="disp font-bold text-lg mb-3" style={{ color: "var(--ink)" }}>
            {match.innings.length === 1 ? "Innings 1 — " : "Innings 2 — "}{bat?.name} batting
          </h3>
          <label className="text-xs font-semibold block mb-1">Striker</label>
          <Select value={openers.striker} onChange={(e) => setOpeners({ ...openers, striker: e.target.value })} className="mb-3">
            <option value="">Select batsman</option>
            {batPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          {batPlayers.length > 1 ? (
            <>
              <label className="text-xs font-semibold block mb-1">Non-Striker</label>
              <Select value={openers.nonStriker} onChange={(e) => setOpeners({ ...openers, nonStriker: e.target.value })} className="mb-3">
                <option value="">Select batsman</option>
                {batPlayers.filter((p) => p.id !== openers.striker).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </>
          ) : (
            <p className="text-xs italic opacity-60 mb-3">Only one player in this squad — batting alone (last man batting).</p>
          )}
          <label className="text-xs font-semibold block mb-1">Opening Bowler ({bowl?.name})</label>
          <Select value={openers.bowler} onChange={(e) => setOpeners({ ...openers, bowler: e.target.value })} className="mb-4">
            <option value="">Select bowler</option>
            {bowlPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Btn variant="primary" onClick={confirmOpeners} className="w-full justify-center"><Play size={16} /> Begin Innings</Btn>
        </Card>
      </div>
    );
  }

  if (match.phase === "innings-break") {
    const inn1 = match.innings[0];
    const t1 = teams.find((t) => t.id === inn1.battingTeamId);
    return (
      <div className="p-4 sm:p-6 max-w-md mx-auto">
        <button onClick={onBack} className="flex items-center gap-1 text-sm mb-4 opacity-70 hover:opacity-100"><ChevronLeft size={16} /> Back to Matches</button>
        <Card className="text-center">
          <Award size={28} className="mx-auto mb-2" color="var(--gold)" />
          <h3 className="disp font-bold text-lg mb-1" style={{ color: "var(--ink)" }}>Innings Break</h3>
          <p className="text-sm mb-4">{t1?.name} scored <b>{inn1.totalRuns}/{inn1.totalWickets}</b> in {oversStr(inn1.legalBalls)} overs.</p>
          <p className="text-xs opacity-70 mb-4">Target: <b>{inn1.totalRuns + 1}</b> runs</p>
          <Btn variant="primary" onClick={startSecondInnings} className="w-full justify-center"><Play size={16} /> Start 2nd Innings</Btn>
        </Card>
      </div>
    );
  }

  if (match.phase === "completed") {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-1 text-sm mb-4 opacity-70 hover:opacity-100"><ChevronLeft size={16} /> Back to Matches</button>
        <Card className="text-center mb-4" style={{ background: "var(--pitch)" }}>
          <Trophy size={28} className="mx-auto mb-2" color="var(--gold)" />
          <p className="disp text-white font-bold text-lg">{match.result}</p>
        </Card>
        <div className="grid sm:grid-cols-2 gap-4">
          {match.innings.map((inn, idx) => (
            <InningsScorecard key={idx} inning={inn} teams={teams} playerMap={playerMap} label={`Innings ${idx + 1}`} />
          ))}
        </div>
      </div>
    );
  }

  /* ---- phase: in-progress ---- */
  if (!inning) return null;
  const ballsRemaining = match.overs * 6 - inning.legalBalls;
  const striker = inning.strikerId ? playerMap[inning.strikerId] : null;
  const nonStriker = inning.nonStrikerId ? playerMap[inning.nonStrikerId] : null;
  const bowler = inning.currentBowlerId ? playerMap[inning.currentBowlerId] : null;
  const bowlerStats = inning.bowlers[inning.currentBowlerId];

  const battingSquad = players.filter((p) => battingTeam?.playerIds.includes(p.id));
  const bowlingSquad = players.filter((p) => bowlingTeam?.playerIds.includes(p.id));
  const availableBatsmen = battingSquad.filter((p) => {
    const rec = inning.batsmen[p.id];
    const isRetiredOut = rec?.dismissal === "Retired Out";
    return !(rec && rec.out && !isRetiredOut) && p.id !== inning.strikerId && p.id !== inning.nonStrikerId;
  });
  const availableBowlers = bowlingSquad.filter((p) => p.id !== inning.currentBowlerId);

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-sm mb-3 opacity-70 hover:opacity-100"><ChevronLeft size={16} /> Back to Matches</button>

      {/* scoreboard */}
      <div className="rounded-lg p-4 mb-4" style={{ background: "var(--panel)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="disp text-xs font-semibold tracking-wider" style={{ color: "var(--gold)" }}>{battingTeam?.name?.toUpperCase()}</span>
          <span className="disp text-xs" style={{ color: "#B8C4BC" }}>{match.innings.length === 1 ? "1ST INNINGS" : "2ND INNINGS"}</span>
        </div>
        <div className="flex items-end gap-3">
          <span className="mono font-bold text-4xl text-white">{inning.totalRuns}-{inning.totalWickets}</span>
          <span className="mono text-lg pb-1" style={{ color: "#B8C4BC" }}>({oversStr(inning.legalBalls)}/{match.overs})</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs mono" style={{ color: "#B8C4BC" }}>
          <span>CRR {runRate(inning.totalRuns, inning.legalBalls)}</span>
          {inning.target != null && (
            <>
              <span>Target {inning.target}</span>
              <span>Need {Math.max(inning.target - inning.totalRuns, 0)} off {ballsRemaining} balls</span>
              <span>RRR {reqRunRate(inning.target, inning.totalRuns, ballsRemaining)}</span>
            </>
          )}
          <span>Extras {inning.extras.wides + inning.extras.noballs + inning.extras.byes + inning.extras.legbyes}</span>
        </div>
      </div>

      {/* batsmen / bowler */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card>
          <p className="text-xs font-semibold opacity-60 mb-2 disp">BATTING</p>
          {[["striker", striker, inning.strikerId], ["nonStriker", nonStriker, inning.nonStrikerId]].map(([key, pl, pid]) => {
            const rec = pid ? inning.batsmen[pid] : null;
            if (key === "nonStriker" && !pid) {
              return (
                <div key={key} className="flex items-center justify-between text-sm mb-1">
                  <span className="italic opacity-50" style={{ color: "var(--ink)" }}>Last man batting</span>
                  <span className="mono text-xs opacity-40">—</span>
                </div>
              );
            }
            return (
              <div key={key} className="flex items-center justify-between text-sm mb-1">
                <span style={{ color: "var(--ink)" }}>{pl?.name || "—"}{key === "striker" && " *"}</span>
                <span className="mono text-xs opacity-70">{rec ? `${rec.runs} (${rec.balls})` : ""}</span>
              </div>
            );
          })}
        </Card>
        <Card>
          <p className="text-xs font-semibold opacity-60 mb-2 disp">BOWLING</p>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: "var(--ink)" }}>{bowler?.name || "—"}</span>
            <span className="mono text-xs opacity-70">{bowlerStats ? `${bowlerStats.wickets}-${bowlerStats.runs} (${oversStr(bowlerStats.balls)})` : ""}</span>
          </div>
        </Card>
      </div>

      {/* action area */}
      {inning.needNewBatsman ? (
        <Card className="mb-4">
          <p className="text-sm font-semibold mb-2" style={{ color: "var(--red)" }}>Wicket! Select next batsman</p>
          <Select value={nextBatsman} onChange={(e) => setNextBatsman(e.target.value)} className="mb-3">
            <option value="">Select batsman</option>
            {availableBatsmen.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Btn variant="primary" onClick={confirmNewBatsman} className="w-full justify-center"><Check size={16} /> Send In</Btn>
        </Card>
      ) : inning.needNewBowler ? (
        <Card className="mb-4">
          <p className="text-sm font-semibold mb-2" style={{ color: "var(--blue)" }}>Over complete — select next bowler</p>
          <Select value={nextBowler} onChange={(e) => setNextBowler(e.target.value)} className="mb-3">
            <option value="">Select bowler</option>
            {availableBowlers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Btn variant="primary" onClick={confirmNewBowler} className="w-full justify-center"><Check size={16} /> Confirm Bowler</Btn>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-60">Ball actions</p>
            <Btn size="sm" variant="outline" onClick={undoLastAction} disabled={undoStack.length === 0} className="justify-center"><RotateCcw size={14} /> Undo</Btn>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {[0, 1, 2, 3, 4, 5, 6].map((r) => (
              <Btn key={r} variant={r === 4 || r === 6 ? "gold" : "outline"} onClick={() => recordRun(r)} className="justify-center">{r}</Btn>
            ))}
            <Btn variant="danger" onClick={() => setWicketModal({})} className="justify-center">OUT</Btn>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-2">
            <Btn size="sm" variant="ghost" className="justify-center border" style={{ borderColor: "var(--line)" }} onClick={recordWide}>Wide</Btn>
            <Btn size="sm" variant="ghost" className="justify-center border" style={{ borderColor: "var(--line)" }} onClick={() => setExtraModal("noball")}>No Ball</Btn>
            <Btn size="sm" variant="ghost" className="justify-center border" style={{ borderColor: "var(--line)" }} onClick={() => setExtraModal("byes")}>Bye</Btn>
            <Btn size="sm" variant="ghost" className="justify-center border" style={{ borderColor: "var(--line)" }} onClick={() => setExtraModal("legbyes")}>Leg Bye</Btn>
          </div>
        </>
      )}

      {/* timeline */}
      <Card className="mt-4">
        <p className="text-xs font-semibold opacity-60 mb-2 disp">THIS INNINGS</p>
        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto scrollbar-thin">
          {inning.timeline.length === 0 && <p className="text-xs opacity-50">No balls bowled yet.</p>}
          {inning.timeline.map((t, i) => (
            <p key={i} className="text-xs mono" style={{ color: t.startsWith("WICKET") ? "var(--red)" : "var(--ink)" }}>{t}</p>
          ))}
        </div>
      </Card>

      {wicketModal && (
        <Modal title="How Out?" onClose={() => setWicketModal(null)}>
          <div className="grid grid-cols-2 gap-2">
            {DISMISSALS.map((d) => (
              <Btn key={d} variant="outline" onClick={() => confirmWicket(d)} className="justify-center">{d}</Btn>
            ))}
          </div>
        </Modal>
      )}

      {extraModal && (
        <Modal title={extraModal === "byes" ? "Byes" : extraModal === "legbyes" ? "Leg Byes" : "No Ball"} onClose={() => setExtraModal(null)}>
          <p className="text-xs opacity-60 mb-2">How many runs?</p>
          {extraModal === "noball" ? (
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[1, 2, 3, 4, 5, 6, 7].map((r) => (
                <Btn key={r} variant={noBallRuns === r ? "gold" : "outline"} onClick={() => setNoBallRuns(r)} className="justify-center">{r}</Btn>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[1, 2, 3, 4].map((r) => (
                <Btn key={r} variant={byeRuns === r ? "gold" : "outline"} onClick={() => setByeRuns(r)} className="justify-center">{r}</Btn>
              ))}
            </div>
          )}
          <Btn variant="primary" onClick={() => extraModal === "noball" ? recordNoBall(noBallRuns) : recordByeType(extraModal, byeRuns)} className="w-full justify-center"><Check size={16} /> Confirm</Btn>
        </Modal>
      )}
    </div>
  );
}

function InningsScorecard({ inning, teams, playerMap, label }) {
  const team = teams.find((t) => t.id === inning.battingTeamId);
  return (
    <Card>
      <p className="disp font-bold text-sm mb-1" style={{ color: "var(--ink)" }}>{label} · {team?.name}</p>
      <p className="mono font-bold text-lg mb-2" style={{ color: "var(--grass)" }}>{inning.totalRuns}/{inning.totalWickets} <span className="text-xs font-normal opacity-60">({oversStr(inning.legalBalls)} ov)</span></p>
      <div className="flex flex-col gap-1 mb-2">
        {Object.entries(inning.batsmen).map(([pid, rec]) => (
          <div key={pid} className="flex justify-between text-xs">
            <span>{playerMap[pid]?.name}{rec.out ? "" : " *"}</span>
            <span className="mono opacity-70">{rec.runs} ({rec.balls}){rec.out ? ` ${rec.dismissal}` : ""}</span>
          </div>
        ))}
      </div>
      <p className="text-xs font-semibold opacity-60 mt-2 mb-1 disp">BOWLING</p>
      <div className="flex flex-col gap-1">
        {Object.entries(inning.bowlers).map(([pid, rec]) => (
          <div key={pid} className="flex justify-between text-xs">
            <span>{playerMap[pid]?.name}</span>
            <span className="mono opacity-70">{oversStr(rec.balls)}-{rec.runs}-{rec.wickets}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ================================ APP ================================ */

export default function App() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [view, setView] = useState("players");
  const [liveId, setLiveId] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authUser, setAuthUser] = useState(() => readStoredSession());
  const skipSave = useRef(true);

  useEffect(() => {
    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (!authReady || !authUser) {
      setLoaded(false);
      skipSave.current = true;
      return;
    }

    let active = true;
    skipSave.current = true;
    (async () => {
      const [p, t, m] = await Promise.all([
        loadKey(scopedDataKey(authUser.username, "players"), []),
        loadKey(scopedDataKey(authUser.username, "teams"), []),
        loadKey(scopedDataKey(authUser.username, "matches"), []),
      ]);
      if (!active) return;
      setPlayers(p || []); setTeams(t || []); setMatches(m || []);
      setLoaded(true);
      skipSave.current = false;
    })();

    return () => {
      active = false;
    };
  }, [authReady, authUser]);

  useEffect(() => { if (skipSave.current || !authUser) return; saveKey(scopedDataKey(authUser.username, "players"), players); }, [players, authUser]);
  useEffect(() => { if (skipSave.current || !authUser) return; saveKey(scopedDataKey(authUser.username, "teams"), teams); }, [teams, authUser]);
  useEffect(() => { if (skipSave.current || !authUser) return; saveKey(scopedDataKey(authUser.username, "matches"), matches); }, [matches, authUser]);

  function updateMatch(id, fn) {
    setMatches((prev) => prev.map((m) => (m.id === id ? fn(structClone(m)) : m)));
  }
  function goLive(id) {
    setLiveId(id);
    setView("live");
  }
  function handleLogout() {
    clearStoredSession();
    setAuthUser(null);
    setPlayers([]);
    setTeams([]);
    setMatches([]);
    setView("players");
    setLiveId(null);
    setLoaded(false);
    skipSave.current = true;
  }

  const liveMatch = matches.find((m) => m.id === liveId);
  const anyLive = matches.some((m) => m.status === "live");

  if (!authReady) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-24 opacity-60 text-sm disp">Checking session…</div>
      </PageShell>
    );
  }

  if (!authUser) {
    return <AuthScreen onAuthenticated={setAuthUser} />;
  }

  if (!loaded) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-24 opacity-60 text-sm disp">Loading CrickTrack…</div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <TopNav view={view} setView={setView} hasLive={anyLive} currentUser={authUser} onLogout={handleLogout} />
      {view === "players" && <PlayersPanel players={players} setPlayers={setPlayers} />}
      {view === "teams" && <TeamsPanel players={players} teams={teams} setTeams={setTeams} />}
      {view === "matches" && <MatchesPanel teams={teams} matches={matches} setMatches={setMatches} goLive={goLive} />}
      {view === "live" && liveMatch && (
        <LiveScoring match={liveMatch} teams={teams} players={players} updateMatch={updateMatch} onBack={() => setView("matches")} />
      )}
      {view === "live" && !liveMatch && (
        <div className="p-6"><EmptyState icon={Play} text="No live match selected" sub="Go to Matches and start or resume a fixture." /></div>
      )}
    </PageShell>
  );
}
