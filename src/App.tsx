import { useState, useEffect, useRef, CSSProperties } from "react";

const sliderCSS = `
  input[type=range] {
    -webkit-appearance: none;
    appearance: none;
    height: 6px;
    border-radius: 3px;
    background: #e0e0e0;
    outline: none;
    padding: 0;
    margin: 6px 0;
    touch-action: none;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #39BAFF;
    cursor: grab;
    border: 2px solid #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.18);
    transition: background 0.15s;
  }
  input[type=range]::-webkit-slider-thumb:active {
    cursor: grabbing;
    background: #1a9fe0;
  }
  input[type=range]::-moz-range-thumb {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #39BAFF;
    cursor: grab;
    border: 2px solid #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.18);
  }
`;

// Prevents pinch-zoom / double-tap-zoom so the booking flow stays "stagnant" on mobile browsers.
const noZoomCSS = `
  html, body {
    touch-action: manipulation;
    -webkit-text-size-adjust: 100%;
    overscroll-behavior: none;
  }
`;

function SmoothSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function getValueFromClientX(clientX: number) {
    const rect = trackRef.current!.getBoundingClientRect();
    const pct = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    const raw = 100 + pct * 900;
    return Math.round(raw / 10) * 10;
  }

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    onChange(getValueFromClientX(e.clientX));
  }

  function onPointerMove(e: React.PointerEvent) {
    if (e.buttons !== 1) return;
    onChange(getValueFromClientX(e.clientX));
  }

  const pct = ((value - 100) / 900) * 100;

  return (
    <div
      ref={trackRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      style={{ position:"relative", height:36, display:"flex", alignItems:"center", cursor:"pointer", touchAction:"none", userSelect:"none" }}
    >
      {/* Track background */}
      <div style={{ position:"absolute", left:0, right:0, height:6, borderRadius:3, background:"#e0e0e0" }}/>
      {/* Track fill */}
      <div style={{ position:"absolute", left:0, width:`${pct}%`, height:6, borderRadius:3, background:BRAND }}/>
      {/* Thumb */}
      <div style={{ position:"absolute", left:`calc(${pct}% - 14px)`, width:28, height:28, borderRadius:"50%", background:BRAND, border:"2px solid #fff", boxShadow:"0 1px 4px rgba(0,0,0,0.2)", transition:"left 0.05s" }}/>
    </div>
  );
}

const CALENDAR_IDS: Record<string, string> = {
  window:   "00cf8acbe00531495c5f06a58442f491f13b3297d6b96ffeec34a9cd7250f683@group.calendar.google.com",
  pressure: "b4186fd3ecb4b0e45ab431f5a7da61e2ff535becf046677864ca37c1917f0b02@group.calendar.google.com",
  gutter:   "c520b50f8abd9a7249d4027e92466af3e1dc1c797a296adab325bfabfae3f145@group.calendar.google.com",
  clean1:   "7c032d849c7fbc0bfe9932c1f8eb854dbfab94f974e7a5fcf0249acbfad3c42a@group.calendar.google.com",
  clean2:   "7c032d849c7fbc0bfe9932c1f8eb854dbfab94f974e7a5fcf0249acbfad3c42a@group.calendar.google.com",
  clean4:   "7c032d849c7fbc0bfe9932c1f8eb854dbfab94f974e7a5fcf0249acbfad3c42a@group.calendar.google.com",
  accc:     "7c032d849c7fbc0bfe9932c1f8eb854dbfab94f974e7a5fcf0249acbfad3c42a@group.calendar.google.com",
};

const TIMEZONE = "America/Edmonton";
const BRAND = "#39BAFF";
const BRAND_DARK = "#1a9fe0";
const BRAND_LIGHT = "#e8f7ff";
const GOLD = "#f59e0b";
const GOLD_LIGHT = "#fef9c3";

// Booking window: 10:00 AM - 8:00 PM (10-hour span), 30-minute increments.
const DAY_START_MINS = 10 * 60;
const DAY_END_MINS = 20 * 60;

const PRICE_DURATION_MAP = [
  { min: 100,  max: 150,  label: "$100–$150",   durations: [30],       estLabel: "~30 min" },
  { min: 150,  max: 200,  label: "$150–$200",   durations: [30, 60],   estLabel: "30 min – 1 hr" },
  { min: 200,  max: 250,  label: "$200–$250",   durations: [60, 90],   estLabel: "1 – 1.5 hrs" },
  { min: 250,  max: 300,  label: "$250–$300",   durations: [90, 120],  estLabel: "1.5 – 2 hrs" },
  { min: 300,  max: 350,  label: "$300–$350",   durations: [120, 150], estLabel: "2 – 2.5 hrs" },
  { min: 350,  max: 400,  label: "$350–$400",   durations: [150, 180], estLabel: "2.5 – 3 hrs" },
  { min: 400,  max: 450,  label: "$400–$450",   durations: [180, 210], estLabel: "3 – 3.5 hrs" },
  { min: 450,  max: 500,  label: "$450–$500",   durations: [210, 240], estLabel: "3.5 – 4 hrs" },
  { min: 500,  max: 550,  label: "$500–$550",   durations: [240, 270], estLabel: "4 – 4.5 hrs" },
  { min: 550,  max: 600,  label: "$550–$600",   durations: [270, 300], estLabel: "4.5 – 5 hrs" },
  { min: 600,  max: 650,  label: "$600–$650",   durations: [300],      estLabel: "~5 hrs" },
  { min: 650,  max: 700,  label: "$650–$700",   durations: [300],      estLabel: "~5 hrs" },
  { min: 700,  max: 750,  label: "$700–$750",   durations: [300],      estLabel: "~5 hrs" },
  { min: 750,  max: 800,  label: "$750–$800",   durations: [300],      estLabel: "~5 hrs" },
  { min: 800,  max: 850,  label: "$800–$850",   durations: [300],      estLabel: "~5 hrs" },
  { min: 850,  max: 900,  label: "$850–$900",   durations: [300],      estLabel: "~5 hrs" },
  { min: 900,  max: 950,  label: "$900–$950",   durations: [300],      estLabel: "~5 hrs" },
  { min: 950,  max: 1001, label: "$950–$1,000", durations: [300],      estLabel: "~5 hrs" },
];

function getPriceBracket(price: number) {
  return PRICE_DURATION_MAP.find(b => price >= b.min && price < b.max) || PRICE_DURATION_MAP[PRICE_DURATION_MAP.length - 1];
}

interface ServiceDef {
  name: string; category: string; contractors: number; icon: string;
  desc: string; durRange?: string; maxMins?: number; price?: string; durations?: number[];
}

const SERVICES: Record<string, ServiceDef> = {
  window:  { name: "Window Cleaning",           category: "one-time",     contractors: 3, icon: "🪟", desc: "Interior & exterior, streak-free results", durRange: "30 min – 5 hrs", maxMins: 300 },
  pressure:{ name: "Pressure Washing",          category: "one-time",     contractors: 2, icon: "💦", desc: "Driveways, siding, patios & decks",        durRange: "30 min – 5 hrs", maxMins: 300 },
  gutter:  { name: "Gutter Cleaning",           category: "one-time",     contractors: 2, icon: "🍂", desc: "Full gutter flush & downspout clear-out",   durRange: "30 min – 5 hrs", maxMins: 300 },
  clean1:  { name: "Monthly Cleaning",          category: "subscription", contractors: 2, icon: "🧹", desc: "1 clean/mo · 2 hrs per visit",             price: "$150/mo",  durations: [120] },
  clean2:  { name: "Bi-Weekly Cleaning",        category: "subscription", contractors: 2, icon: "🧹", desc: "2 cleans/mo · 2 hrs per visit",            price: "$250/mo",  durations: [120] },
  clean4:  { name: "Weekly Cleaning",           category: "subscription", contractors: 2, icon: "🧹", desc: "4 cleans/mo · 2 hrs per visit",            price: "$500/mo",  durations: [120] },
  accc:    { name: "AllClean Care Club (ACCC)", category: "premium",      contractors: 3, icon: "⭐", desc: "Priority scheduling, dedicated team, full home care", price: "$1,000/mo", durations: [120] },
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_LABELS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function toMins(str: string) { const [h,m]=str.split(":").map(Number); return h*60+m; }
function fromMins(mins: number) { const h=Math.floor(mins/60),m=mins%60,ampm=h>=12?"PM":"AM"; return `${h%12||12}:${String(m).padStart(2,"0")} ${ampm}`; }
function fmtDur(m: number) { if(m<60) return `${m} min`; if(m%60===0) return `${m/60} hr`; return `${Math.floor(m/60)}h ${m%60}m`; }
function toDateKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function maxContractors(selected: Set<string>) { let max=0; selected.forEach(id=>{ const c=SERVICES[id]?.contractors||1; if(c>max) max=c; }); return max||2; }

function getDurationsForService(id: string, customPrice: number): number[] {
  const svc = SERVICES[id];
  if (svc.durations) return svc.durations;
  return getPriceBracket(customPrice).durations.filter(d => d <= (svc.maxMins||300));
}

function allDurations(selected: Set<string>, windowPrice: number, pressurePrice: number, gutterPrice: number): number[] {
  const hasW=selected.has("window"), hasP=selected.has("pressure"), hasG=selected.has("gutter");
  const set=new Set<number>();
  const wDurs=hasW?getPriceBracket(windowPrice).durations:[];
  const pDurs=hasP?getPriceBracket(pressurePrice).durations:[];
  const gDurs=hasG?getPriceBracket(gutterPrice).durations:[];
  // combine all one-time durations additively
  const oneTimeCombos: number[] = [];
  if(!hasW&&!hasP&&!hasG) { /* none */ }
  else {
    const bases = [hasW?wDurs:[0], hasP?pDurs:[0], hasG?gDurs:[0]];
    for(const a of bases[0]) for(const b of bases[1]) for(const c of bases[2]){
      const t=Math.round((a+b+c)/30)*30; if(t<=300&&t>0) oneTimeCombos.push(t);
    }
  }
  oneTimeCombos.forEach(d=>set.add(d));
  [...selected].filter(id=>!["window","pressure","gutter"].includes(id))
    .forEach(id=>{ const svc=SERVICES[id]; if(svc.durations) svc.durations.forEach(d=>{const s=Math.round(d/30)*30;if(s<=300&&s>0)set.add(s);}); });
  return [...set].sort((a,b)=>a-b);
}

interface BookingData {
  selected: Set<string>; date: Date; time: string; endTime: string;
  durationMins: number; customPrice: number; windowPrice: number; pressurePrice: number; gutterPrice: number;
}
interface CustomerData { name: string; phone: string; email: string; address: string; salesRep: string; notes: string; }

// Builds the calendar event and asks our own server (/api/create-booking) to create it.
// The server holds the authorization (refresh token), so reps never need their own
// Google sign-in or calendar permissions to push a booking — same pattern as availability.
async function pushToGoogleCalendar(booking: BookingData, customer: CustomerData) {
  const pad = (n: number) => String(n).padStart(2,"0");
  const d = booking.date;
  function pt(str: string) {
    const [t,ap]=str.split(" "); let [h,m]=t.split(":").map(Number);
    if(ap==="PM"&&h!==12) h+=12; if(ap==="AM"&&h===12) h=0; return {h,m};
  }
  const {h:sh,m:sm}=pt(booking.time), {h:eh,m:em}=pt(booking.endTime);
  const dateStr=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const subPrices: Record<string,number> = {clean1:150,clean2:250,clean4:500,accc:1000};
  let totalPrice=0;
  if(booking.selected.has("window")) totalPrice+=booking.windowPrice||200;
  if(booking.selected.has("pressure")) totalPrice+=booking.pressurePrice||200;
  if(booking.selected.has("gutter")) totalPrice+=booking.gutterPrice||200;
  [...booking.selected].filter(id=>!["window","pressure","gutter"].includes(id)).forEach(id=>{totalPrice+=subPrices[id]||0;});
  const serviceNames=[...booking.selected].map(id=>SERVICES[id]?.name).join(", ");
  const event = {
    summary: customer.name,
    location: customer.address,
    description: `Services: ${serviceNames}\n\nDuration: ${fmtDur(booking.durationMins)}\n\nTotal Price: $${totalPrice}\n\nCustomer: ${customer.name}\n\nPhone: ${customer.phone}\n\nSales Rep: ${customer.salesRep}${customer.email?`\n\nEmail: ${customer.email}`:""}${customer.notes?"\n\nNotes: "+customer.notes:""}`,
    start: { dateTime: `${dateStr}T${pad(sh)}:${pad(sm)}:00`, timeZone: TIMEZONE },
    end:   { dateTime: `${dateStr}T${pad(eh)}:${pad(em)}:00`, timeZone: TIMEZONE },
  };
  const calIds = new Set<string>();
  [...booking.selected].forEach(id => { if(CALENDAR_IDS[id]) calIds.add(CALENDAR_IDS[id]); });

  const res = await fetch("/api/create-booking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ calendarIds: [...calIds], event }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Booking push failed (${res.status})`);
  }
}

// Fetches real events from Google Calendar for the given calendars/date range and
// buckets them by date (YYYY-MM-DD) with start/end expressed as minutes-from-midnight,
// so the booking grid can mark real busy times as unavailable.
//
// This calls our own serverless function (/api/availability) instead of asking the
// browser to sign into Google directly — the server holds a stored refresh token, so
// reps never see a Google sign-in prompt just to view availability (Calendly-style).
async function fetchBusyEvents(
  calendarIds: string[],
  timeMinISO: string,
  timeMaxISO: string
): Promise<Record<string, { start: number; end: number }[]>> {
  const url = `/api/availability?calendarIds=${encodeURIComponent(calendarIds.join(","))}&timeMin=${encodeURIComponent(timeMinISO)}&timeMax=${encodeURIComponent(timeMaxISO)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Availability check failed (${res.status})`);
  }
  const data = await res.json();
  const items: any[] = data.events || [];

  const byDate: Record<string, { start: number; end: number }[]> = {};
  items.forEach((ev: any) => {
    const s = ev.start?.dateTime, e = ev.end?.dateTime;
    if (!s || !e) return; // skip all-day events, which have no specific time
    const sd = new Date(s), ed = new Date(e);
    const dk = toDateKey(sd);
    const startMins = sd.getHours() * 60 + sd.getMinutes();
    const endMins = ed.getHours() * 60 + ed.getMinutes();
    if (!byDate[dk]) byDate[dk] = [];
    byDate[dk].push({ start: startMins, end: endMins });
  });
  return byDate;
}

function getSlotsAvail(_dateKey: string, mc: number, startMins: number, durMins: number, busy: { start: number; end: number }[]) {
  const end = startMins + durMins;
  let occ = 0;
  for (const b of busy) {
    if (startMins < b.end && end > b.start) occ++; // count how many existing bookings overlap this window
  }
  return Math.max(0, mc - occ); // still selectable as long as a contractor is free; fully blocked only once all are committed
}

function getDayAvail(dateKey: string, mc: number, dur: number, busy: { start: number; end: number }[]) {
  let anyFree=false, anyPartial=false;
  for(let s=DAY_START_MINS;s<=DAY_END_MINS;s+=60){
    const av=getSlotsAvail(dateKey,mc,s,dur,busy);
    if(av>=mc)anyFree=true;else if(av>0)anyPartial=true;
  }
  return anyFree?"free":anyPartial?"partial":"busy";
}

const S: Record<string, CSSProperties> = {
  app:          { maxWidth:430, margin:"0 auto", background:"#fff", minHeight:"100vh", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", color:"#1a1a1a", border:"2px solid #1a1a1a", borderRadius:16, overflow:"hidden", boxSizing:"border-box", touchAction:"manipulation" },
  header:       { background:BRAND, padding:"18px 20px 22px", textAlign:"center" },
  h1:           { fontSize:18, fontWeight:700, color:"#fff", letterSpacing:1.2, margin:0 },
  tagline:      { fontSize:12, color:"rgba(255,255,255,0.85)", marginTop:3 },
  stepsBar:     { display:"flex", padding:"12px 20px", borderBottom:"1px solid #e0e0e0", background:"#fff", position:"sticky", top:0, zIndex:10 },
  content:      { padding:"18px 20px" },
  sectionTitle: { fontSize:15, fontWeight:700, marginBottom:10 },
  sectionSub:   { fontSize:12, color:"#666", marginBottom:12, marginTop:-6 },
  divider:      { height:1, background:"#e0e0e0", margin:"14px 0" },
  catLabel:     { fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, color:"#666", marginBottom:8 },
  calNav:       { width:30, height:30, border:"1px solid #e0e0e0", borderRadius:7, background:"#fff", cursor:"pointer", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center" },
  summaryCard:  { background:BRAND_LIGHT, border:`1.5px solid ${BRAND}`, borderRadius:14, padding:14, marginBottom:14 },
  summaryRow:   { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8, fontSize:13, gap:8 },
  gcalNote:     { background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, padding:"11px 13px", marginBottom:14, display:"flex", gap:9, fontSize:12, color:"#166534", lineHeight:1.4 },
  backBtn:      { background:"none", border:"1.5px solid #e0e0e0", color:"#666", borderRadius:14, padding:12, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", width:"100%", marginBottom:8 },
  input:        { width:"100%", border:"1.5px solid #e0e0e0", borderRadius:8, padding:"10px 13px", fontSize:14, color:"#1a1a1a", outline:"none", fontFamily:"inherit", background:"#fff", boxSizing:"border-box" },
};

const SF = {
  card:       (sel: boolean, prem: boolean): CSSProperties => ({ border:`2px solid ${sel?(prem?GOLD:BRAND):prem?GOLD:"#e0e0e0"}`, borderRadius:14, padding:13, marginBottom:10, cursor:"pointer", background:sel?(prem?GOLD_LIGHT:BRAND_LIGHT):"#fff", display:"flex", alignItems:"flex-start", gap:12, transition:"all 0.15s" }),
  svcIcon:    (sel: boolean, prem: boolean): CSSProperties => ({ width:42, height:42, borderRadius:10, flexShrink:0, fontSize:20, display:"flex", alignItems:"center", justifyContent:"center", background:sel?(prem?GOLD:BRAND):prem?GOLD_LIGHT:BRAND_LIGHT }),
  check:      (sel: boolean, prem: boolean): CSSProperties => ({ width:22, height:22, borderRadius:"50%", flexShrink:0, fontSize:12, display:"flex", alignItems:"center", justifyContent:"center", marginTop:2, border:`2px solid ${sel?(prem?GOLD:BRAND):"#e0e0e0"}`, background:sel?(prem?GOLD:BRAND):"transparent", color:"#fff" }),
  badge:      (type: string): CSSProperties => ({ fontSize:10, borderRadius:20, padding:"2px 7px", background:type==="blue"?BRAND_LIGHT:type==="gold"?GOLD_LIGHT:"#f5f7fa", color:type==="blue"?BRAND_DARK:type==="gold"?"#92400e":"#666" }),
  durPill:    (sel: boolean): CSSProperties => ({ border:`1.5px solid ${sel?BRAND:"#e0e0e0"}`, borderRadius:20, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer", color:sel?"#fff":"#666", background:sel?BRAND:"#fff", marginRight:6, marginBottom:6, display:"inline-block" }),
  syncBanner: (syncing: boolean): CSSProperties => ({ background:syncing?"#fefce8":BRAND_LIGHT, border:`1px solid ${syncing?"#fde68a":BRAND}`, borderRadius:8, padding:"10px 12px", marginBottom:14, display:"flex", alignItems:"center", gap:8, fontSize:12 }),
  timeSlot:   (type: string, sel: boolean): CSSProperties => { const C: Record<string,{bg:string,color:string,border:string}> = {avail:{bg:sel?"#22c55e":"#dcfce7",color:sel?"#fff":"#166534",border:sel?"#16a34a":"#bbf7d0"},partial:{bg:sel?GOLD:"#fef9c3",color:sel?"#fff":"#854d0e",border:sel?"#d97706":"#fde68a"},busy:{bg:sel?"#ef4444":"#fee2e2",color:sel?"#fff":"#991b1b",border:sel?"#dc2626":"#fecaca"}}; const c=C[type]; return{borderRadius:8,padding:"9px 4px",textAlign:"center",fontSize:12,fontWeight:600,cursor:"pointer",background:c.bg,color:c.color,border:`1.5px solid ${c.border}`,transition:"all 0.12s"}; },
  ctaBtn:     (dis: boolean): CSSProperties => ({ width:"100%", background:dis?"#b0d9f5":BRAND, color:"#fff", border:"none", borderRadius:14, padding:15, fontSize:15, fontWeight:700, cursor:dis?"not-allowed":"pointer", fontFamily:"inherit" }),
  retryBtn:   (): CSSProperties => ({ border:"none", background:BRAND, color:"#fff", borderRadius:6, padding:"4px 10px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }),
};

function StepIndicator({ current }: { current: number }) {
  const steps=["Services","Schedule","Contact","Confirm"];
  return (
    <div style={S.stepsBar}>
      {steps.map((label,i)=>{
        const n=i+1,done=n<current,active=n===current;
        return (
          <div key={n} style={{display:"flex",alignItems:"center",flex:1}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,flex:1}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:done?"#22c55e":active?BRAND:"#e0e0e0",color:done||active?"#fff":"#666",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{done?"✓":n}</div>
              <div style={{fontSize:9,color:active?BRAND:"#666",fontWeight:active?700:500}}>{label}</div>
            </div>
            {n<steps.length&&<div style={{flex:1,height:2,background:done?"#22c55e":"#e0e0e0",marginBottom:14,alignSelf:"flex-start",marginTop:13}}/>}
          </div>
        );
      })}
    </div>
  );
}

function ServiceCard({ id, selected, onToggle }: { id: string; selected: boolean; onToggle: (id: string) => void }) {
  const svc=SERVICES[id], isPrem=svc.category==="premium", isOneTime=svc.category==="one-time";
  return (
    <div style={SF.card(selected,isPrem)} onClick={()=>onToggle(id)}>
      <div style={SF.svcIcon(selected,isPrem)}>{svc.icon}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:700,fontSize:14}}>{svc.name}</div>
        <div style={{fontSize:11,color:"#666",marginTop:2,lineHeight:1.4}}>{svc.desc}</div>
        <div style={{display:"flex",gap:6,marginTop:5,flexWrap:"wrap",justifyContent:"center"}}>
          {svc.price&&<span style={SF.badge(isPrem?"gold":"blue")}>{svc.price}</span>}
          {isOneTime&&<span style={SF.badge("gray")}>{svc.durRange}</span>}
          {!isOneTime&&!isPrem&&<span style={SF.badge("gray")}>2 hrs/visit</span>}
          {isPrem&&<span style={SF.badge("gray")}>Dedicated team</span>}
        </div>
      </div>
      <div style={SF.check(selected,isPrem)}>{selected?"✓":""}</div>
    </div>
  );
}

function CalendarPicker({ selected, durationMins, selectedDate, onSelectDate, gcalLoaded, busyMap, calDate, onMonthChange }: {
  selected: Set<string>; durationMins: number; selectedDate: Date|null;
  onSelectDate: (dt: Date, dk: string) => void; gcalLoaded: boolean;
  busyMap: Record<string, { start: number; end: number }[]>;
  calDate: Date; onMonthChange: (d: Date) => void;
}) {
  const today=new Date();today.setHours(0,0,0,0);
  const mc=maxContractors(selected);
  const y=calDate.getFullYear(),m=calDate.getMonth();
  const firstDay=new Date(y,m,1).getDay(),lastDay=new Date(y,m+1,0).getDate();
  function dotColor(dk: string){if(!gcalLoaded)return null;const av=getDayAvail(dk,mc,durationMins,busyMap[dk]||[]);return av==="free"?"#22c55e":av==="partial"?GOLD:"#ef4444";}
  return (
    <div style={{border:"1px solid #e0e0e0",borderRadius:14,overflow:"hidden",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",borderBottom:"1px solid #e0e0e0"}}>
        <button style={S.calNav} onClick={()=>onMonthChange(new Date(y,m-1,1))}>‹</button>
        <span style={{fontWeight:700,fontSize:14}}>{MONTHS[m]} {y}</span>
        <button style={S.calNav} onClick={()=>onMonthChange(new Date(y,m+1,1))}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:4,gap:2}}>
        {DAY_LABELS.map(d=><div key={d} style={{textAlign:"center",fontSize:10,fontWeight:700,color:"#666",padding:"6px 0"}}>{d}</div>)}
        {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`}/>)}
        {Array.from({length:lastDay}).map((_,i)=>{
          const day=i+1,dt=new Date(y,m,day),isPast=dt<today,isSun=dt.getDay()===0;
          const dk=toDateKey(dt),isSel=selectedDate&&dt.toDateString()===selectedDate.toDateString(),isTd=dt.toDateString()===today.toDateString();
          const dot=!isPast&&!isSun?dotColor(dk):null;
          return (
            <div key={day} onClick={()=>!isPast&&!isSun&&onSelectDate(dt,dk)}
              style={{textAlign:"center",padding:"6px 2px",fontSize:12,borderRadius:7,cursor:isPast||isSun?"default":"pointer",background:isSel?BRAND:"transparent",color:isSel?"#fff":isPast||isSun?"#ccc":isTd?BRAND:"#1a1a1a",fontWeight:isSel||isTd?700:400}}>
              {day}
              {dot&&<div style={{width:5,height:5,borderRadius:"50%",background:dot,margin:"1px auto 0"}}/>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimeSlots({ dateKey, selected, durationMins, selectedTime, onSelectTime, busy }: {
  dateKey: string; selected: Set<string>; durationMins: number;
  selectedTime: string|null; onSelectTime: (s: string, e: string) => void;
  busy: { start: number; end: number }[];
}) {
  const mc=maxContractors(selected);
  const slots: {s:number,av:number}[]=[];
  for(let s=DAY_START_MINS;s<=DAY_END_MINS;s+=30){slots.push({s,av:getSlotsAvail(dateKey,mc,s,durationMins,busy)});}
  const morning=slots.filter(x=>x.s<12*60),afternoon=slots.filter(x=>x.s>=12*60);
  function Group({label,items}:{label:string,items:{s:number,av:number}[]}){
    if(!items.length)return null;
    return (
      <div style={{marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:700,color:"#666",textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>{label}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
          {items.map(({s,av})=>{
            const sl=fromMins(s),el=fromMins(s+durationMins);
            const type=av===0?"busy":av<mc?"partial":"avail",isSel=selectedTime===sl;
            return (<div key={s} style={SF.timeSlot(type,isSel)} onClick={()=>onSelectTime(sl,el)}>{sl}</div>);
          })}
        </div>
      </div>
    );
  }
  return (
    <div>
      <Group label="Morning" items={morning}/><Group label="Afternoon" items={afternoon}/>
    </div>
  );
}

function CustomerForm({ customer, setCustomer, onBack, onNext, step3Ready }: {
  customer: CustomerData;
  setCustomer: React.Dispatch<React.SetStateAction<CustomerData>>;
  onBack: () => void;
  onNext: () => void;
  step3Ready: boolean;
}) {
  const fields = [
    { label:"Full name",       key:"name",     type:"text",  placeholder:"Jane Smith",                       required:true },
    { label:"Phone number",    key:"phone",    type:"tel",   placeholder:"(403) 555-0100",                   required:true },
    { label:"Email address",   key:"email",    type:"email", placeholder:"jane@email.com",                   required:false },
    { label:"Service address", key:"address",  type:"text",  placeholder:"123 Main St NW, Calgary, AB",      required:true },
    { label:"Sales rep name",  key:"salesRep", type:"text",  placeholder:"Who booked this lead?",             required:true },
  ];
  return (
    <div style={S.content}>
      <div style={S.sectionTitle}>Customer details</div>
      {fields.map(f=>(
        <div key={f.key} style={{marginBottom:12}}>
          <label style={{fontSize:11,fontWeight:700,color:"#666",textTransform:"uppercase" as const,letterSpacing:0.5,display:"block",marginBottom:5}}>
            {f.label}{!f.required?" (optional)":""}
          </label>
          <input
            style={S.input}
            type={f.type}
            placeholder={f.placeholder}
            value={customer[f.key as keyof CustomerData]}
            onChange={e=>setCustomer(p=>({...p,[f.key]:e.target.value}))}
          />
        </div>
      ))}
      <div style={{marginBottom:12}}>
        <label style={{fontSize:11,fontWeight:700,color:"#666",textTransform:"uppercase" as const,letterSpacing:0.5,display:"block",marginBottom:5}}>Notes (optional)</label>
        <textarea
          style={{...S.input,resize:"vertical"}}
          rows={2}
          placeholder="Gate code, access info, special requests..."
          value={customer.notes}
          onChange={e=>setCustomer(p=>({...p,notes:e.target.value}))}
        />
      </div>
      <button style={S.backBtn} onClick={onBack}>← Back</button>
      <button style={SF.ctaBtn(!step3Ready)} disabled={!step3Ready} onClick={onNext}>Continue →</button>
    </div>
  );
}

export default function AllCleanBooking() {
  const [step,setStep]                   = useState(1);
  const [selected,setSelected]           = useState(new Set<string>());
  const [customPrice]                    = useState(200);
  const [windowPrice,setWindowPrice]     = useState(200);
  const [pressurePrice,setPressurePrice] = useState(200);
  const [gutterPrice,setGutterPrice]     = useState(200);
  const [durationMins,setDurationMins]   = useState(60);
  const [date,setDate]                   = useState<Date|null>(null);
  const [dateKey,setDateKey]             = useState("");
  const [dateStr,setDateStr]             = useState("");
  const [time,setTime]                   = useState<string|null>(null);
  const [endTime,setEndTime]             = useState<string|null>(null);
  const [calDate,setCalDate]             = useState(()=>{const d=new Date();d.setDate(1);return d;});
  const [busyMap,setBusyMap]             = useState<Record<string,{start:number,end:number}[]>>({});
  const [gcalLoaded,setGcalLoaded]       = useState(false);
  const [gcalError,setGcalError]         = useState("");
  const [customer,setCustomer]           = useState<CustomerData>({name:"",phone:"",email:"",address:"",salesRep:"",notes:""});
  const [pushing,setPushing]             = useState(false);
  const [pushError,setPushError]         = useState("");

  // Lock the viewport so mobile browsers can't pinch/double-tap zoom the booking flow.
  useEffect(()=>{
    let meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
    if(!meta){
      meta = document.createElement("meta");
      meta.setAttribute("name","viewport");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content","width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no");
  },[]);

  function loadAvailability(){
    const calIds = new Set<string>();
    selected.forEach(id=>{ if(CALENDAR_IDS[id]) calIds.add(CALENDAR_IDS[id]); });
    if(calIds.size===0){ setGcalLoaded(true); setBusyMap({}); setGcalError(""); return; }
    setGcalLoaded(false);
    setGcalError("");
    const y=calDate.getFullYear(), m=calDate.getMonth();
    const timeMin=new Date(y,m,1).toISOString();
    const timeMax=new Date(y,m+1,1).toISOString();
    fetchBusyEvents([...calIds],timeMin,timeMax)
      .then(map=>{ setBusyMap(map); setGcalLoaded(true); })
      .catch(err=>{
        console.error(err);
        setBusyMap({});
        setGcalLoaded(true);
        setGcalError("Couldn't load live availability from Google Calendar — tap Retry.");
      });
  }

  useEffect(()=>{
    if(step!==2) return;
    loadAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[step,selected,calDate]);

  useEffect(()=>{
    const hasW=selected.has("window"),hasP=selected.has("pressure"),hasG=selected.has("gutter");
    const hasClean=["clean1","clean2","clean4","accc"].some(id=>selected.has(id));
    if(hasW||hasP||hasG){
      let total=0;
      if(hasW) total+=Math.max(...getPriceBracket(windowPrice).durations);
      if(hasP) total+=Math.max(...getPriceBracket(pressurePrice).durations);
      if(hasG) total+=Math.max(...getPriceBracket(gutterPrice).durations);
      setDurationMins(Math.min(total,300));
    } else if(hasClean){
      setDurationMins(120);
    }
  },[windowPrice,pressurePrice,gutterPrice,selected]);

  function toggleService(id: string){setSelected(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});setTime(null);setEndTime(null);}
  function handleSelectDate(dt: Date,dk: string){setDate(dt);setDateKey(dk);setTime(null);setEndTime(null);setDateStr(dt.toLocaleDateString("en-CA",{weekday:"short",month:"short",day:"numeric"}));}

  const durations=allDurations(selected,windowPrice,pressurePrice,gutterPrice);
  const step2Ready=date&&time;
  const step3Ready=!!(customer.name&&customer.phone&&customer.address&&customer.salesRep);

  async function handleConfirm() {
    setPushing(true); setPushError("");
    try {
      await pushToGoogleCalendar(
        {selected,date:date!,time:time!,endTime:endTime!,durationMins,customPrice,windowPrice,pressurePrice,gutterPrice},
        customer
      );
      setStep(5);
    } catch(err: any) {
      console.error(err);
      const detail = err?.message ? String(err.message) : "Unknown error";
      setPushError(`Couldn't create booking: ${detail}`);
    } finally { setPushing(false); }
  }

  function resetAll(){
    setStep(1);setSelected(new Set());setWindowPrice(200);setPressurePrice(200);
    setDurationMins(60);setDate(null);setDateKey("");setTime(null);setEndTime(null);
    setCustomer({name:"",phone:"",email:"",address:"",salesRep:"",notes:""});setPushError("");
    setGutterPrice(200);
    setCalDate(()=>{const d=new Date();d.setDate(1);return d;});
    setBusyMap({});setGcalError("");setGcalLoaded(false);
  }

  function Step1(){
    return (
      <div style={S.content}>
        <div style={S.sectionTitle}>Select services</div>
        <div style={S.sectionSub}>Pick one or more — tap to select</div>
        <div style={S.catLabel}>One-time services</div>
        {["window","pressure","gutter"].map(id=><ServiceCard key={id} id={id} selected={selected.has(id)} onToggle={toggleService}/>)}
        <div style={S.divider}/>
        <div style={S.catLabel}>Home Cleaning — subscription packages</div>
        {["clean1","clean2","clean4"].map(id=><ServiceCard key={id} id={id} selected={selected.has(id)} onToggle={toggleService}/>)}
        <div style={S.divider}/>
        <div style={S.catLabel}>Premium membership</div>
        <ServiceCard id="accc" selected={selected.has("accc")} onToggle={toggleService}/>
        <div style={S.divider}/>
        <div style={{...S.sectionTitle,marginBottom:8}}>Home / job value</div>
        <div style={{fontSize:12,color:"#666",marginBottom:12}}>Set a separate home value per selected service to estimate job duration</div>
        {selected.has("window")&&(
          <div style={{marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontSize:13}}>🪟</span>
              <span style={{fontSize:13,fontWeight:700}}>Window Cleaning</span>
              <span style={{marginLeft:"auto",fontSize:18,fontWeight:700,color:BRAND}}>${windowPrice}</span>
            </div>
            <SmoothSlider value={windowPrice} onChange={setWindowPrice}/>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#aaa",marginTop:2}}>
              <span>$100</span><span style={{color:BRAND_DARK,fontWeight:600}}>{getPriceBracket(windowPrice).estLabel} est.</span><span>$1,000</span>
            </div>
          </div>
        )}
        {selected.has("pressure")&&(
          <div style={{marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontSize:13}}>💦</span>
              <span style={{fontSize:13,fontWeight:700}}>Pressure Washing</span>
              <span style={{marginLeft:"auto",fontSize:18,fontWeight:700,color:BRAND}}>${pressurePrice}</span>
            </div>
            <SmoothSlider value={pressurePrice} onChange={setPressurePrice}/>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#aaa",marginTop:2}}>
              <span>$100</span><span style={{color:BRAND_DARK,fontWeight:600}}>{getPriceBracket(pressurePrice).estLabel} est.</span><span>$1,000</span>
            </div>
          </div>
        )}
        {selected.has("gutter")&&(
          <div style={{marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontSize:13}}>🍂</span>
              <span style={{fontSize:13,fontWeight:700}}>Gutter Cleaning</span>
              <span style={{marginLeft:"auto",fontSize:18,fontWeight:700,color:BRAND}}>${gutterPrice}</span>
            </div>
            <SmoothSlider value={gutterPrice} onChange={setGutterPrice}/>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#aaa",marginTop:2}}>
              <span>$100</span><span style={{color:BRAND_DARK,fontWeight:600}}>{getPriceBracket(gutterPrice).estLabel} est.</span><span>$1,000</span>
            </div>
          </div>
        )}
        {!selected.has("window")&&!selected.has("pressure")&&!selected.has("gutter")&&(
          <div style={{fontSize:12,color:"#aaa",marginBottom:14}}>Select Window Cleaning, Pressure Washing, or Gutter Cleaning above to set pricing.</div>
        )}
        <div style={{background:"#f5f7fa",borderRadius:8,padding:"10px 14px",marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:4}}>
            {PRICE_DURATION_MAP.map(b=>{
              const activeW=selected.has("window")&&windowPrice>=b.min&&windowPrice<b.max;
              const activeP=selected.has("pressure")&&pressurePrice>=b.min&&pressurePrice<b.max;
              const active=activeW||activeP;
              return (
                <div key={b.label} style={{textAlign:"center",padding:"4px 8px",borderRadius:6,background:active?BRAND_LIGHT:"transparent",border:active?`1px solid ${BRAND}`:"1px solid transparent"}}>
                  <div style={{fontWeight:700,fontSize:10,color:active?BRAND:"#666"}}>{b.label}</div>
                  <div style={{fontSize:10,color:"#888"}}>{b.estLabel}</div>
                </div>
              );
            })}
          </div>
        </div>
        {selected.size>0&&<div style={{fontSize:12,color:BRAND,fontWeight:600,marginBottom:10}}>{selected.size} service{selected.size>1?"s":""} selected</div>}
        <button style={SF.ctaBtn(selected.size===0)} disabled={selected.size===0} onClick={()=>setStep(2)}>Continue →</button>
      </div>
    );
  }

  function Step2(){
    return (
      <div style={S.content}>
        <div style={SF.syncBanner(!gcalLoaded)}>
          <div style={{width:8,height:8,borderRadius:"50%",background:!gcalLoaded?BRAND:gcalError?"#ef4444":"#22c55e",flexShrink:0}}/>
          <span style={{flex:1}}>
            {!gcalLoaded?"Syncing with Google Calendar…":gcalError?gcalError:"Google Calendar synced — availability is live"}
          </span>
          {gcalLoaded&&gcalError&&<button style={SF.retryBtn()} onClick={loadAvailability}>Retry</button>}
        </div>
        <div style={{...S.sectionTitle,marginBottom:4}}>Job duration</div>
        <div style={{fontSize:12,color:"#666",marginBottom:8}}>
          {(()=>{
            const hasW=selected.has("window"),hasP=selected.has("pressure"),hasG=selected.has("gutter");
            const parts=[];
            if(hasW) parts.push(`🪟 $${windowPrice} (${getPriceBracket(windowPrice).estLabel})`);
            if(hasP) parts.push(`💦 $${pressurePrice} (${getPriceBracket(pressurePrice).estLabel})`);
            if(hasG) parts.push(`🍂 $${gutterPrice} (${getPriceBracket(gutterPrice).estLabel})`);
            if(parts.length>1) return <span>{parts.join(" + ")} · combined</span>;
            if(hasW) return <span>Window Cleaning · <strong>${windowPrice}</strong> home · {getPriceBracket(windowPrice).estLabel} est.</span>;
            if(hasP) return <span>Pressure Washing · <strong>${pressurePrice}</strong> home · {getPriceBracket(pressurePrice).estLabel} est.</span>;
            if(hasG) return <span>Gutter Cleaning · <strong>${gutterPrice}</strong> home · {getPriceBracket(gutterPrice).estLabel} est.</span>;
            return <span>Based on home value</span>;
          })()}
        </div>
        <div style={{marginBottom:14,display:"flex",flexWrap:"wrap",justifyContent:"center",gap:6}}>
          {durations.length>0
            ?durations.map(d=><span key={d} style={SF.durPill(durationMins===d)} onClick={()=>{setDurationMins(d);setTime(null);setEndTime(null);}}>{fmtDur(d)}</span>)
            :<div style={{fontSize:12,color:"#888"}}>Select services on step 1 to see duration options.</div>}
        </div>
        <div style={{...S.sectionTitle,marginBottom:8}}>Select a date</div>
        <div style={{display:"flex",gap:12,marginBottom:10,flexWrap:"wrap"}}>
          {[["#22c55e","Available"],[GOLD,"Limited"],["#ef4444","Fully booked"]].map(([c,l])=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#666"}}>
              <div style={{width:9,height:9,borderRadius:"50%",background:c}}/>{l}
            </div>
          ))}
        </div>
        <CalendarPicker
          selected={selected}
          durationMins={durationMins}
          selectedDate={date}
          onSelectDate={handleSelectDate}
          gcalLoaded={gcalLoaded}
          busyMap={busyMap}
          calDate={calDate}
          onMonthChange={setCalDate}
        />
        {date&&(
          <>
            <div style={{...S.sectionTitle,marginBottom:6}}>Available times</div>
            <TimeSlots
              dateKey={dateKey}
              selected={selected}
              durationMins={durationMins}
              selectedTime={time}
              onSelectTime={(s,e)=>{setTime(s);setEndTime(e);}}
              busy={busyMap[dateKey]||[]}
            />
          </>
        )}
        <button style={S.backBtn} onClick={()=>setStep(1)}>← Back</button>
        <button style={SF.ctaBtn(!step2Ready)} disabled={!step2Ready} onClick={()=>setStep(3)}>Continue →</button>
      </div>
    );
  }

  function Step4(){
    const names=[...selected].map(id=>SERVICES[id]?.name).join(", ");
    const hasWindow=selected.has("window"),hasPressure=selected.has("pressure"),hasGutter=selected.has("gutter");
    const wBracket=getPriceBracket(windowPrice),pBracket=getPriceBracket(pressurePrice),gBracket=getPriceBracket(gutterPrice);
    const subPrices: Record<string,number>={clean1:150,clean2:250,clean4:500,accc:1000};
    let totalPrice=0;
    if(hasWindow) totalPrice+=windowPrice;
    if(hasPressure) totalPrice+=pressurePrice;
    if(hasGutter) totalPrice+=gutterPrice;
    [...selected].filter(id=>!["window","pressure","gutter"].includes(id)).forEach(id=>{totalPrice+=subPrices[id]||0;});
    const selectedDurLabel=(()=>{
      const parts=[];
      if(hasWindow) parts.push(`${fmtDur(Math.max(...wBracket.durations))} (window)`);
      if(hasPressure) parts.push(`${fmtDur(Math.max(...pBracket.durations))} (pressure)`);
      if(hasGutter) parts.push(`${fmtDur(Math.max(...gBracket.durations))} (gutter)`);
      if(parts.length>1) return parts.join(' + ') + ` = ${fmtDur(durationMins)}`;
      return fmtDur(durationMins);
    })();
    const calendarsList=(()=>{
      const ids=new Set<string>();
      [...selected].forEach(id=>{
        if(id==="window") ids.add("Window Cleaning");
        else if(id==="pressure") ids.add("Pressure Washing");
        else if(id==="gutter") ids.add("Gutter Cleaning");
        else ids.add("Home Cleaning");
      });
      return [...ids].join(", ");
    })();
    const homeValRow: [string,string][] = [];
    if(hasWindow&&hasPressure&&hasGutter) homeValRow.push(["Home values",`🪟 $${windowPrice} · 💦 $${pressurePrice} · 🍂 $${gutterPrice}`]);
    else if(hasWindow&&hasPressure) homeValRow.push(["Home values",`🪟 $${windowPrice} · 💦 $${pressurePrice}`]);
    else if(hasWindow&&hasGutter) homeValRow.push(["Home values",`🪟 $${windowPrice} · 🍂 $${gutterPrice}`]);
    else if(hasPressure&&hasGutter) homeValRow.push(["Home values",`💦 $${pressurePrice} · 🍂 $${gutterPrice}`]);
    else if(hasWindow) homeValRow.push(["Home value",`$${windowPrice} (${wBracket.label})`]);
    else if(hasPressure) homeValRow.push(["Home value",`$${pressurePrice} (${pBracket.label})`]);
    else if(hasGutter) homeValRow.push(["Home value",`$${gutterPrice} (${gBracket.label})`]);
    const rows: [string,string][]=[
      ["Services",names],
      ...homeValRow,
      ["Selected duration",selectedDurLabel],
      ["Date",dateStr],
      ["Start",time||""],
      ["End",endTime||""],
      ["Customer",customer.name],
      ["Sales rep",customer.salesRep],
      ["Address",customer.address],
      ["Phone",customer.phone],
      ...(customer.email?[["Email",customer.email] as [string,string]]:[]),
      ["Total price",`$${totalPrice.toLocaleString()}`],
      ["Pushing to",calendarsList],
    ];
    const dividerAfter = new Set(["Selected duration","Date","Sales rep","Total price"]);
    return (
      <div style={S.content}>
        <div style={S.sectionTitle}>Confirm booking</div>
        <div style={S.summaryCard}>
          {rows.map(([label,val],i)=>(
            <div key={label+i}>
              <div style={S.summaryRow}>
                <span style={{color:"#666",flexShrink:0}}>{label}</span>
                <span style={{fontWeight:600,textAlign:"right",maxWidth:"60%",color:label==="Home values"||label==="Home value"?BRAND:label==="Total price"?"#16a34a":label==="Pushing to"?"#7c3aed":"#1a1a1a",fontSize:label==="Pushing to"?11:13}}>{val}</span>
              </div>
              {dividerAfter.has(label)&&<div style={{height:1,background:"rgba(57,186,255,0.25)",margin:"8px 0"}}/>}
            </div>
          ))}
        </div>
        {pushError&&<div style={{background:"#fee2e2",border:"1px solid #fecaca",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#991b1b"}}>{pushError}</div>}
        <div style={S.gcalNote}>
          <span style={{fontSize:18,flexShrink:0}}>📅</span>
          <span>Confirming will push this booking directly to your AllClean calendars — no sign-in required.</span>
        </div>
        <button style={S.backBtn} onClick={()=>setStep(3)}>← Back</button>
        <button style={SF.ctaBtn(pushing)} disabled={pushing} onClick={handleConfirm}>
          {pushing?"Pushing to Google Calendar…":"✓ Confirm & Push to Google Calendar"}
        </button>
      </div>
    );
  }

  function Success(){
    const names=[...selected].map(id=>SERVICES[id]?.name).join(", ");
    const calendarsList=(()=>{
      const ids=new Set<string>();
      [...selected].forEach(id=>{
        if(id==="window") ids.add("Window Cleaning");
        else if(id==="pressure") ids.add("Pressure Washing");
        else if(id==="gutter") ids.add("Gutter Cleaning");
        else ids.add("Home Cleaning");
      });
      return [...ids].join(" · ");
    })();
    return (
      <div style={{...S.content,textAlign:"center",paddingTop:28}}>
        <div style={{width:68,height:68,background:"#22c55e",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,margin:"0 auto 18px",color:"#fff"}}>✓</div>
        <div style={{fontSize:21,fontWeight:700,marginBottom:7}}>Booking confirmed!</div>
        <div style={{fontSize:13,color:"#666",marginBottom:8,lineHeight:1.5}}>{names} booked for {customer.name} on {dateStr}, {time} – {endTime}.</div>
        <div style={{fontSize:12,color:"#7c3aed",fontWeight:600,marginBottom:22}}>📅 Added to: {calendarsList}</div>
        <button style={{background:BRAND,color:"#fff",border:"none",borderRadius:14,padding:13,fontSize:14,fontWeight:700,cursor:"pointer",width:"100%",fontFamily:"inherit"}} onClick={resetAll}>
          + New Booking
        </button>
      </div>
    );
  }

  return (
    <div style={S.app}>
      <style>{noZoomCSS}</style>
      <div style={S.header}>
        <h1 style={S.h1}>AllClean Solutions</h1>
        <p style={S.tagline}>Professional home services — book in seconds</p>
      </div>
      {step<5&&<StepIndicator current={step}/>}
      {step===1&&<Step1/>}
      {step===2&&<Step2/>}
      {step===3&&<CustomerForm customer={customer} setCustomer={setCustomer} onBack={()=>setStep(2)} onNext={()=>setStep(4)} step3Ready={step3Ready}/>}
      {step===4&&<Step4/>}
      {step===5&&<Success/>}
    </div>
  );
}
