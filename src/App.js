import { useState, useMemo } from "react";

const DEFAULT_HABITS = [
  { id: "jobs", icon: "💼", label: "Job Apps",   target: 10, color: "#4ec9b0" },
  { id: "cold", icon: "📧", label: "Cold Mails", target: 5,  color: "#9cdcfe" },
  { id: "leet", icon: "💻", label: "LeetCode",   target: 3,  color: "#dcdcaa" },
  { id: "ds",   icon: "📊", label: "DS Videos",  target: 7,  color: "#c586c0" },
  { id: "mail", icon: "📬", label: "Check Mail", target: 2,  color: "#569cd6" },
  { id: "gym",  icon: "🏋️", label: "Gym",        target: 1,  color: "#f44747" },
];

const COLORS = ["#4ec9b0","#9cdcfe","#dcdcaa","#c586c0","#569cd6","#f44747","#ce9178","#b5cea8","#d7ba7d","#4fc1ff"];
const ICONS  = ["💼","📧","💻","📊","📬","🏋️","📚","🎯","🧘","🏃","💧","✍️","🎨","🎸","🍎"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CORRECT_PIN = "0703";

// VS Code color tokens
const VSC = {
  bg:          "#1e1e1e",
  sidebar:     "#252526",
  panel:       "#1e1e1e",
  titlebar:    "#3c3c3c",
  activitybar: "#333333",
  tab:         "#2d2d2d",
  tabActive:   "#1e1e1e",
  border:      "#3c3c3c",
  border2:     "#474747",
  text:        "#d4d4d4",
  textDim:     "#858585",
  textMuted:   "#6a6a6a",
  blue:        "#569cd6",
  green:       "#4ec9b0",
  yellow:      "#dcdcaa",
  purple:      "#c586c0",
  orange:      "#ce9178",
  red:         "#f44747",
  cyan:        "#9cdcfe",
  lineNum:     "#858585",
  selection:   "#264f78",
  highlight:   "#2a2d2e",
  scrollbar:   "#424242",
  input:       "#3c3c3c",
  inputBorder: "#5c5c5c",
  badge:       "#007acc",
  badgeText:   "#ffffff",
  statusbar:   "#007acc",
  minimap:     "#2d2d30",
};

function getDates(year, month) {
  const total = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: total }, (_, i) => {
    const dt = new Date(year, month, i + 1);
    return { day: i + 1, dow: dt.toLocaleDateString("en-US", { weekday: "short" }) };
  });
}
function getWeeks(dates) {
  const weeks = []; let week = [];
  dates.forEach((d, i) => { week.push(d); if (week.length === 7 || i === dates.length - 1) { weeks.push(week); week = []; } });
  return weeks;
}
function uid() { return Math.random().toString(36).slice(2, 9); }

export default function App() {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin]     = useState("");
  const [pinError, setPinError] = useState(false);
  const [view, setView]   = useState("calendar");
  const [open, setOpen]   = useState(null);
  const [showManage, setShowManage] = useState(false);

  const [habits, setHabits] = useState(() => {
    try { const s = localStorage.getItem("habits_v3"); return s ? JSON.parse(s) : DEFAULT_HABITS; } catch { return DEFAULT_HABITS; }
  });
  const [vals, setVals] = useState(() => {
    try { const s = localStorage.getItem("habit_vals_v2"); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const [notes, setNotes] = useState(() => {
    try { const s = localStorage.getItem("habit_notes_v2"); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });

  const [newLabel,  setNewLabel]  = useState("");
  const [newTarget, setNewTarget] = useState(1);
  const [newIcon,   setNewIcon]   = useState("🎯");
  const [newColor,  setNewColor]  = useState(COLORS[0]);
  const [editId,    setEditId]    = useState(null);

  const saveHabits = (h) => { setHabits(h); try { localStorage.setItem("habits_v3", JSON.stringify(h)); } catch {} };
  const startEdit  = (h) => { setEditId(h.id); setNewLabel(h.label); setNewTarget(h.target); setNewIcon(h.icon); setNewColor(h.color); };
  const cancelEdit = ()  => { setEditId(null); setNewLabel(""); setNewTarget(1); setNewIcon("🎯"); setNewColor(COLORS[0]); };
  const saveEdit   = ()  => {
    if (!newLabel.trim()) return;
    saveHabits(habits.map(h => h.id === editId ? { ...h, label: newLabel.trim(), target: Math.max(1, newTarget), icon: newIcon, color: newColor } : h));
    cancelEdit();
  };
  const addHabit   = ()  => {
    if (!newLabel.trim()) return;
    saveHabits([...habits, { id: uid(), icon: newIcon, label: newLabel.trim(), target: Math.max(1, newTarget), color: newColor }]);
    cancelEdit();
  };
  const deleteHabit = (id) => saveHabits(habits.filter(h => h.id !== id));

  const handlePin = (digit) => {
    const next = pin + digit; setPin(next); setPinError(false);
    if (next.length === 4) {
      if (next === CORRECT_PIN) setUnlocked(true);
      else { setPinError(true); setTimeout(() => setPin(""), 600); }
    }
  };

  const DAY_MAX    = habits.reduce((s, h) => s + h.target, 0) || 1;
  const k          = (day, id) => `${year}-${month}-${day}-${id}`;
  const nk         = (day)     => `${year}-${month}-${day}`;
  const v          = (day, id) => vals[k(day, id)] ?? 0;
  const setV       = (day, id, raw) => {
    const h = habits.find(h => h.id === id); if (!h) return;
    const n = Math.max(0, Math.min(h.target * 2, parseInt(raw) || 0));
    setVals(p => { const next = { ...p, [k(day,id)]: n }; try { localStorage.setItem("habit_vals_v2", JSON.stringify(next)); } catch {} return next; });
  };
  const setNote    = (day, text) => {
    setNotes(p => { const next = { ...p, [nk(day)]: text }; try { localStorage.setItem("habit_notes_v2", JSON.stringify(next)); } catch {} return next; });
  };

  const dates      = useMemo(() => getDates(year, month), [year, month]);
  const weeks      = useMemo(() => getWeeks(dates), [dates]);
  const dayScore   = (day) => habits.reduce((s, h) => s + Math.min(v(day, h.id), h.target), 0);
  const dayPct     = (day) => Math.round((dayScore(day) / DAY_MAX) * 100);
  const totalDone  = dates.reduce((s, d) => s + dayScore(d.day), 0);
  const totalMax   = dates.length * DAY_MAX;
  const overallPct = Math.round((totalDone / totalMax) * 100);
  const todayPct   = (now.getMonth()===month && now.getFullYear()===year) ? dayPct(now.getDate()) : null;

  const prevMonth  = () => { setMonth(m => { if(m===0){setYear(y=>y-1);return 11;} return m-1; }); setOpen(null); };
  const nextMonth  = () => { setMonth(m => { if(m===11){setYear(y=>y+1);return 0;} return m+1; }); setOpen(null); };
  const gridCols   = `repeat(${habits.length}, 1fr)`;

  // PIN screen
  if (!unlocked) return (
    <div style={{ minHeight:"100vh", width:"100%", background:VSC.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Consolas','Courier New',monospace" }}>
      <div style={{ textAlign:"center", width:300 }}>
        <div style={{ fontFamily:"monospace", marginBottom:24 }}>
          <div style={{ color: VSC.textDim, fontSize:12, marginBottom:4 }}>// habit-tracker</div>
          <div><span style={{ color:VSC.blue }}>function</span> <span style={{ color:VSC.yellow }}>authenticate</span><span style={{ color:VSC.text }}>()</span> <span style={{ color:VSC.text }}>{"{"}</span></div>
          <div style={{ paddingLeft:16 }}><span style={{ color:VSC.blue }}>const</span> <span style={{ color:VSC.cyan }}>pin</span> <span style={{ color:VSC.text }}>=</span> <span style={{ color:VSC.orange }}>"____"</span><span style={{ color:VSC.text }}>;</span></div>
          <div><span style={{ color:VSC.text }}>{"}"}</span></div>
        </div>
        <div style={{ background:VSC.sidebar, border:`1px solid ${VSC.border}`, borderRadius:6, padding:"28px 24px", marginBottom:20 }}>
          <div style={{ fontSize:11, color:VSC.textDim, marginBottom:20, letterSpacing:"0.1em" }}>ENTER PIN</div>
          <div style={{ display:"flex", gap:12, justifyContent:"center", marginBottom:24 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ width:12, height:12, borderRadius:"50%", background: pin.length > i ? (pinError ? VSC.red : VSC.blue) : VSC.border2, transition:"all 0.2s" }} />
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
            {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i) => (
              <button key={i} onClick={() => { if(d==="⌫"){setPin(p=>p.slice(0,-1));setPinError(false);} else if(d!=="")handlePin(String(d)); }} disabled={d===""} style={{ height:52, borderRadius:4, border:`1px solid ${VSC.border2}`, background:d===""?"transparent":VSC.tab, color:VSC.text, fontSize:d==="⌫"?18:20, fontFamily:"'Consolas','Courier New',monospace", fontWeight:600, cursor:d===""?"default":"pointer" }}>{d}</button>
            ))}
          </div>
          {pinError && <div style={{ color:VSC.red, fontSize:12, marginTop:14, fontFamily:"monospace" }}>// Error: incorrect PIN</div>}
        </div>
        <div style={{ color:VSC.textMuted, fontSize:11, fontFamily:"monospace" }}>🔒 habit-tracker v1.0.0</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", width:"100%", background:VSC.bg, color:VSC.text, fontFamily:"'Consolas','Courier New',monospace", display:"flex", flexDirection:"column", boxSizing:"border-box" }}>

      {/* Title bar */}
      <div style={{ background:VSC.titlebar, height:32, display:"flex", alignItems:"center", padding:"0 16px", gap:6, flexShrink:0, userSelect:"none" }}>
        <span style={{ fontSize:12, color:VSC.textDim }}>habit-tracker</span>
        <span style={{ color:VSC.border2, fontSize:12 }}>—</span>
        <span style={{ fontSize:12, color:VSC.textDim }}>{MONTHS[month]} {year}</span>
      </div>

      {/* Tab bar */}
      <div style={{ background:VSC.sidebar, display:"flex", alignItems:"stretch", borderBottom:`1px solid ${VSC.border}`, flexShrink:0 }}>
        {[
          { id:"calendar", label:"📆 calendar.tsx" },
          { id:"stats",    label:"📈 stats.tsx" },
        ].map(tab => (
          <div key={tab.id} onClick={() => setView(tab.id)} style={{ padding:"8px 20px", fontSize:13, cursor:"pointer", borderRight:`1px solid ${VSC.border}`, borderBottom:`2px solid ${view===tab.id ? VSC.blue : "transparent"}`, background:view===tab.id ? VSC.tabActive : VSC.tab, color:view===tab.id ? VSC.text : VSC.textDim, whiteSpace:"nowrap" }}>
            {tab.label}
          </div>
        ))}
        <div onClick={() => setShowManage(true)} style={{ padding:"8px 20px", fontSize:13, cursor:"pointer", borderRight:`1px solid ${VSC.border}`, borderBottom:"2px solid transparent", background:VSC.tab, color:VSC.cyan, whiteSpace:"nowrap" }}>
          ⚙️ goals.json
        </div>
        <div style={{ flex:1, background:VSC.tab }} />
      </div>

      {/* Main area */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* Activity bar */}
        <div style={{ width:48, background:VSC.activitybar, display:"flex", flexDirection:"column", alignItems:"center", paddingTop:12, gap:16, flexShrink:0, borderRight:`1px solid ${VSC.border}` }}>
          {["📆","📈","⚙️"].map((ic,i) => (
            <div key={i} title={["Calendar","Stats","Goals"][i]} style={{ fontSize:20, cursor:"pointer", opacity: (i===0&&view==="calendar")||(i===1&&view==="stats") ? 1 : 0.4 }} onClick={() => { if(i<2) setView(["calendar","stats"][i]); else setShowManage(true); }}>{ic}</div>
          ))}
        </div>

        {/* Editor */}
        <div style={{ flex:1, overflow:"auto", padding:"24px 32px 60px" }}>

          {/* Month nav + progress */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16, marginBottom:28 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <button onClick={prevMonth} style={{ background:VSC.tab, border:`1px solid ${VSC.border2}`, borderRadius:4, color:VSC.text, cursor:"pointer", width:28, height:28, fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
              <span style={{ fontSize:20, fontWeight:700, color:VSC.cyan }}>{MONTHS[month]} <span style={{ color:VSC.textDim }}>{year}</span></span>
              <button onClick={nextMonth} style={{ background:VSC.tab, border:`1px solid ${VSC.border2}`, borderRadius:4, color:VSC.text, cursor:"pointer", width:28, height:28, fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
            </div>
            <div style={{ display:"flex", gap:12, flex:1, maxWidth:520 }}>
              {/* Monthly */}
              <div style={{ flex:1, background:VSC.sidebar, border:`1px solid ${VSC.border}`, borderRadius:6, padding:"12px 16px" }}>
                <div style={{ fontSize:10, color:VSC.textDim, marginBottom:6, letterSpacing:"0.1em" }}>// MONTHLY</div>
                <div style={{ background:VSC.bg, borderRadius:2, height:6, marginBottom:4 }}>
                  <div style={{ background:VSC.blue, width:`${overallPct}%`, height:6, borderRadius:2, transition:"width 0.5s" }} />
                </div>
                <div style={{ fontSize:12, color:VSC.blue, fontWeight:700 }}>{overallPct}%</div>
              </div>
              {/* Today */}
              {todayPct !== null && (
                <div style={{ flex:1, background:VSC.sidebar, border:`1px solid ${VSC.border}`, borderRadius:6, padding:"12px 16px" }}>
                  <div style={{ fontSize:10, color:VSC.textDim, marginBottom:6, letterSpacing:"0.1em" }}>// TODAY</div>
                  <div style={{ background:VSC.bg, borderRadius:2, height:6, marginBottom:4 }}>
                    <div style={{ background:todayPct===100?VSC.green:VSC.yellow, width:`${todayPct}%`, height:6, borderRadius:2, transition:"width 0.5s" }} />
                  </div>
                  <div style={{ fontSize:12, color:todayPct===100?VSC.green:VSC.yellow, fontWeight:700 }}>{todayPct}% {todayPct===100?"🔥":""}</div>
                </div>
              )}
            </div>
          </div>

          {/* Habit summary */}
          <div style={{ display:"grid", gridTemplateColumns:gridCols, gap:8, marginBottom:28 }}>
            {habits.map(h => {
              const total = dates.reduce((s,d) => s+Math.min(v(d.day,h.id),h.target), 0);
              const max   = dates.length * h.target;
              const p     = Math.round((total/max)*100);
              return (
                <div key={h.id} style={{ background:VSC.sidebar, border:`1px solid ${VSC.border}`, borderRadius:6, padding:"14px 12px" }}>
                  <div style={{ fontSize:18, marginBottom:6 }}>{h.icon}</div>
                  <div style={{ fontSize:10, color:VSC.textDim, marginBottom:8, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{h.label}</div>
                  <div style={{ background:VSC.bg, borderRadius:2, height:4, marginBottom:6 }}>
                    <div style={{ background:h.color, width:`${p}%`, height:4, borderRadius:2, transition:"width 0.4s" }} />
                  </div>
                  <div style={{ fontSize:12, color:h.color, fontWeight:700 }}>{p}%</div>
                  <div style={{ fontSize:10, color:VSC.textMuted }}>{total}/{max}</div>
                </div>
              );
            })}
          </div>

          {view==="calendar" ? (
            <>
              {/* Column headers */}
              <div style={{ display:"grid", gridTemplateColumns:"110px 1fr", marginBottom:6 }}>
                <div style={{ fontSize:10, color:VSC.lineNum }}>// date</div>
                <div style={{ display:"grid", gridTemplateColumns:gridCols, gap:16 }}>
                  {habits.map(h => (
                    <div key={h.id} style={{ fontSize:10, color:h.color, textAlign:"center", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{h.icon} {h.label}</div>
                  ))}
                </div>
              </div>

              {weeks.map((week, wi) => (
                <div key={wi} style={{ marginBottom:28 }}>
                  <div style={{ fontSize:10, color:VSC.textMuted, margin:"10px 0 8px", fontStyle:"italic" }}>/* week {wi+1} · {MONTHS[month].slice(0,3)} {week[0].day}–{week[week.length-1].day} */</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    {week.map(d => {
                      const pct     = dayPct(d.day);
                      const perfect = pct===100;
                      const isOpen  = open===`${year}-${month}-${d.day}`;
                      const openKey = `${year}-${month}-${d.day}`;
                      const isToday = d.day===now.getDate()&&month===now.getMonth()&&year===now.getFullYear();
                      const hasNote = !!(notes[nk(d.day)]?.trim());
                      return (
                        <div key={d.day}>
                          <div onClick={()=>setOpen(isOpen?null:openKey)} style={{ display:"grid", gridTemplateColumns:"110px 1fr auto", alignItems:"center", gap:16, background:isToday?VSC.highlight:perfect?"#1a2e1a":VSC.sidebar, border:`1px solid ${perfect?"#2d4a2d":isOpen?VSC.blue:isToday?VSC.border2:VSC.border}`, borderRadius:isOpen?"6px 6px 0 0":6, padding:"12px 16px", cursor:"pointer", userSelect:"none", transition:"all 0.15s" }}>
                            {/* Line number style date */}
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <span style={{ color:VSC.lineNum, fontSize:11, minWidth:20, textAlign:"right" }}>{d.day}</span>
                              <div>
                                <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:2 }}>
                                  <span style={{ fontSize:10, color:VSC.textDim }}>{d.dow}</span>
                                  {isToday && <span style={{ fontSize:9, background:VSC.badge, color:VSC.badgeText, padding:"1px 5px", borderRadius:3, fontWeight:700 }}>●</span>}
                                  {hasNote && <span style={{ fontSize:10 }}>📝</span>}
                                </div>
                                <div style={{ background:VSC.bg, borderRadius:2, height:3, width:50 }}>
                                  <div style={{ background:perfect?VSC.green:VSC.blue, width:`${pct}%`, height:3, borderRadius:2, transition:"width 0.3s" }} />
                                </div>
                                <span style={{ fontSize:9, color:perfect?VSC.green:VSC.textDim, marginTop:2, display:"block" }}>{pct}%{perfect?" 🔥":""}</span>
                              </div>
                            </div>
                            {/* Bars */}
                            <div style={{ display:"grid", gridTemplateColumns:gridCols, gap:16, alignItems:"center" }}>
                              {habits.map(h => {
                                const val_ = v(d.day,h.id);
                                const p    = Math.min(100,Math.round((val_/h.target)*100));
                                return (
                                  <div key={h.id} style={{ display:"flex", flexDirection:"column", gap:4 }}>
                                    <div style={{ background:VSC.bg, borderRadius:2, height:5 }}>
                                      <div style={{ background:p>=100?h.color:`${h.color}55`, width:`${p}%`, height:5, borderRadius:2, transition:"width 0.2s" }} />
                                    </div>
                                    <div style={{ textAlign:"center", fontSize:10, color:p>=100?h.color:VSC.textMuted, fontWeight:700 }}>{val_}/{h.target}</div>
                                  </div>
                                );
                              })}
                            </div>
                            <span style={{ color:VSC.textDim, fontSize:12, transition:"transform 0.2s", display:"block", transform:isOpen?"rotate(90deg)":"none" }}>›</span>
                          </div>

                          {isOpen && (
                            <div style={{ background:"#141414", border:`1px solid ${VSC.blue}`, borderTop:"none", borderRadius:"0 0 6px 6px", padding:"20px 20px 24px" }}>
                              <div style={{ display:"grid", gridTemplateColumns:gridCols, gap:16, marginBottom:20 }}>
                                {habits.map(h => {
                                  const cur = v(d.day,h.id);
                                  const p   = Math.min(100,Math.round((cur/h.target)*100));
                                  return (
                                    <div key={h.id} style={{ display:"flex", flexDirection:"column", gap:8 }}>
                                      <div style={{ fontSize:10, color:h.color, fontWeight:700 }}>{h.icon} {h.label}</div>
                                      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                                        <button onClick={e=>{e.stopPropagation();setV(d.day,h.id,cur-1);}} style={{ width:24,height:24,borderRadius:3,border:`1px solid ${VSC.border2}`,background:VSC.tab,color:VSC.text,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center" }}>−</button>
                                        <input type="number" value={cur} onClick={e=>e.stopPropagation()} onChange={e=>setV(d.day,h.id,e.target.value)} style={{ width:42,textAlign:"center",background:VSC.input,border:`1px solid ${VSC.inputBorder}`,borderRadius:3,color:VSC.text,padding:"3px",fontSize:13,fontFamily:"'Consolas','Courier New',monospace",fontWeight:700 }} />
                                        <button onClick={e=>{e.stopPropagation();setV(d.day,h.id,cur+1);}} style={{ width:24,height:24,borderRadius:3,border:`1px solid ${VSC.border2}`,background:VSC.tab,color:VSC.text,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center" }}>+</button>
                                      </div>
                                      <div style={{ background:VSC.bg, borderRadius:2, height:5 }}>
                                        <div style={{ background:h.color, width:`${p}%`, height:5, borderRadius:2, transition:"width 0.2s" }} />
                                      </div>
                                      <div style={{ fontSize:10, color:h.color, fontWeight:700 }}>{p}%</div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div style={{ borderTop:`1px solid ${VSC.border}`, paddingTop:16 }}>
                                <div style={{ fontSize:10, color:VSC.textDim, marginBottom:8 }}>// daily_note</div>
                                <textarea placeholder="// What went well? What did you miss and why?" value={notes[nk(d.day)]??""} onClick={e=>e.stopPropagation()} onChange={e=>setNote(d.day,e.target.value)} rows={3} style={{ width:"100%",background:VSC.input,border:`1px solid ${VSC.inputBorder}`,borderRadius:4,color:VSC.text,padding:"10px 12px",fontSize:12,resize:"vertical",outline:"none",fontFamily:"'Consolas','Courier New',monospace",boxSizing:"border-box",lineHeight:1.6 }} />
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
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ background:VSC.sidebar, border:`1px solid ${VSC.border}`, borderRadius:6, padding:"24px 28px" }}>
                <div style={{ fontSize:10, color:VSC.textDim, marginBottom:20, letterSpacing:"0.1em" }}>// HABIT_BREAKDOWN · {MONTHS[month].toUpperCase()} {year}</div>
                {habits.map(h => {
                  const total = dates.reduce((s,d)=>s+Math.min(v(d.day,h.id),h.target),0);
                  const max   = dates.length*h.target;
                  const p     = Math.round((total/max)*100);
                  return (
                    <div key={h.id} style={{ marginBottom:18 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:6 }}>
                        <span style={{ color:h.color }}>{h.icon} {h.label}</span>
                        <span style={{ color:VSC.textDim }}>{total}/{max} <span style={{ color:h.color, fontWeight:700 }}>{p}%</span></span>
                      </div>
                      <div style={{ background:VSC.bg, borderRadius:2, height:7 }}>
                        <div style={{ background:h.color, width:`${p}%`, height:7, borderRadius:2, transition:"width 0.4s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ background:VSC.sidebar, border:`1px solid ${VSC.border}`, borderRadius:6, padding:"24px 28px" }}>
                <div style={{ fontSize:10, color:VSC.textDim, marginBottom:16, letterSpacing:"0.1em" }}>// DAILY_HEATMAP</div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  {dates.map((d,i) => {
                    const p  = dayPct(d.day);
                    const bg = p===0?VSC.sidebar:p<30?"#1a2a3a":p<60?"#1a3a5a":p<100?"#1a4a7a":VSC.green;
                    return <div key={i} title={`${d.day}: ${p}%`} style={{ width:36,height:36,borderRadius:4,background:bg,border:`1px solid ${VSC.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:p>20?VSC.text:VSC.textMuted,fontWeight:700 }}>{d.day}</div>;
                  })}
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                {[
                  { label:"perfect_days", val:dates.filter(d=>dayPct(d.day)===100).length, color:VSC.green },
                  { label:"days_started",  val:dates.filter(d=>dayScore(d.day)>0).length,  color:VSC.blue  },
                  { label:"total_units",   val:totalDone,                                   color:VSC.purple },
                ].map((item,i) => (
                  <div key={i} style={{ background:VSC.sidebar, border:`1px solid ${VSC.border}`, borderRadius:6, padding:"24px 20px", textAlign:"center" }}>
                    <div style={{ fontSize:28, fontWeight:800, color:item.color, marginBottom:6 }}>{item.val}</div>
                    <div style={{ fontSize:11, color:VSC.textDim }}>// {item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div style={{ background:VSC.statusbar, height:24, display:"flex", alignItems:"center", padding:"0 12px", gap:16, flexShrink:0 }}>
        <span style={{ fontSize:11, color:"white", opacity:0.9 }}>🎯 Habit Tracker</span>
        <span style={{ fontSize:11, color:"white", opacity:0.7 }}>{MONTHS[month]} {year}</span>
        <span style={{ fontSize:11, color:"white", opacity:0.7 }}>Monthly: {overallPct}%</span>
        {todayPct!==null && <span style={{ fontSize:11, color:"white", opacity:0.7 }}>Today: {todayPct}%</span>}
        <div style={{ flex:1 }} />
        <span style={{ fontSize:11, color:"white", opacity:0.7 }}>TypeScript JSX</span>
        <span style={{ fontSize:11, color:"white", opacity:0.7 }}>UTF-8</span>
      </div>

      {/* Manage Goals Modal */}
      {showManage && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }} onClick={()=>setShowManage(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:VSC.sidebar, border:`1px solid ${VSC.border2}`, borderRadius:6, width:"100%", maxWidth:520, maxHeight:"85vh", overflow:"auto" }}>
            {/* Modal tab */}
            <div style={{ background:VSC.titlebar, padding:"10px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:`1px solid ${VSC.border}` }}>
              <span style={{ fontSize:13, color:VSC.cyan }}>⚙️ goals.json</span>
              <button onClick={()=>setShowManage(false)} style={{ background:"none", border:"none", color:VSC.textDim, fontSize:18, cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ padding:"20px 24px 28px" }}>
              <div style={{ fontSize:10, color:VSC.textDim, marginBottom:14, letterSpacing:"0.1em" }}>// CURRENT_GOALS</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:24 }}>
                {habits.map(h => (
                  <div key={h.id}>
                    {editId!==h.id ? (
                      <div style={{ display:"flex", alignItems:"center", gap:10, background:VSC.bg, border:`1px solid ${VSC.border}`, borderRadius:4, padding:"10px 14px" }}>
                        <span style={{ fontSize:18 }}>{h.icon}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, color:h.color, fontWeight:700 }}>{h.label}</div>
                          <div style={{ fontSize:11, color:VSC.textDim }}>target: {h.target}/day</div>
                        </div>
                        <button onClick={()=>startEdit(h)} style={{ background:"transparent", border:`1px solid ${VSC.border2}`, borderRadius:3, color:VSC.textDim, cursor:"pointer", padding:"4px 10px", fontSize:11 }}>edit</button>
                        <button onClick={()=>deleteHabit(h.id)} style={{ background:"transparent", border:`1px solid ${VSC.red}44`, borderRadius:3, color:VSC.red, cursor:"pointer", padding:"4px 10px", fontSize:11 }}>delete</button>
                      </div>
                    ) : (
                      <div style={{ background:VSC.bg, border:`1px solid ${VSC.blue}`, borderRadius:4, padding:"14px" }}>
                        <div style={{ fontSize:10, color:VSC.blue, marginBottom:12 }}>// editing: {h.label}</div>
                        <div style={{ marginBottom:10 }}>
                          <div style={{ fontSize:10, color:VSC.textDim, marginBottom:6 }}>// icon</div>
                          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                            {ICONS.map(ic => <button key={ic} onClick={()=>setNewIcon(ic)} style={{ width:32,height:32,borderRadius:3,border:`1px solid ${newIcon===ic?VSC.blue:VSC.border}`,background:newIcon===ic?VSC.selection:VSC.tab,fontSize:15,cursor:"pointer" }}>{ic}</button>)}
                          </div>
                        </div>
                        <div style={{ marginBottom:10 }}>
                          <div style={{ fontSize:10, color:VSC.textDim, marginBottom:6 }}>// color</div>
                          <div style={{ display:"flex", gap:6 }}>{COLORS.map(c => <button key={c} onClick={()=>setNewColor(c)} style={{ width:24,height:24,borderRadius:"50%",background:c,border:`3px solid ${newColor===c?"white":"transparent"}`,cursor:"pointer" }} />)}</div>
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 90px", gap:8, marginBottom:12 }}>
                          <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} style={{ background:VSC.input,border:`1px solid ${VSC.inputBorder}`,borderRadius:3,color:VSC.text,padding:"7px 10px",fontSize:13,fontFamily:"'Consolas','Courier New',monospace",outline:"none" }} />
                          <input type="number" min={1} value={newTarget} onChange={e=>setNewTarget(parseInt(e.target.value)||1)} style={{ background:VSC.input,border:`1px solid ${VSC.inputBorder}`,borderRadius:3,color:VSC.text,padding:"7px 10px",fontSize:13,fontFamily:"'Consolas','Courier New',monospace",outline:"none" }} />
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={saveEdit} style={{ flex:1,padding:"8px",borderRadius:3,border:"none",background:VSC.blue,color:"white",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Consolas','Courier New',monospace" }}>Save</button>
                          <button onClick={cancelEdit} style={{ padding:"8px 14px",borderRadius:3,border:`1px solid ${VSC.border2}`,background:"none",color:VSC.textDim,fontSize:13,cursor:"pointer",fontFamily:"'Consolas','Courier New',monospace" }}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ borderTop:`1px solid ${VSC.border}`, paddingTop:20 }}>
                <div style={{ fontSize:10, color:VSC.textDim, marginBottom:14, letterSpacing:"0.1em" }}>// ADD_NEW_GOAL</div>
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:10, color:VSC.textDim, marginBottom:6 }}>// icon</div>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                    {ICONS.map(ic => <button key={ic} onClick={()=>{setNewIcon(ic);setEditId(null);}} style={{ width:32,height:32,borderRadius:3,border:`1px solid ${!editId&&newIcon===ic?VSC.blue:VSC.border}`,background:!editId&&newIcon===ic?VSC.selection:VSC.tab,fontSize:15,cursor:"pointer" }}>{ic}</button>)}
                  </div>
                </div>
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:10, color:VSC.textDim, marginBottom:6 }}>// color</div>
                  <div style={{ display:"flex", gap:6 }}>{COLORS.map(c => <button key={c} onClick={()=>{setNewColor(c);setEditId(null);}} style={{ width:24,height:24,borderRadius:"50%",background:c,border:`3px solid ${!editId&&newColor===c?"white":"transparent"}`,cursor:"pointer" }} />)}</div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 90px", gap:8, marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:10, color:VSC.textDim, marginBottom:4 }}>// label</div>
                    <input value={editId?'':newLabel} onChange={e=>{setEditId(null);setNewLabel(e.target.value);}} placeholder='"Read Books"' style={{ width:"100%",background:VSC.input,border:`1px solid ${VSC.inputBorder}`,borderRadius:3,color:VSC.orange,padding:"7px 10px",fontSize:13,fontFamily:"'Consolas','Courier New',monospace",outline:"none",boxSizing:"border-box" }} />
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:VSC.textDim, marginBottom:4 }}>// target</div>
                    <input type="number" min={1} value={editId?1:newTarget} onChange={e=>{setEditId(null);setNewTarget(parseInt(e.target.value)||1);}} style={{ width:"100%",background:VSC.input,border:`1px solid ${VSC.inputBorder}`,borderRadius:3,color:VSC.green,padding:"7px 10px",fontSize:13,fontFamily:"'Consolas','Courier New',monospace",outline:"none",boxSizing:"border-box" }} />
                  </div>
                </div>
                <button onClick={addHabit} disabled={!newLabel.trim()||!!editId} style={{ width:"100%",padding:"9px",borderRadius:3,border:"none",background:newLabel.trim()&&!editId?VSC.blue:"#2a2a2a",color:newLabel.trim()&&!editId?"white":VSC.textMuted,fontWeight:700,fontSize:13,cursor:newLabel.trim()&&!editId?"pointer":"default",fontFamily:"'Consolas','Courier New',monospace" }}>
                  + Add Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}