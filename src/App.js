import { useState, useMemo } from "react";

const HABITS = [
  { id: "jobs", icon: "💼", label: "Job Apps",   target: 10, color: "#60a5fa" },
  { id: "cold", icon: "📧", label: "Cold Mails", target: 5,  color: "#a78bfa" },
  { id: "leet", icon: "💻", label: "LeetCode",   target: 3,  color: "#fbbf24" },
  { id: "ds",   icon: "📊", label: "DS Videos",  target: 7,  color: "#34d399" },
  { id: "mail", icon: "📬", label: "Check Mail", target: 2,  color: "#818cf8" },
  { id: "gym",  icon: "🏋️", label: "Gym",        target: 1,  color: "#f472b6" },
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_MAX = HABITS.reduce((s, h) => s + h.target, 0);

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDay(year, month) {
  return new Date(year, month, 1).getDay();
}

function getDates(year, month) {
  const total = getDaysInMonth(year, month);
  const out = [];
  for (let d = 1; d <= total; d++) {
    const dt = new Date(year, month, d);
    out.push({ day: d, dow: dt.toLocaleDateString("en-US", { weekday: "short" }) });
  }
  return out;
}

function getWeeks(dates) {
  const weeks = [];
  let week = [];
  dates.forEach((d, i) => {
    week.push(d);
    if (week.length === 7 || i === dates.length - 1) {
      weeks.push(week);
      week = [];
    }
  });
  return weeks;
}

export default function App() {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [vals, setVals]   = useState(() => {
    try { const s = localStorage.getItem("habit_vals_v2"); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const [open, setOpen]   = useState(null);
  const [view, setView]   = useState("calendar");
  const CORRECT_PIN = "2603";
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin]     = useState("");
  const [pinError, setPinError] = useState(false);

  const handlePin = (digit) => {
    const next = pin + digit;
    setPin(next);
    setPinError(false);
    if (next.length === 4) {
      if (next === CORRECT_PIN) { setUnlocked(true); }
      else { setPinError(true); setTimeout(() => setPin(""), 600); }
    }
  };

  const dates = useMemo(() => getDates(year, month), [year, month]);
  const weeks = useMemo(() => getWeeks(dates), [dates]);

  const [notes, setNotes] = useState(() => {
    try { const s = localStorage.getItem("habit_notes_v2"); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });

  const k = (day, id) => `${year}-${month}-${day}-${id}`;
  const nk = (day) => `${year}-${month}-${day}`;
  const v = (day, id) => vals[k(day, id)] ?? 0;
  const setV = (day, id, raw) => {
    const h = HABITS.find(h => h.id === id);
    const n = Math.max(0, Math.min(h.target * 2, parseInt(raw) || 0));
    setVals(p => {
      const next = { ...p, [k(day, id)]: n };
      try { localStorage.setItem("habit_vals_v2", JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const setNote = (day, text) => {
    setNotes(p => {
      const next = { ...p, [nk(day)]: text };
      try { localStorage.setItem("habit_notes_v2", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const dayScore = (day) => HABITS.reduce((s, h) => s + Math.min(v(day, h.id), h.target), 0);
  const dayPct   = (day) => Math.round((dayScore(day) / DAY_MAX) * 100);
  const totalDone = dates.reduce((s, d) => s + dayScore(d.day), 0);
  const totalMax  = dates.length * DAY_MAX;
  const overallPct = Math.round((totalDone / totalMax) * 100);

  const prevMonth = () => { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); setOpen(null); };
  const nextMonth = () => { if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1); setOpen(null); };

  const card = { background: "#161925", border: "1px solid #252a3d", borderRadius: 16 };

  if (!unlocked) return (
    <div style={{ minHeight: "100vh", background: "#0d0f18", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🔒</div>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, background: "linear-gradient(100deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Habit Tracker</h2>
        <p style={{ color: "#475569", fontSize: 13, marginBottom: 32 }}>Enter your PIN to continue</p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginBottom: 32 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${pinError ? "#f87171" : "#252a3d"}`, background: pin.length > i ? (pinError ? "#f87171" : "#60a5fa") : "transparent", transition: "all 0.2s" }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 72px)", gap: 12, justifyContent: "center" }}>
          {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d, i) => (
            <button key={i} onClick={() => {
              if (d === "⌫") { setPin(p => p.slice(0,-1)); setPinError(false); }
              else if (d !== "") handlePin(String(d));
            }} disabled={d === ""} style={{
              width: 72, height: 72, borderRadius: 16, border: "1px solid #252a3d",
              background: d === "" ? "transparent" : "#161925",
              color: "#e2e8f0", fontSize: d === "⌫" ? 20 : 22, fontWeight: 700,
              cursor: d === "" ? "default" : "pointer",
            }}>{d}</button>
          ))}
        </div>
        {pinError && <p style={{ color: "#f87171", fontSize: 13, marginTop: 20 }}>Incorrect PIN. Try again.</p>}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0d0f18", color: "#e2e8f0", fontFamily: "system-ui, sans-serif", padding: "36px 28px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "#475569" }}>HABIT TRACKER</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, background: "linear-gradient(100deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Daily Progress
            </h1>
            <div style={{ display: "flex", gap: 6, background: "#161925", border: "1px solid #252a3d", borderRadius: 12, padding: 5 }}>
              {["calendar","stats"].map(tab => (
                <button key={tab} onClick={() => setView(tab)} style={{
                  padding: "8px 22px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                  background: view === tab ? "#252a3d" : "transparent",
                  color: view === tab ? "#e2e8f0" : "#475569", transition: "all 0.2s"
                }}>{tab === "calendar" ? "📆 Calendar" : "📈 Stats"}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Month navigator */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
          <button onClick={prevMonth} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #252a3d", background: "#161925", color: "#e2e8f0", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
          <span style={{ fontSize: 22, fontWeight: 800, minWidth: 200, textAlign: "center" }}>{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #252a3d", background: "#161925", color: "#e2e8f0", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
        </div>

        {/* Overall progress */}
        <div style={{ ...card, padding: "22px 28px", marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{MONTHS[month]} Progress</span>
            <span style={{ fontSize: 13, color: "#475569" }}>{totalDone} / {totalMax} &nbsp;·&nbsp; <span style={{ color: "#60a5fa", fontWeight: 700, fontSize: 15 }}>{overallPct}%</span></span>
          </div>
          <div style={{ background: "#0d0f18", borderRadius: 99, height: 10 }}>
            <div style={{ background: "linear-gradient(90deg,#60a5fa,#a78bfa)", width: `${overallPct}%`, height: 10, borderRadius: 99, transition: "width 0.5s" }} />
          </div>
        </div>

        {/* Per-habit summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, marginBottom: 44 }}>
          {HABITS.map(h => {
            const total = dates.reduce((s, d) => s + Math.min(v(d.day, h.id), h.target), 0);
            const max = dates.length * h.target;
            const p = Math.round((total / max) * 100);
            return (
              <div key={h.id} style={{ ...card, padding: "16px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{h.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 10 }}>{h.label}</div>
                <div style={{ background: "#0d0f18", borderRadius: 99, height: 5, marginBottom: 8 }}>
                  <div style={{ background: h.color, width: `${p}%`, height: 5, borderRadius: 99, transition: "width 0.4s" }} />
                </div>
                <div style={{ fontSize: 13, color: h.color, fontWeight: 800 }}>{p}%</div>
                <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>{total}/{max}</div>
              </div>
            );
          })}
        </div>

        {view === "calendar" ? (
          <>
            {/* Column headers */}
            <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 0, marginBottom: 8 }}>
              <div />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12 }}>
                {HABITS.map(h => (
                  <div key={h.id} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#334155" }}>
                    {h.icon} {h.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Day rows grouped by week */}
            {weeks.map((week, wi) => (
              <div key={wi} style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", letterSpacing: "0.1em", margin: "16px 0 10px" }}>
                  WEEK {wi + 1} &nbsp;·&nbsp; {MONTHS[month].slice(0,3)} {week[0].day} – {week[week.length-1].day}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {week.map((d) => {
                    const pct = dayPct(d.day);
                    const perfect = pct === 100;
                    const isOpen = open === `${year}-${month}-${d.day}`;
                    const openKey = `${year}-${month}-${d.day}`;
                    const isToday = d.day === now.getDate() && month === now.getMonth() && year === now.getFullYear();

                    return (
                      <div key={d.day}>
                        <div
                          onClick={() => setOpen(isOpen ? null : openKey)}
                          style={{
                            display: "grid", gridTemplateColumns: "100px 1fr", alignItems: "center",
                            background: perfect ? "#0c1f14" : "#161925",
                            border: `1px solid ${perfect ? "#16a34a44" : isOpen ? "#60a5fa33" : isToday ? "#60a5fa55" : "#252a3d"}`,
                            borderRadius: isOpen ? "14px 14px 0 0" : 14,
                            padding: "16px 20px", cursor: "pointer", userSelect: "none", transition: "all 0.2s",
                          }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.08em" }}>{d.dow.toUpperCase()}</span>
                              {isToday && <span style={{ fontSize: 9, fontWeight: 800, color: "#60a5fa", background: "#1e3a5f", padding: "1px 6px", borderRadius: 99 }}>TODAY</span>}
                            </div>
                            <span style={{ fontSize: 20, fontWeight: 800, color: perfect ? "#4ade80" : "#e2e8f0", lineHeight: 1 }}>{d.day}</span>
                            <div style={{ marginTop: 6, background: "#0d0f18", borderRadius: 99, height: 4, width: 60 }}>
                              <div style={{ background: perfect ? "#4ade80" : "linear-gradient(90deg,#60a5fa,#a78bfa)", width: `${pct}%`, height: 4, borderRadius: 99, transition: "width 0.3s" }} />
                            </div>
                            <span style={{ fontSize: 10, color: perfect ? "#4ade80" : "#334155", fontWeight: 700, marginTop: 2 }}>{pct}% {perfect ? "🔥" : ""}</span>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, alignItems: "center" }}>
                            {HABITS.map(h => {
                              const val_ = v(d.day, h.id);
                              const p = Math.min(100, Math.round((val_ / h.target) * 100));
                              return (
                                <div key={h.id} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                  <div style={{ background: "#0d0f18", borderRadius: 99, height: 6 }}>
                                    <div style={{ background: p >= 100 ? h.color : `${h.color}55`, width: `${p}%`, height: 6, borderRadius: 99, transition: "width 0.2s" }} />
                                  </div>
                                  <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: p >= 100 ? h.color : "#334155" }}>{val_}/{h.target}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {isOpen && (
                          <div style={{ background: "#0f111a", border: "1px solid #60a5fa33", borderTop: "none", borderRadius: "0 0 14px 14px", padding: "20px 24px 24px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 16, marginBottom: 20 }}>
                              {HABITS.map(h => {
                                const cur = v(d.day, h.id);
                                const p = Math.min(100, Math.round((cur / h.target) * 100));
                                return (
                                  <div key={h.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>{h.icon} {h.label}</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                      <button onClick={e => { e.stopPropagation(); setV(d.day, h.id, cur-1); }} style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid #252a3d", background: "#161925", color: "#94a3b8", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                                      <input type="number" value={cur} onClick={e => e.stopPropagation()} onChange={e => setV(d.day, h.id, e.target.value)} style={{ width: 40, textAlign: "center", background: "#161925", border: "1px solid #252a3d", borderRadius: 7, color: "#e2e8f0", padding: "4px 2px", fontSize: 13, fontWeight: 700 }} />
                                      <button onClick={e => { e.stopPropagation(); setV(d.day, h.id, cur+1); }} style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid #252a3d", background: "#161925", color: "#94a3b8", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                                    </div>
                                    <div style={{ background: "#0d0f18", borderRadius: 99, height: 5 }}>
                                      <div style={{ background: h.color, width: `${p}%`, height: 5, borderRadius: 99, transition: "width 0.2s" }} />
                                    </div>
                                    <div style={{ fontSize: 11, color: h.color, fontWeight: 700 }}>{p}%</div>
                                  </div>
                                );
                              })}
                            </div>
                            {/* Notes */}
                            <div style={{ borderTop: "1px solid #1e2235", paddingTop: 16 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 8 }}>📝 Daily Note</div>
                              <textarea
                                placeholder="What went well? What did you miss and why?"
                                value={notes[nk(d.day)] ?? ""}
                                onClick={e => e.stopPropagation()}
                                onChange={e => setNote(d.day, e.target.value)}
                                rows={3}
                                style={{ width: "100%", background: "#161925", border: "1px solid #252a3d", borderRadius: 10, color: "#e2e8f0", padding: "12px 14px", fontSize: 13, resize: "vertical", outline: "none", fontFamily: "system-ui, sans-serif", boxSizing: "border-box", lineHeight: 1.6 }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ ...card, padding: "28px 32px" }}>
              <p style={{ margin: "0 0 24px", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#475569" }}>HABIT BREAKDOWN — {MONTHS[month].toUpperCase()} {year}</p>
              {HABITS.map(h => {
                const total = dates.reduce((s, d) => s + Math.min(v(d.day, h.id), h.target), 0);
                const max = dates.length * h.target;
                const p = Math.round((total / max) * 100);
                return (
                  <div key={h.id} style={{ marginBottom: 22 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                      <span style={{ fontWeight: 600 }}>{h.icon} {h.label}</span>
                      <span style={{ color: h.color, fontWeight: 700 }}>{total} / {max} · {p}%</span>
                    </div>
                    <div style={{ background: "#0d0f18", borderRadius: 99, height: 8 }}>
                      <div style={{ background: h.color, width: `${p}%`, height: 8, borderRadius: 99, transition: "width 0.4s" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ ...card, padding: "28px 32px" }}>
              <p style={{ margin: "0 0 20px", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#475569" }}>DAILY HEATMAP — {MONTHS[month].toUpperCase()} {year}</p>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {dates.map((d, i) => {
                  const p = dayPct(d.day);
                  const bg = p === 0 ? "#161925" : p < 30 ? "#1e3a5f" : p < 60 ? "#1d4ed8" : p < 100 ? "#2563eb" : "#16a34a";
                  return (
                    <div key={i} title={`${d.day}: ${p}%`} style={{ width: 38, height: 38, borderRadius: 9, background: bg, border: "1px solid #252a3d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: p > 20 ? "white" : "#334155", fontWeight: 800 }}>
                      {d.day}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 11, color: "#475569" }}>
                <span>0%</span>
                {["#161925","#1e3a5f","#1d4ed8","#2563eb","#16a34a"].map((c, i) => (
                  <div key={i} style={{ width: 16, height: 16, borderRadius: 4, background: c, border: "1px solid #252a3d" }} />
                ))}
                <span>100% 🔥</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
              {[
                { label: "Perfect Days", val: dates.filter(d => dayPct(d.day) === 100).length, icon: "🔥", color: "#4ade80" },
                { label: "Days Started",  val: dates.filter(d => dayScore(d.day) > 0).length,  icon: "📆", color: "#60a5fa" },
                { label: "Units Done",    val: totalDone, icon: "💪", color: "#a78bfa" },
              ].map((item, i) => (
                <div key={i} style={{ ...card, padding: "28px 24px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: item.color, marginBottom: 6 }}>{item.val}</div>
                  <div style={{ fontSize: 12, color: "#475569" }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
