import { useState, useEffect, CSSProperties } from "react";

const GOOGLE_CLIENT_ID = "394844552614-sc48keuui9dbajl91p05u441khr4c4oh.apps.googleusercontent.com";

const CALENDAR_IDS: Record<string, string> = {
  window:   "00cf8acbe00531495c5f06a58442f491f13b3297d6b96ffeec34a9cd7250f683@group.calendar.google.com",
  pressure: "b4186fd3ecb4b0e45ab431f5a7da61e2ff535becf046677864ca37c1917f0b02@group.calendar.google.com",
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

const PRICE_DURATION_MAP = [
  { min: 100, max: 150, label: "$100–$150", durations: [30],                 estLabel: "~30 min" },
  { min: 150, max: 200, label: "$150–$200", durations: [30, 60],             estLabel: "30 min – 1 hr" },
  { min: 200, max: 250, label: "$200–$250", durations: [60, 90],             estLabel: "1 – 1.5 hrs" },
  { min: 250, max: 300, label: "$250–$300", durations: [90, 120],            estLabel: "1.5 – 2 hrs" },
  { min: 300, max: 350, label: "$300–$350", durations: [120, 150],           estLabel: "2 – 2.5 hrs" },
  { min: 350, max: 400, label: "$350–$400", durations: [150, 180],           estLabel: "2.5 – 3 hrs" },
  { min: 400, max: 450, label: "$400–$450", durations: [180, 210],           estLabel: "3 – 3.5 hrs" },
  { min: 450, max: 501, label: "$450–$500", durations: [210, 240],           estLabel: "3.5 – 4 hrs" },
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

function allDurations(selected: Set<string>, windowPrice: number, pressurePrice: number, customPrice: number): number[] {
  const hasW=selected.has("window"), hasP=selected.has("pressure");
  const wDurs=hasW?getPriceBracket(windowPrice).durations:[];
  const pDurs=hasP?getPriceBracket(pressurePrice).durations:[];
  const set=new Set<number>();
  if(hasW&&hasP){
    wDurs.forEach(d1=>pDurs.forEach(d2=>{ const t=Math.round((d1+d2)/30)*30; if(t<=300&&t>0) set.add(t); }));
  } else {
    wDurs.forEach(d=>{ const s=Math.round(d/30)*30; if(s<=300&&s>0) set.add(s); });
    pDurs.forEach(d=>{ const s=Math.round(d/30)*30; if(s<=300&&s>0) set.add(s); });
  }
  [...selected].filter(id=>id!=="window"&&id!=="pressure")
    .forEach(id=>getDurationsForService(id,customPrice).forEach(d=>{ const s=Math.round(d/30)*30; if(s<=300&&s>0) set.add(s); }));
  return [...set].sort((a,b)=>a-b);
}

let gapiReady = false;

function loadGapiScript(): Promise<void> {
  return new Promise(resolve => {
    if ((window as any).gapi) return resolve();
    const s = document.createElement("script");
    s.src = "https://apis.google.com/js/api.js";
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

function loadGsiScript(): Promise<void> {
  return new Promise(resolve => {
    if ((window as any).google?.accounts) return resolve();
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

async function initGapi() {
  if (gapiReady) return;
  await loadGapiScript();
  await new Promise<void>(resolve => (window as any).gapi.load("client", resolve));
  await (window as any).gapi.client.init({
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
  });
  gapiReady = true;
}

async function getAccessToken(): Promise<string> {
  await loadGsiScript();
  return new Promise((resolve, reject) => {
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "https://www.googleapis.com/auth/calendar.events",
      callback: (resp: any) => { if(resp.error) reject(resp); else resolve(resp.access_token); },
    });
    client.requestAccessToken({ prompt: "consent" });
  });
}

interface BookingData {
  selected: Set<string>; date: Date; time: string; endTime: string;
  durationMins: number; customPrice: number; windowPrice: number; pressurePrice: number;
}
interface CustomerData { name: string; phone: string; email: string; address: string; notes: string; }

async function pushToGoogleCalendar(booking: BookingData, customer: CustomerData) {
  await initGapi();
  const token = await getAccessToken();
  (window as any).gapi.client.setToken({ access_token: token });
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
  [...booking.selected].filter(id=>!["window","pressure"].includes(id)).forEach(id=>{totalPrice+=subPrices[id]||0;});
  const serviceNames=[...booking.selected].map(id=>SERVICES[id]?.name).join(", ");
  const event = {
    summary: customer.name,
    location: customer.address,
    description: `Services: ${serviceNames}\n\nDuration: ${fmtDur(booking.durationMins)}\n\nTotal Price: $${totalPrice}\n\nCustomer: ${customer.name}\n\nPhone: ${customer.phone}${customer.notes?"\n\nNotes: "+customer.notes:""}`,
    start: { dateTime: `${dateStr}T${pad(sh)}:${pad(sm)}:00`, timeZone: TIMEZONE },
    end:   { dateTime: `${dateStr}T${pad(eh)}:${pad(em)}:00`, timeZone: TIMEZONE },
  };
  const calIds = new Set<string>();
  [...booking.selected].forEach(id => { if(CALENDAR_IDS[id]) calIds.add(CALENDAR_IDS[id]); });
  const results = await Promise.allSettled(
    [...calIds].map(calendarId => (window as any).gapi.client.calendar.events.insert({ calendarId, resource: event }))
  );
  const failed = results.filter((r: any) => r.status === "rejected");
  if (failed.length > 0) throw new Error(`${failed.length} calendar(s) failed`);
}

function getCalendarBusy(dateKey: string, mc: number) {
  const hash=dateKey.split("-").reduce((a,b)=>a+parseInt(b),0);
  const p=[
    [{start:"9:00",end:"11:00",slots:1},{start:"14:00",end:"16:00",slots:mc}],
    [{start:"8:00",end:"10:30",slots:2},{start:"13:00",end:"15:00",slots:1}],
    [{start:"10:00",end:"12:00",slots:mc},{start:"15:00",end:"17:00",slots:1}],
    [{start:"9:00",end:"11:30",slots:1}],
    [{start:"8:00",end:"9:00",slots:mc},{start:"11:00",end:"13:00",slots:1},{start:"14:00",end:"15:30",slots:2}],
    [],
    [{start:"10:00",end:"14:00",slots:mc}],
  ];
  return p[hash%p.length];
}

function getSlotsAvail(dateKey: string, mc: number, startMins: number, durMins: number) {
  const busy=getCalendarBusy(dateKey,mc), end=startMins+durMins;
  let occ=0;
  for(const b of busy){const bs=toMins(b.start),be=toMins(b.end);if(startMins<be&&end>bs)occ=Math.max(occ,b.slots);}
  return Math.max(0,mc-occ);
}

function getDayAvail(dateKey: string, mc: number, dur: number) {
  let anyFree=false, anyPartial=false;
  for(let s=8*60;s+dur<=18*60;s+=60){const av=getSlotsAvail(dateKey,mc,s,dur);if(av>=mc)anyFree=true;else if(av>0)anyPartial=true;}
  return anyFree?"free":anyPartial?"partial":"busy";
}

const S: Record<string, CSSProperties> = {
  app:          { maxWidth:430, margin:"0 auto", background:"#fff", minHeight:"100vh", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", color:"#1a1a1a", border:"2px solid #1a1a1a", borderRadius:16, overflow:"hidden", boxSizing:"border-box" },
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
  timeSlot:   (type: string, sel: boolean): CSSProperties => { const C: Record<string,{bg:string,color:string,border:string}> = {avail:{bg:sel?"#22c55e":"#dcfce7",color:sel?"#fff":"#166534",border:sel?"#16a34a":"#bbf7d0"},partial:{bg:sel?GOLD:"#fef9c3",color:sel?"#fff":"#854d0e",border:sel?"#d97706":"#fde68a"},busy:{bg:"#fee2e2",color:"#ccc",border:"#fecaca"}}; const c=C[type]; return{borderRadius:8,padding:"9px 4px",textAlign:"center",fontSize:12,fontWeight:600,cursor:type==="busy"?"not-allowed":"pointer",background:c.bg,color:c.color,border:`1.5px solid ${c.border}`,transition:"all 0.12s"}; },
  ctaBtn:     (dis: boolean): CSSProperties => ({ width:"100%", background:dis?"#b0d9f5":BRAND, color:"#fff", border:"none", borderRadius:14, padding:15, fontSize:15, fontWeight:700, cursor:dis?"not-allowed":"pointer", fontFamily:"inherit" }),
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

function CalendarPicker({ selected, durationMins, selectedDate, onSelectDate, gcalLoaded }: {
  selected: Set<string>; durationMins: number; selectedDate: Date|null;
  onSelectDate: (dt: Date, dk: string) => void; gcalLoaded: boolean;
}) {
  const [calDate,setCalDate]=useState(()=>{const d=new Date();d.setDate(1);return d;});
  const today=new Date();today.setHours(0,0,0,0);
  const mc=maxContractors(selected);
  const y=calDate.getFullYear(),m=calDate.getMonth();
  const firstDay=new Date(y,m,1).getDay(),lastDay=new Date(y,m+1,0).getDate();
  function dotColor(dk: string){if(!gcalLoaded)return null;const av=getDayAvail(dk,mc,durationMins);return av==="free"?"#22c55e":av==="partial"?GOLD:"#ef4444";}
  return (
    <div style={{border:"1px solid #e0e0e0",borderRadius:14,overflow:"hidden",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",borderBottom:"1px solid #e0e0e0"}}>
        <button style={S.calNav} onClick={()=>setCalDate(new Date(y,m-1,1))}>‹</button>
        <span style={{fontWeight:700,fontSize:14}}>{MONTHS[m]} {y}</span>
        <button style={S.calNav} onClick={()=>setCalDate(new Date(y,m+1,1))}>›</button>
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

function TimeSlots({ dateKey, selected, durationMins, selectedTime, onSelectTime }: {
  dateKey: string; selected: Set<string>; durationMins: number;
  selectedTime: string|null; onSelectTime: (s: string, e: string) => void;
}) {
  const mc=maxContractors(selected);
  const slots: {s:number,av:number}[]=[];
  for(let s=8*60;s+durationMins<=18*60;s+=30){slots.push({s,av:getSlotsAvail(dateKey,mc,s,durationMins)});}
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
            return (<div key={s} style={SF.timeSlot(type,isSel)} onClick={()=>type!=="busy"&&onSelectTime(sl,el)}>{sl}</div>);
          })}
        </div>
      </div>
    );
  }
  return (
    <div>
      {!slots.some(x=>x.av>0)
        ?<div style={{textAlign:"center",padding:20,color:"#666",fontSize:13}}>😔 No available slots — please pick another date.</div>
        :<><Group label="Morning" items={morning}/><Group label="Afternoon" items={afternoon}/></>}
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
    { label:"Full name",       key:"name",    type:"text",  placeholder:"Jane Smith" },
    { label:"Phone number",    key:"phone",   type:"tel",   placeholder:"(403) 555-0100" },
    { label:"Email address",   key:"email",   type:"email", placeholder:"jane@email.com" },
    { label:"Service address", key:"address", type:"text",  placeholder:"123 Main St NW, Calgary, AB" },
  ];
  return (
    <div style={S.content}>
      <div style={S.sectionTitle}>Customer details</div>
      {fields.map(f=>(
        <div key={f.key} style={{marginBottom:12}}>
          <label style={{fontSize:11,fontWeight:700,color:"#666",textTransform:"uppercase" as const,letterSpacing:0.5,display:"block",marginBottom:5}}>{f.label}</label>
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
  const [durationMins,setDurationMins]   = useState(60);
  const [date,setDate]                   = useState<Date|null>(null);
  const [dateKey,setDateKey]             = useState("");
  const [dateStr,setDateStr]             = useState("");
  const [time,setTime]                   = useState<string|null>(null);
  const [endTime,setEndTime]             = useState<string|null>(null);
  const [gcalLoaded,setGcalLoaded]       = useState(false);
  const [customer,setCustomer]           = useState<CustomerData>({name:"",phone:"",email:"",address:"",notes:""});
  const [pushing,setPushing]             = useState(false);
  const [pushError,setPushError]         = useState("");

  useEffect(()=>{
    if(step===2){setGcalLoaded(false);const t=setTimeout(()=>setGcalLoaded(true),1400);return()=>clearTimeout(t);}
  },[step]);

  useEffect(()=>{
    const hasW=selected.has("window"),hasP=selected.has("pressure");
    const hasClean=["clean1","clean2","clean4","accc"].some(id=>selected.has(id));
    if(hasW&&hasP){
      const wMax=Math.max(...getPriceBracket(windowPrice).durations);
      const pMax=Math.max(...getPriceBracket(pressurePrice).durations);
      setDurationMins(Math.min(wMax+pMax,300));
    } else if(hasW){
      setDurationMins(Math.min(Math.max(...getPriceBracket(windowPrice).durations),300));
    } else if(hasP){
      setDurationMins(Math.min(Math.max(...getPriceBracket(pressurePrice).durations),300));
    } else if(hasClean&&!hasW&&!hasP){
      setDurationMins(120);
    }
  },[windowPrice,pressurePrice,selected]);

  function toggleService(id: string){setSelected(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});setTime(null);setEndTime(null);}
  function handleSelectDate(dt: Date,dk: string){setDate(dt);setDateKey(dk);setTime(null);setEndTime(null);setDateStr(dt.toLocaleDateString("en-CA",{weekday:"short",month:"short",day:"numeric"}));}

  const durations=allDurations(selected,windowPrice,pressurePrice,customPrice);
  const step2Ready=date&&time;
  const step3Ready=!!(customer.name&&customer.phone&&customer.email&&customer.address);

  async function handleConfirm() {
    setPushing(true); setPushError("");
    try {
      await pushToGoogleCalendar(
        {selected,date:date!,time:time!,endTime:endTime!,durationMins,customPrice,windowPrice,pressurePrice},
        customer
      );
      setStep(5);
    } catch(err) {
      console.error(err);
      setPushError("Could not push to Google Calendar. Check permissions and try again.");
    } finally { setPushing(false); }
  }

  function resetAll(){
    setStep(1);setSelected(new Set());setWindowPrice(200);setPressurePrice(200);
    setDurationMins(60);setDate(null);setDateKey("");setTime(null);setEndTime(null);
    setCustomer({name:"",phone:"",email:"",address:"",notes:""});setPushError("");
  }

  function Step1(){
    return (
      <div style={S.content}>
        <div style={S.sectionTitle}>Select services</div>
        <div style={S.sectionSub}>Pick one or more — tap to select</div>
        <div style={S.catLabel}>One-time services</div>
        {["window","pressure"].map(id=><ServiceCard key={id} id={id} selected={selected.has(id)} onToggle={toggleService}/>)}
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
            <input
              type="range" min="100" max="500" step="1" value={windowPrice}
              onChange={e=>setWindowPrice(parseInt(e.target.value))}
              style={{width:"100%",accentColor:BRAND,touchAction:"none",cursor:"pointer"}}
            />
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#aaa",marginTop:2}}>
              <span>$100</span><span style={{color:BRAND_DARK,fontWeight:600}}>{getPriceBracket(windowPrice).estLabel} est.</span><span>$500</span>
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
            <input
              type="range" min="100" max="500" step="1" value={pressurePrice}
              onChange={e=>setPressurePrice(parseInt(e.target.value))}
              style={{width:"100%",accentColor:BRAND,touchAction:"none",cursor:"pointer"}}
            />
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#aaa",marginTop:2}}>
              <span>$100</span><span style={{color:BRAND_DARK,fontWeight:600}}>{getPriceBracket(pressurePrice).estLabel} est.</span><span>$500</span>
            </div>
          </div>
        )}
        {!selected.has("window")&&!selected.has("pressure")&&(
          <div style={{fontSize:12,color:"#aaa",marginBottom:14}}>Select Window Cleaning or Pressure Washing above to set pricing.</div>
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
          <div style={{width:8,height:8,borderRadius:"50%",background:gcalLoaded?"#22c55e":BRAND,flexShrink:0}}/>
          <span>{gcalLoaded?"Google Calendar synced — availability is live":"Syncing with Google Calendar…"}</span>
        </div>
        <div style={{...S.sectionTitle,marginBottom:4}}>Job duration</div>
        <div style={{fontSize:12,color:"#666",marginBottom:8}}>
          {selected.has("window")&&selected.has("pressure")
            ?<span>Window <strong>${windowPrice}</strong> ({getPriceBracket(windowPrice).estLabel}) + Pressure <strong>${pressurePrice}</strong> ({getPriceBracket(pressurePrice).estLabel}) · combined</span>
            :selected.has("window")?<span>Window Cleaning · <strong>${windowPrice}</strong> home · {getPriceBracket(windowPrice).estLabel} est.</span>
            :selected.has("pressure")?<span>Pressure Washing · <strong>${pressurePrice}</strong> home · {getPriceBracket(pressurePrice).estLabel} est.</span>
            :<span>Based on home value</span>}
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
        <CalendarPicker selected={selected} durationMins={durationMins} selectedDate={date} onSelectDate={handleSelectDate} gcalLoaded={gcalLoaded}/>
        {date&&(
          <>
            <div style={{...S.sectionTitle,marginBottom:6}}>Available times</div>
            <TimeSlots dateKey={dateKey} selected={selected} durationMins={durationMins} selectedTime={time} onSelectTime={(s,e)=>{setTime(s);setEndTime(e);}}/>
          </>
        )}
        <button style={S.backBtn} onClick={()=>setStep(1)}>← Back</button>
        <button style={SF.ctaBtn(!step2Ready)} disabled={!step2Ready} onClick={()=>setStep(3)}>Continue →</button>
      </div>
    );
  }

  function Step4(){
    const names=[...selected].map(id=>SERVICES[id]?.name).join(", ");
    const hasWindow=selected.has("window"),hasPressure=selected.has("pressure");
    const wBracket=getPriceBracket(windowPrice),pBracket=getPriceBracket(pressurePrice);
    const subPrices: Record<string,number>={clean1:150,clean2:250,clean4:500,accc:1000};
    let totalPrice=0;
    if(hasWindow) totalPrice+=windowPrice;
    if(hasPressure) totalPrice+=pressurePrice;
    [...selected].filter(id=>!["window","pressure"].includes(id)).forEach(id=>{totalPrice+=subPrices[id]||0;});
    const selectedDurLabel=(()=>{
      if(hasWindow&&hasPressure){
        const wMax=Math.max(...wBracket.durations),pMax=Math.max(...pBracket.durations);
        return `${fmtDur(wMax)} (window) + ${fmtDur(pMax)} (pressure) = ${fmtDur(Math.min(wMax+pMax,300))}`;
      }
      return fmtDur(durationMins);
    })();
    const calendarsList=(()=>{
      const ids=new Set<string>();
      [...selected].forEach(id=>{
        if(id==="window") ids.add("Window Cleaning");
        else if(id==="pressure") ids.add("Pressure Washing");
        else ids.add("Home Cleaning");
      });
      return [...ids].join(", ");
    })();
    const rows: [string,string][]=[
      ["Services",names],
      ...(hasWindow&&hasPressure?[["Home values",`🪟 $${windowPrice} · 💦 $${pressurePrice}`] as [string,string]]:hasWindow?[["Home value",`$${windowPrice} (${wBracket.label})`] as [string,string]]:hasPressure?[["Home value",`$${pressurePrice} (${pBracket.label})`] as [string,string]]:[]),
      ["Selected duration",selectedDurLabel],
      ["Date",dateStr],
      ["Start",time||""],
      ["End",endTime||""],
      ["Customer",customer.name],
      ["Address",customer.address],
      ["Phone",customer.phone],
      ["Total price",`$${totalPrice.toLocaleString()}`],
      ["Pushing to",calendarsList],
    ];
    return (
      <div style={S.content}>
        <div style={S.sectionTitle}>Confirm booking</div>
        <div style={S.summaryCard}>
          {rows.map(([label,val],i)=>(
            <div key={label}>
              <div style={S.summaryRow}>
                <span style={{color:"#666",flexShrink:0}}>{label}</span>
                <span style={{fontWeight:600,textAlign:"right",maxWidth:"60%",color:label==="Home values"||label==="Home value"?BRAND:label==="Total price"?"#16a34a":label==="Pushing to"?"#7c3aed":"#1a1a1a",fontSize:label==="Pushing to"?11:13}}>{val}</span>
              </div>
              {[1,2,5,8].includes(i)&&<div style={{height:1,background:"rgba(57,186,255,0.25)",margin:"8px 0"}}/>}
            </div>
          ))}
        </div>
        {pushError&&<div style={{background:"#fee2e2",border:"1px solid #fecaca",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#991b1b"}}>{pushError}</div>}
        <div style={S.gcalNote}>
          <span style={{fontSize:18,flexShrink:0}}>📅</span>
          <span>Confirming will sign you in to Google and push this booking directly to your AllClean calendars.</span>
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
