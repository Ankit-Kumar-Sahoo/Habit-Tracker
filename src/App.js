import { useState, useMemo } from "react";

const DEFAULT_HABITS = [
  { id: "jobs", icon: "💼", label: "Job Apps",   target: 10, color: "#3b82f6" },
  { id: "cold", icon: "📧", label: "Cold Mails", target: 5,  color: "#8b5cf6" },
  { id: "leet", icon: "💻", label: "LeetCode",   target: 3,  color: "#f59e0b" },
  { id: "ds",   icon: "📊", label: "DS Videos",  target: 7,  color: "#10b981" },
  { id: "mail", icon: "📬", label: "Check Mail", target: 2,  color: "#6366f1" },
  { id: "gym",  icon: "🏋️", label: "Gym",        target: 1,  color: "#ec4899" },
];

const COLORS = ["#3b82f6","#8b5cf6","#f59e0b","#10b981","#6366f1","#ec4899","#ef4444","#14b8a6","#f97316","#a855f7"];
const ICONS  = ["💼","📧","💻","📊","📬","🏋️","📚","🎯","🧘","🏃","💧","✍️","🎨","🎸","🍎"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CORRECT_PIN = "2603";

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
  const [dark, setDark]       = useState(true);
  const [year, setYear]       = useState(now.getFullYear());
  const [month, setMonth]     = useState(now.getMonth());
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin]         = useState("");
  const [pinError, setPinError] = useState(false);
  const [view, setView]       = useState("calendar");
  const [open, setOpen]       = useState(null);
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

  // New habit form state
  const [newLabel,  setNewLabel]  = useState("");
  const [newTarget, setNewTarget] = useState(1);
  const [newIcon,   setNewIcon]   = useState("🎯");
  const [newColor,  setNewColor]  = useState(COLORS[0]);

  const saveHabits = (h) => { setHabits(h); try { localStorage.setItem("habits_v3", JSON.stringify(h)); } catch {} };

  const addHabit = () => {
    if (!newLabel.trim()) return;
    const h = { id: uid(), icon: newIcon, label: newLabel.trim(), target: Math.max(1, newTarget), color: newColor };
    saveHabits([...habits, h]);
    setNewLabel(""); setNewTarget(1); setNewIcon("🎯"); setNewColor(COLORS[0]);
  };
  const deleteHabit = (id) => saveHabits(habits.filter(h => h.id !== id));

  const DAY_MAX = habits.reduce((s, h) => s + h.target, 0) || 1;

  const t = (d, l) => dark ? d : l;
  const theme = {
    bg:      t("#0d0f18","#f1f5f9"), surface: t("#161925","#ffffff"),
    surface2:t("#1e2235","#f8fafc"), border:  t("#252a3d","#e2e8f0"),
    text:    t("#e2e8f0","#0f172a"), text2:   t("#64748b","#64748b"),
    text3:   t("#334155","#94a3b8"), input:   t("#0f111a","#f1f5f9"),
    track:   t("#0d0f18","#e2e8f0"), overlay: t("rgba(0,0,0,0.6)","rgba(0,0,0,0.3)"),
  };

  const handlePin = (digit) => {
    const next = pin + digit; setPin(next); setPinError(false);
    if (next.length === 4) {
      if (next === CORRECT_PIN) setUnlocked(true);
      else { setPinError(true); setTimeout(() => setPin(""), 600); }
    }
  };

  const k   = (day, id) => `${year}-${month}-${day}-${id}`;
  const nk  = (day)     => `${year}-${month}-${day}`;
  const v   = (day, id) => vals[k(day, id)] ?? 0;
  const setV = (day, id, raw) => {
    const h = habits.find(h => h.id === id); if (!h) return;
    const n = Math.max(0, Math.min(h.target * 2, parseInt(raw) || 0));
    setVals(p => { const next = { ...p, [k(day,id)]: n }; try { localStorage.setItem("habit_vals_v2", JSON.stringify(next)); } catch {} return next; });
  };
  const setNote = (day, text) => {
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

  const prevMonth = () => { setMonth(m => { if(m===0){setYear(y=>y-1);return 11;} return m-1; }); setOpen(null); };
  const nextMonth = () => { setMonth(m => { if(m===11){setYear(y=>y+1);return 0;} return m+1; }); setOpen(null); };

  const gridCols = `repeat(${Math.min(habits.length, 6)}, 1fr)`;

  const btnStyle = (active) => ({
    border: `1px solid ${theme.border}`, borderRadius: 10, cursor: "pointer",
    background: active ? (dark?"#252a3d":"#e2e8f0") : theme.surface,
    color: active ? theme.text : theme.text2, fontWeight: active ? 700 : 500,
    fontSize: 13, transition: "all 0.2s", padding: "8px 18px",
  });

  if (!unlocked) return (
    <div style={{ minHeight:"100vh", width:"100%", background:theme.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"system-ui,sans-serif" }}>
      <div style={{ textAlign:"center", width:280 }}>
        <div style={{ width:64, height:64, borderRadius:20, background:dark?"#1e2235":"#e2e8f0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, margin:"0 auto 16px" }}>🔒</div>
        <h2 style={{ margin:"0 0 6px", fontSize:24, fontWeight:800, color:theme.text }}>Habit Tracker</h2>
        <p style={{ color:theme.text2, fontSize:13, marginBottom:36 }}>Enter your PIN to continue</p>
        <div style={{ display:"flex", gap:16, justifyContent:"center", marginBottom:36 }}>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${pinError?"#ef4444":theme.border}`, background:pin.length>i?(pinError?"#ef4444":"#3b82f6"):"transparent", transition:"all 0.2s" }} />
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
          {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i)=>(
            <button key={i} onClick={()=>{ if(d==="⌫"){setPin(p=>p.slice(0,-1));setPinError(false);} else if(d!=="")handlePin(String(d)); }} disabled={d===""} style={{ height:64, borderRadius:14, border:`1px solid ${theme.border}`, background:d===""?"transparent":theme.surface, color:theme.text, fontSize:d==="⌫"?20:22, fontWeight:700, cursor:d===""?"default":"pointer" }}>{d}</button>
          ))}
        </div>
        {pinError && <p style={{ color:"#ef4444", fontSize:13, marginTop:16 }}>Incorrect PIN. Try again.</p>}
        <button onClick={()=>setDark(d=>!d)} style={{ marginTop:24, background:"none", border:"none", color:theme.text2, cursor:"pointer", fontSize:13 }}>{dark?"☀️ Light mode":"🌙 Dark mode"}</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", width:"100%", background:theme.bg, color:theme.text, fontFamily:"system-ui,sans-serif", boxSizing:"border-box", margin:0, padding:0 }}>

      {/* Manage Habits Modal */}
      {showManage && (
        <div style={{ position:"fixed", inset:0, background:theme.overlay, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }} onClick={()=>setShowManage(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:theme.surface, border:`1px solid ${theme.border}`, borderRadius:20, width:"100%", maxWidth:560, maxHeight:"85vh", overflow:"auto", padding:32 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
              <h2 style={{ margin:0, fontSize:20, fontWeight:800 }}>⚙️ Manage Goals</h2>
              <button onClick={()=>setShowManage(false)} style={{ background:"none", border:"none", color:theme.text2, fontSize:22, cursor:"pointer" }}>✕</button>
            </div>

            {/* Existing habits */}
            <div style={{ marginBottom:28 }}>
              <p style={{ margin:"0 0 12px", fontSize:11, fontWeight:700, letterSpacing:"0.1em", color:theme.text2 }}>CURRENT GOALS</p>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {habits.map(h=>(
                  <div key={h.id} style={{ display:"flex", alignItems:"center", gap:12, background:theme.surface2, border:`1px solid ${theme.border}`, borderRadius:12, padding:"12px 16px" }}>
                    <span style={{ fontSize:20 }}>{h.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700 }}>{h.label}</div>
                      <div style={{ fontSize:12, color:theme.text2 }}>Target: {h.target}/day</div>
                    </div>
                    <div style={{ width:10, height:10, borderRadius:"50%", background:h.color }} />
                    <button onClick={()=>deleteHabit(h.id)} style={{ background:"#ef444420", border:"1px solid #ef444440", borderRadius:8, color:"#ef4444", cursor:"pointer", padding:"5px 12px", fontSize:13, fontWeight:700 }}>Delete</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add new */}
            <div style={{ borderTop:`1px solid ${theme.border}`, paddingTop:24 }}>
              <p style={{ margin:"0 0 16px", fontSize:11, fontWeight:700, letterSpacing:"0.1em", color:theme.text2 }}>ADD NEW GOAL</p>

              {/* Icon picker */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:12, fontWeight:600, color:theme.text2, marginBottom:8 }}>Icon</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {ICONS.map(ic=>(
                    <button key={ic} onClick={()=>setNewIcon(ic)} style={{ width:38, height:38, borderRadius:10, border:`2px solid ${newIcon===ic?"#3b82f6":theme.border}`, background:newIcon===ic?(dark?"#1e3a5f":"#dbeafe"):theme.surface2, fontSize:18, cursor:"pointer" }}>{ic}</button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:12, fontWeight:600, color:theme.text2, marginBottom:8 }}>Color</div>
                <div style={{ display:"flex", gap:8 }}>
                  {COLORS.map(c=>(
                    <button key={c} onClick={()=>setNewColor(c)} style={{ width:28, height:28, borderRadius:"50%", background:c, border:`3px solid ${newColor===c?theme.text:"transparent"}`, cursor:"pointer" }} />
                  ))}
                </div>
              </div>

              {/* Label + target */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 100px", gap:10, marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:theme.text2, marginBottom:8 }}>Goal Name</div>
                  <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} placeholder="e.g. Read Books" style={{ width:"100%", background:theme.surface2, border:`1px solid ${theme.border}`, borderRadius:10, color:theme.text, padding:"10px 14px", fontSize:14, boxSizing:"border-box", outline:"none" }} />
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:theme.text2, marginBottom:8 }}>Daily Target</div>
                  <input type="number" min={1} value={newTarget} onChange={e=>setNewTarget(parseInt(e.target.value)||1)} style={{ width:"100%", background:theme.surface2, border:`1px solid ${theme.border}`, borderRadius:10, color:theme.text, padding:"10px 14px", fontSize:14, boxSizing:"border-box", outline:"none" }} />
                </div>
              </div>

              <button onClick={addHabit} disabled={!newLabel.trim()} style={{ width:"100%", padding:"12px", borderRadius:12, border:"none", background:newLabel.trim()?"#3b82f6":"#334155", color:"white", fontWeight:800, fontSize:15, cursor:newLabel.trim()?"pointer":"default" }}>
                + Add Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <div style={{ background:theme.surface, borderBottom:`1px solid ${theme.border}`, padding:"0 32px", display:"flex", alignItems:"center", justifyContent:"space-between", height:60, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:20 }}>🎯</span>
          <span style={{ fontSize:16, fontWeight:800 }}>Habit Tracker</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={()=>setView("calendar")} style={btnStyle(view==="calendar")}>📆 Calendar</button>
          <button onClick={()=>setView("stats")}    style={btnStyle(view==="stats")}>📈 Stats</button>
          <button onClick={()=>setShowManage(true)} style={{ ...btnStyle(false), color:"#3b82f6", borderColor:"#3b82f633" }}>⚙️ Goals</button>
          <button onClick={()=>setDark(d=>!d)} style={{ width:38, height:38, borderRadius:10, border:`1px solid ${theme.border}`, background:theme.surface, cursor:"pointer", fontSize:17, display:"flex", alignItems:"center", justifyContent:"center" }}>{dark?"☀️":"🌙"}</button>
        </div>
      </div>

      <div style={{ padding:"32px 32px 60px" }}>

        {/* Month nav + progress bars */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16, marginBottom:32 }}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <button onClick={prevMonth} style={{ width:38, height:38, borderRadius:10, border:`1px solid ${theme.border}`, background:theme.surface, color:theme.text, cursor:"pointer", fontSize:20, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
            <span style={{ fontSize:26, fontWeight:800 }}>{MONTHS[month]} {year}</span>
            <button onClick={nextMonth} style={{ width:38, height:38, borderRadius:10, border:`1px solid ${theme.border}`, background:theme.surface, color:theme.text, cursor:"pointer", fontSize:20, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
          </div>
          <div style={{ display:"flex", gap:12, flex:1, maxWidth:560 }}>
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:14, background:theme.surface, border:`1px solid ${theme.border}`, borderRadius:14, padding:"14px 20px" }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:theme.text2, marginBottom:6, fontWeight:700, letterSpacing:"0.06em" }}>MONTHLY</div>
                <div style={{ background:theme.track, borderRadius:99, height:8 }}>
                  <div style={{ background:"linear-gradient(90deg,#3b82f6,#8b5cf6)", width:`${overallPct}%`, height:8, borderRadius:99, transition:"width 0.5s" }} />
                </div>
              </div>
              <span style={{ fontSize:20, fontWeight:800, color:"#3b82f6", minWidth:44, textAlign:"right" }}>{overallPct}%</span>
            </div>
            {todayPct !== null && (
              <div style={{ flex:1, display:"flex", alignItems:"center", gap:14, background:theme.surface, border:`1px solid ${theme.border}`, borderRadius:14, padding:"14px 20px" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:theme.text2, marginBottom:6, fontWeight:700, letterSpacing:"0.06em" }}>TODAY</div>
                  <div style={{ background:theme.track, borderRadius:99, height:8 }}>
                    <div style={{ background:todayPct===100?"#22c55e":"linear-gradient(90deg,#f59e0b,#ec4899)", width:`${todayPct}%`, height:8, borderRadius:99, transition:"width 0.5s" }} />
                  </div>
                </div>
                <span style={{ fontSize:20, fontWeight:800, color:todayPct===100?"#22c55e":"#f59e0b", minWidth:44, textAlign:"right" }}>{todayPct}% {todayPct===100?"🔥":""}</span>
              </div>
            )}
          </div>
        </div>

        {/* Habit summary cards */}
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${habits.length},1fr)`, gap:12, marginBottom:36 }}>
          {habits.map(h=>{
            const total = dates.reduce((s,d)=>s+Math.min(v(d.day,h.id),h.target),0);
            const max   = dates.length*h.target;
            const p     = Math.round((total/max)*100);
            return (
              <div key={h.id} style={{ background:theme.surface, border:`1px solid ${theme.border}`, borderRadius:14, padding:"18px 16px", textAlign:"center" }}>
                <div style={{ fontSize:24, marginBottom:8 }}>{h.icon}</div>
                <div style={{ fontSize:11, fontWeight:700, color:theme.text2, marginBottom:10 }}>{h.label}</div>
                <div style={{ background:theme.track, borderRadius:99, height:5, marginBottom:8 }}>
                  <div style={{ background:h.color, width:`${p}%`, height:5, borderRadius:99, transition:"width 0.4s" }} />
                </div>
                <div style={{ fontSize:16, fontWeight:800, color:h.color }}>{p}%</div>
                <div style={{ fontSize:11, color:theme.text3, marginTop:3 }}>{total}/{max}</div>
              </div>
            );
          })}
        </div>

        {view==="calendar" ? (
          <>
            <div style={{ display:"grid", gridTemplateColumns:`120px 1fr`, gap:0, marginBottom:10 }}>
              <div />
              <div style={{ display:"grid", gridTemplateColumns:gridCols, gap:16, paddingRight:20 }}>
                {habits.map(h=>(
                  <div key={h.id} style={{ textAlign:"center", fontSize:11, fontWeight:700, color:theme.text3 }}>{h.icon} {h.label}</div>
                ))}
              </div>
            </div>

            {weeks.map((week,wi)=>(
              <div key={wi} style={{ marginBottom:36 }}>
                <div style={{ fontSize:11, fontWeight:700, color:theme.text3, letterSpacing:"0.1em", margin:"12px 0 10px" }}>
                  WEEK {wi+1} · {MONTHS[month].slice(0,3)} {week[0].day}–{week[week.length-1].day}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {week.map(d=>{
                    const pct     = dayPct(d.day);
                    const perfect = pct===100;
                    const isOpen  = open===`${year}-${month}-${d.day}`;
                    const openKey = `${year}-${month}-${d.day}`;
                    const isToday = d.day===now.getDate()&&month===now.getMonth()&&year===now.getFullYear();
                    const hasNote = !!(notes[nk(d.day)]?.trim());
                    return (
                      <div key={d.day}>
                        <div onClick={()=>setOpen(isOpen?null:openKey)} style={{ display:"grid", gridTemplateColumns:"120px 1fr auto", alignItems:"center", gap:16, background:perfect?(dark?"#0c1f14":"#f0fdf4"):theme.surface, border:`1px solid ${perfect?(dark?"#16a34a44":"#bbf7d0"):isOpen?"#3b82f633":isToday?"#3b82f655":theme.border}`, borderRadius:isOpen?"14px 14px 0 0":14, padding:"14px 20px", cursor:"pointer", userSelect:"none", transition:"all 0.15s" }}>
                          <div>
                            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                              <span style={{ fontSize:11, fontWeight:700, color:theme.text2 }}>{d.dow.toUpperCase()}</span>
                              {isToday&&<span style={{ fontSize:9, fontWeight:800, color:"#3b82f6", background:dark?"#1e3a5f":"#dbeafe", padding:"1px 6px", borderRadius:99 }}>TODAY</span>}
                              {hasNote&&<span style={{ fontSize:11 }} title="Has note">📝</span>}
                            </div>
                            <div style={{ fontSize:22, fontWeight:800, color:perfect?"#16a34a":theme.text, lineHeight:1, marginBottom:6 }}>{d.day}</div>
                            <div style={{ background:theme.track, borderRadius:99, height:4, width:64 }}>
                              <div style={{ background:perfect?"#22c55e":"linear-gradient(90deg,#3b82f6,#8b5cf6)", width:`${pct}%`, height:4, borderRadius:99, transition:"width 0.3s" }} />
                            </div>
                            <div style={{ fontSize:10, color:perfect?"#16a34a":theme.text3, fontWeight:700, marginTop:3 }}>{pct}% {perfect?"🔥":""}</div>
                          </div>
                          <div style={{ display:"grid", gridTemplateColumns:gridCols, gap:16, alignItems:"center" }}>
                            {habits.map(h=>{
                              const val_ = v(d.day,h.id);
                              const p    = Math.min(100,Math.round((val_/h.target)*100));
                              return (
                                <div key={h.id} style={{ display:"flex", flexDirection:"column", gap:5 }}>
                                  <div style={{ background:theme.track, borderRadius:99, height:6 }}>
                                    <div style={{ background:p>=100?h.color:`${h.color}55`, width:`${p}%`, height:6, borderRadius:99, transition:"width 0.2s" }} />
                                  </div>
                                  <div style={{ textAlign:"center", fontSize:12, fontWeight:700, color:p>=100?h.color:theme.text3 }}>{val_}/{h.target}</div>
                                </div>
                              );
                            })}
                          </div>
                          <div style={{ fontSize:14, color:theme.text3, transition:"transform 0.2s", transform:isOpen?"rotate(180deg)":"none" }}>▾</div>
                        </div>

                        {isOpen&&(
                          <div style={{ background:theme.input, border:`1px solid #3b82f633`, borderTop:"none", borderRadius:"0 0 14px 14px", padding:"24px 24px 28px" }}>
                            <div style={{ display:"grid", gridTemplateColumns:gridCols, gap:20, marginBottom:24 }}>
                              {habits.map(h=>{
                                const cur = v(d.day,h.id);
                                const p   = Math.min(100,Math.round((cur/h.target)*100));
                                return (
                                  <div key={h.id} style={{ display:"flex", flexDirection:"column", gap:10 }}>
                                    <div style={{ fontSize:12, fontWeight:700, color:theme.text2 }}>{h.icon} {h.label}</div>
                                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                      <button onClick={e=>{e.stopPropagation();setV(d.day,h.id,cur-1);}} style={{ width:28, height:28, borderRadius:8, border:`1px solid ${theme.border}`, background:theme.surface, color:theme.text, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
                                      <input type="number" value={cur} onClick={e=>e.stopPropagation()} onChange={e=>setV(d.day,h.id,e.target.value)} style={{ width:44, textAlign:"center", background:theme.surface, border:`1px solid ${theme.border}`, borderRadius:8, color:theme.text, padding:"5px 2px", fontSize:14, fontWeight:700 }} />
                                      <button onClick={e=>{e.stopPropagation();setV(d.day,h.id,cur+1);}} style={{ width:28, height:28, borderRadius:8, border:`1px solid ${theme.border}`, background:theme.surface, color:theme.text, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
                                    </div>
                                    <div style={{ background:theme.track, borderRadius:99, height:6 }}>
                                      <div style={{ background:h.color, width:`${p}%`, height:6, borderRadius:99, transition:"width 0.2s" }} />
                                    </div>
                                    <div style={{ fontSize:12, color:h.color, fontWeight:700 }}>{p}%</div>
                                  </div>
                                );
                              })}
                            </div>
                            <div style={{ borderTop:`1px solid ${theme.border}`, paddingTop:20 }}>
                              <div style={{ fontSize:12, fontWeight:700, color:theme.text2, marginBottom:10 }}>📝 Daily Note</div>
                              <textarea placeholder="What went well? What did you miss and why?" value={notes[nk(d.day)]??""} onClick={e=>e.stopPropagation()} onChange={e=>setNote(d.day,e.target.value)} rows={3} style={{ width:"100%", background:theme.surface, border:`1px solid ${theme.border}`, borderRadius:10, color:theme.text, padding:"12px 14px", fontSize:13, resize:"vertical", outline:"none", fontFamily:"system-ui,sans-serif", boxSizing:"border-box", lineHeight:1.6 }} />
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
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ background:theme.surface, border:`1px solid ${theme.border}`, borderRadius:16, padding:"28px 32px" }}>
              <p style={{ margin:"0 0 24px", fontSize:11, fontWeight:700, letterSpacing:"0.12em", color:theme.text2 }}>HABIT BREAKDOWN — {MONTHS[month].toUpperCase()} {year}</p>
              {habits.map(h=>{
                const total = dates.reduce((s,d)=>s+Math.min(v(d.day,h.id),h.target),0);
                const max   = dates.length*h.target;
                const p     = Math.round((total/max)*100);
                return (
                  <div key={h.id} style={{ marginBottom:22 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:14, marginBottom:8 }}>
                      <span style={{ fontWeight:600 }}>{h.icon} {h.label}</span>
                      <span style={{ color:h.color, fontWeight:700 }}>{total}/{max} · {p}%</span>
                    </div>
                    <div style={{ background:theme.track, borderRadius:99, height:8 }}>
                      <div style={{ background:h.color, width:`${p}%`, height:8, borderRadius:99, transition:"width 0.4s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ background:theme.surface, border:`1px solid ${theme.border}`, borderRadius:16, padding:"28px 32px" }}>
              <p style={{ margin:"0 0 20px", fontSize:11, fontWeight:700, letterSpacing:"0.12em", color:theme.text2 }}>DAILY HEATMAP</p>
              <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                {dates.map((d,i)=>{
                  const p  = dayPct(d.day);
                  const bg = dark?(p===0?"#161925":p<30?"#1e3a5f":p<60?"#1d4ed8":p<100?"#2563eb":"#16a34a"):(p===0?"#f1f5f9":p<30?"#dbeafe":p<60?"#93c5fd":p<100?"#3b82f6":"#16a34a");
                  return <div key={i} title={`${d.day}: ${p}%`} style={{ width:40, height:40, borderRadius:10, background:bg, border:`1px solid ${theme.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:p>20?"white":theme.text3, fontWeight:800 }}>{d.day}</div>;
                })}
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
              {[
                { label:"Perfect Days", val:dates.filter(d=>dayPct(d.day)===100).length, icon:"🔥", color:"#22c55e" },
                { label:"Days Started",  val:dates.filter(d=>dayScore(d.day)>0).length,   icon:"📆", color:"#3b82f6" },
                { label:"Units Done",    val:totalDone,                                    icon:"💪", color:"#8b5cf6" },
              ].map((item,i)=>(
                <div key={i} style={{ background:theme.surface, border:`1px solid ${theme.border}`, borderRadius:16, padding:"32px 24px", textAlign:"center" }}>
                  <div style={{ fontSize:32, marginBottom:10 }}>{item.icon}</div>
                  <div style={{ fontSize:36, fontWeight:800, color:item.color, marginBottom:6 }}>{item.val}</div>
                  <div style={{ fontSize:13, color:theme.text2 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}