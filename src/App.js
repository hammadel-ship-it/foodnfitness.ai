import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const SUPA_URL  = process.env.REACT_APP_SUPABASE_URL;
const SUPA_KEY  = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase  = createClient(SUPA_URL, SUPA_KEY);

// ─── DATA ─────────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { label:"Bloating",        emoji:"🌱", pillar:"food",     query:"I have bloating and digestive discomfort" },
  { label:"Low Immunity",    emoji:"🛡️", pillar:"food",     query:"I keep getting sick and want to boost my immunity" },
  { label:"Inflammation",    emoji:"🔥", pillar:"food",     query:"I have chronic inflammation and joint pain" },
  { label:"Skin Glow",       emoji:"✨", pillar:"food",     query:"My skin looks dull and I want a natural glow" },
  { label:"Stiff Joints",    emoji:"🦴", pillar:"exercise", query:"My joints are stiff and I need gentle movement exercises" },
  { label:"Back Pain",       emoji:"💪", pillar:"exercise", query:"I have chronic lower back pain and need strengthening exercises" },
  { label:"Low Stamina",     emoji:"🏃", pillar:"exercise", query:"I get out of breath easily and want to build stamina" },
  { label:"Posture",         emoji:"🧍", pillar:"exercise", query:"My posture is terrible from sitting at a desk all day" },
  { label:"Anxiety",         emoji:"🌬️", pillar:"breath",   query:"I feel anxious and overwhelmed and need to calm my nervous system" },
  { label:"Panic Attacks",   emoji:"💨", pillar:"breath",   query:"I get panic attacks and need breathing techniques to manage them" },
  { label:"Brain Fog",       emoji:"🧠", pillar:"breath",   query:"I have brain fog and cannot focus or think clearly" },
  { label:"Overwhelm",       emoji:"🌊", pillar:"breath",   query:"I feel completely overwhelmed and stressed, I need relief now" },
  { label:"Can't Sleep",     emoji:"🌙", pillar:"sleep",    query:"I have trouble falling asleep and lie awake for hours" },
  { label:"Wake at 3am",     emoji:"⏰", pillar:"sleep",    query:"I keep waking up at 3am and cannot get back to sleep" },
  { label:"Low Energy",      emoji:"⚡", pillar:"sleep",    query:"I feel tired and low on energy all day despite sleeping" },
  { label:"Recovery",        emoji:"🛌", pillar:"sleep",    query:"I train hard but never feel recovered, always sore and fatigued" },
];

const PILLAR_META = {
  food:     { label:"Food & Nutrition",    color:"#22a35a", bg:"rgba(34,163,90,.12)",  border:"rgba(34,163,90,.3)",  icon:"🥗" },
  exercise: { label:"Exercise & Movement", color:"#4a9fd4", bg:"rgba(74,159,212,.12)", border:"rgba(74,159,212,.3)", icon:"💪" },
  breath:   { label:"Breathwork & Stress", color:"#9b7fe8", bg:"rgba(155,127,232,.12)",border:"rgba(155,127,232,.3)",icon:"🌬️" },
  sleep:    { label:"Sleep & Recovery",    color:"#5b9bd5", bg:"rgba(91,155,213,.12)", border:"rgba(91,155,213,.3)", icon:"🌙" },
};

const ALLERGIES = ["Gluten","Dairy","Nuts","Soy","Eggs","Shellfish","Fish","Sesame"];

const TIERS = [
  { name:"Starter",  price:"£3",  per:"one-time",  searches:"10 searches", rate:"£0.30 / search", desc:"Try it out. No commitment.", cta:"Get Started", highlight:false, stripeId:"price_1T8hNmCJF4DF72elItDLqZIp", features:["10 AI wellness searches","Food, fitness & breathwork","Personalised to your body","Never expires"] },
  { name:"Thrive",   price:"£9",  per:"per month", searches:"40 searches", rate:"£0.23 / search", desc:"For those committed to feeling their best.", cta:"Start Thriving", highlight:true, stripeId:"price_1T8hOyCJF4DF72elWJQpeY94", badge:"Most Popular", features:["40 searches / month","All 4 wellness pillars","Personalised responses","Best value monthly"] },
  { name:"Optimise", price:"£19", per:"per month", searches:"Unlimited",   rate:"No limits ever", desc:"For those who make wellness a daily practice.", cta:"Start Optimising", highlight:false, stripeId:"price_1T8hPUCJF4DF72el0FctAFJv", features:["Unlimited searches","All 4 wellness pillars","Full personalisation","Best value for daily use"] },
];

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────

const buildPrompt = (user, isFollowUp) => {
  const allergy = user?.allergies?.length
    ? "CRITICAL ALLERGY: Never recommend " + user.allergies.join(", ") + " or any derivatives."
    : "";
  const history = user?.history?.length
    ? "Prior concerns: " + user.history.slice(-4).map(h=>h.query).join("; ") + "."
    : "";
  const sexNote = user?.sex === "female"
    ? "User is female: prioritise iron, oestrogen support, cycle nutrition."
    : user?.sex === "male"
    ? "User is male: prioritise testosterone support, muscle recovery, zinc, magnesium."
    : "";

  if (!isFollowUp) {
    return "You are a holistic wellness coach. " + allergy + " " + history + " " + sexNote + "\n\n" +
      "OUTPUT RULES - FOLLOW EXACTLY:\n" +
      "1. Output ONLY a JSON object. Zero text before or after it.\n" +
      "2. No markdown. No backticks. No code fences.\n" +
      "3. Use double quotes for all strings. No single quotes. No apostrophes in values.\n" +
      "4. No newlines inside string values. Keep all strings on one line.\n" +
      "5. No trailing commas.\n\n" +
      "JSON format (copy this structure exactly):\n" +
      '{"responseType":"initial","acknowledgment":"YOUR TEXT HERE","pillars":[{"type":"food","label":"Food and Nutrition","items":[{"emoji":"🫐","name":"Food name","benefit":"One sentence benefit"}]},{"type":"exercise","label":"Exercise and Movement","items":[{"emoji":"🏃","name":"Exercise name","benefit":"How to do it with duration"}]}],"recipes":[{"name":"Recipe name","emoji":"🥣","ingredients":["item 1","item 2"],"steps":["Step 1","Step 2","Step 3"]}],"tip":"One specific actionable tip"}\n\n' +
      "CONTENT RULES:\n" +
      "- acknowledgment: 2 warm sentences referencing their exact words\n" +
      "- pillars: include 2 to 3 pillars relevant to the query. Types allowed: food, exercise, breath, sleep\n" +
      "- items: 3 to 4 per pillar. Each needs emoji, name, benefit\n" +
      "- recipes: 1 or 2 recipes. Max 3 steps each\n" +
      "- tip: one hyper-specific actionable tip\n" +
      allergy;
  } else {
    return "You are a holistic wellness coach continuing a conversation. " + allergy + " " + sexNote + "\n\n" +
      "OUTPUT RULES - FOLLOW EXACTLY:\n" +
      "1. Output ONLY a JSON object. Zero text before or after it.\n" +
      "2. No markdown. No backticks. No code fences.\n" +
      "3. Use double quotes. No single quotes. No apostrophes in string values.\n" +
      "4. No newlines inside string values.\n" +
      "5. No trailing commas.\n\n" +
      "Pick ONE of these response types based on what the user asked:\n\n" +
      "If they want more foods or practices:\n" +
      '{"responseType":"items","acknowledgment":"1-2 sentences","pillars":[{"type":"food","label":"Foods","items":[{"emoji":"🌿","name":"Name","benefit":"Benefit"}]}],"tip":"tip"}\n\n' +
      "If they want a recipe or protocol:\n" +
      '{"responseType":"recipe","acknowledgment":"1-2 sentences","recipes":[{"name":"Name","emoji":"🥣","ingredients":["item"],"steps":["step"]}],"tip":"tip"}\n\n' +
      "If they want lifestyle insight:\n" +
      '{"responseType":"insight","acknowledgment":"1-2 sentences","cards":[{"emoji":"🌿","title":"Short title","body":"1-2 sentences","pillar":"food"}],"tip":"tip"}\n\n' +
      "If they have a specific question:\n" +
      '{"responseType":"answer","acknowledgment":"1-2 sentences","cards":[{"emoji":"🌿","title":"Short title","body":"1-2 sentences","pillar":"food"}],"tip":"tip"}\n\n' +
      "CONTENT RULES:\n" +
      "- 3 to 5 items or cards\n" +
      "- pillar field must be one of: food, exercise, breath, sleep\n" +
      "- Be specific and use emojis\n" +
      allergy;
  }
};

const buildWeekPlanPrompt = (user, concern) => {
  const allergy = user?.allergies?.length
    ? "CRITICAL: allergic to " + user.allergies.join(", ") + ". NEVER include these."
    : "";
  return `You are a holistic wellness coach creating a 7-day plan covering food, movement, breathwork and sleep.
Concern: "${concern}"
${allergy}

Respond ONLY a valid JSON array of exactly 7 objects. No markdown. No text outside JSON. No trailing commas.

Shape: [{"day":"Monday","focus":"word","food":"meal","move":"exercise with duration","breathe":"technique with reps","sleep":"sleep tip with timing"},{"day":"Tuesday","focus":"word","food":"meal","move":"exercise","breathe":"breathwork","sleep":"sleep tip"},{"day":"Wednesday","focus":"word","food":"meal","move":"exercise","breathe":"breathwork","sleep":"sleep tip"},{"day":"Thursday","focus":"word","food":"meal","move":"exercise","breathe":"breathwork","sleep":"sleep tip"},{"day":"Friday","focus":"word","food":"meal","move":"exercise","breathe":"breathwork","sleep":"sleep tip"},{"day":"Saturday","focus":"word","food":"meal","move":"exercise","breathe":"breathwork","sleep":"sleep tip"},{"day":"Sunday","focus":"word","food":"meal","move":"exercise","breathe":"breathwork","sleep":"sleep tip"}]

- focus: one evocative theme word per day
- food: specific meal addressing the concern
- move: specific exercise with duration e.g. "10 min morning yoga flow"
- breathe: specific technique with reps e.g. "4-7-8 breathing 5 rounds"
- sleep: specific tip with timing e.g. "No screens 90 mins before bed"
- No newlines inside strings. No apostrophes or single quotes inside string values — rephrase to avoid them. No unescaped special characters.
- ${allergy}`;
};

// ─── SUPABASE PROFILE HELPERS ─────────────────────────────────────────────────

// Cache session in localStorage just for instant UI restore on reload
const getUser   = () => { try { return JSON.parse(localStorage.getItem("np_user")||"null"); } catch { return null; } };
const saveUser  = (u) => localStorage.setItem("np_user", JSON.stringify(u));
const clearUser = () => localStorage.removeItem("np_user");

// Fetch full profile from Supabase (credits, allergies, sex, history)
const fetchProfile = async (supaId) => {
  const { data } = await supabase.from("profiles").select("*").eq("id", supaId).single();
  return data;
};

// Upsert profile fields to Supabase
const upsertProfile = async (supaId, fields) => {
  await supabase.from("profiles").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", supaId);
};

// ─── CONVERSATION HISTORY ─────────────────────────────────────────────────────

const CONV_KEY = "np_conversations";
const MAX_CONVS = 20;

const loadConversations = () => { try { return JSON.parse(localStorage.getItem(CONV_KEY)||"[]"); } catch { return []; } };
const saveConversations = (convs) => localStorage.setItem(CONV_KEY, JSON.stringify(convs));

const saveConversation = (messages) => {
  if (!messages.length) return;
  const convs = loadConversations();
  const firstUserMsg = messages.find(m=>m.role==="user");
  const title = firstUserMsg ? firstUserMsg.content.slice(0,60) + (firstUserMsg.content.length>60?"…":"") : "Conversation";
  const conv = { id: Date.now(), title, date: Date.now(), messages: messages.map(m=>({role:m.role,content:m.content,result:m.result||null})) };
  const updated = [conv, ...convs].slice(0, MAX_CONVS);
  saveConversations(updated);
  return conv.id;
};

const deleteConversation = (id) => {
  const convs = loadConversations().filter(c=>c.id!==id);
  saveConversations(convs);
};

// ─── STYLES ───────────────────────────────────────────────────────────────────

const CSS = `
  @keyframes fadeUp    { from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);} }
  @keyframes fadeIn    { from{opacity:0;}to{opacity:1;} }
  @keyframes spin      { to{transform:rotate(360deg);} }
  @keyframes pulse     { 0%,100%{opacity:.5;}50%{opacity:1;} }
  @keyframes float     { 0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);} }
  @keyframes slideUp   { from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);} }
  @keyframes pulseRing { 0%{box-shadow:0 0 0 0 rgba(34,163,90,.4);}70%{box-shadow:0 0 0 10px rgba(34,163,90,0);}100%{box-shadow:0 0 0 0 rgba(34,163,90,0);} }
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{height:100%;background:#0b1a0d;}
  body{font-family:'Georgia',serif;color:#e0ede2;-webkit-font-smoothing:antialiased;}
  input,textarea,button{font-family:'Georgia',serif;}
  .item-card:hover    {transform:translateY(-3px);box-shadow:0 6px 20px rgba(0,0,0,.2);}
  .rc:hover           {border-color:rgba(34,163,90,.4)!important;}
  .tier-card          {transition:transform .25s,box-shadow .25s;}
  .tier-card:hover    {transform:translateY(-6px);box-shadow:0 16px 48px rgba(0,0,0,.3);}
  .cta-btn            {position:relative;overflow:hidden;transition:transform .15s,box-shadow .15s;}
  .cta-btn:hover      {transform:scale(1.02);}
  .cta-btn:active     {transform:scale(.98);}
  .day-card           {transition:all .18s;cursor:pointer;}
  .day-card:hover     {transform:translateY(-2px);}
  .modal-wrap         {animation:fadeIn .2s ease;}
  .modal-box          {animation:slideUp .25s ease;}
  .search-ring:focus-within{border-color:rgba(80,180,100,.6)!important;box-shadow:0 0 0 3px rgba(34,163,90,.12)!important;}
  .pillar-tab         {transition:all .18s;cursor:pointer;}
  .chip-btn:hover     {filter:brightness(1.15);}
  @media(max-width:480px){
    .np-week-grid{grid-template-columns:repeat(4,1fr)!important;}
    .np-item-grid{grid-template-columns:repeat(2,1fr)!important;}
    .np-tier-grid{grid-template-columns:1fr!important;}
    .np-modal-pad{padding:22px 16px!important;}
    .np-chips-wrap{grid-template-columns:repeat(2,1fr)!important;}
  }
  @media(min-width:481px) and (max-width:680px){
    .np-week-grid{grid-template-columns:repeat(4,1fr)!important;}
    .np-item-grid{grid-template-columns:repeat(3,1fr)!important;}
    .np-tier-grid{grid-template-columns:1fr!important;}
    .np-chips-wrap{grid-template-columns:repeat(4,1fr)!important;}
  }
  @media(min-width:681px){
    .np-week-grid{grid-template-columns:repeat(7,1fr)!important;}
    .np-item-grid{grid-template-columns:repeat(auto-fill,minmax(130px,1fr))!important;}
    .np-chips-wrap{grid-template-columns:repeat(4,1fr)!important;}
  }
`;

function safeParseJSON(raw, expectArray=false) {
  // 1. Strip markdown fences
  let s = raw.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/i,"").trim();

  // 2. Extract outermost { } or [ ]
  if (expectArray) { const a=s.indexOf("["),b=s.lastIndexOf("]"); if(a!==-1&&b!==-1)s=s.slice(a,b+1); }
  else             { const a=s.indexOf("{"),b=s.lastIndexOf("}"); if(a!==-1&&b!==-1)s=s.slice(a,b+1); }
  if (!s) throw new Error("No JSON found.");

  // 3. Try raw
  try{return JSON.parse(s);}catch(_){}

  // 4. Fix trailing commas before } or ]
  s=s.replace(/,\s*([}\]])/g,"$1");
  try{return JSON.parse(s);}catch(_){}

  // 5. Replace literal newlines inside strings with space
  s=s.replace(/"([^"]*)"/g,(_,inner)=>'"'+inner.replace(/\n/g," ").replace(/\r/g,"")+'"');
  try{return JSON.parse(s);}catch(_){}

  // 6. Remove control characters that break JSON
  s=s.replace(/[\x00-\x1F\x7F]/g,(c)=>{
    if(c==="\n"||c==="\r"||c==="\t")return " ";
    return "";
  });
  try{return JSON.parse(s);}catch(_){}

  // 7. Fix unescaped quotes inside string values — replace " that aren't preceded by : [ , { with \"
  s=s.replace(/:\s*"(.*?)(?<!\\)"/gs,(_,inner)=>':"'+inner.replace(/(?<!\\)"/g,'\\"')+'"');
  try{return JSON.parse(s);}catch(_){}

  // 8. Last resort: strip everything after last valid closing bracket
  const lastCurly = s.lastIndexOf("}");
  const lastSquare = s.lastIndexOf("]");
  const lastClose = Math.max(lastCurly, lastSquare);
  if (lastClose > 0) {
    const trimmed = s.slice(0, lastClose+1);
    try{return JSON.parse(trimmed);}catch(_){}
    // Also try fixing trailing commas on trimmed version
    try{return JSON.parse(trimmed.replace(/,\s*([}\]])/g,"$1"));}catch(_){}
  }

  throw new Error("Could not parse AI response as JSON.");
}

function Modal({ onClose, children, maxWidth=420 }) {
  useEffect(()=>{ const h=(e)=>e.key==="Escape"&&onClose(); window.addEventListener("keydown",h); return()=>window.removeEventListener("keydown",h); },[onClose]);
  return (
    <div className="modal-wrap" onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div className="modal-box np-modal-pad" onClick={e=>e.stopPropagation()} style={{background:"#111e13",border:"1px solid rgba(34,163,90,.3)",borderRadius:22,padding:"32px 28px",maxWidth,width:"100%"}}>
        {children}
      </div>
    </div>
  );
}

const EyeIcon = ({open}) => open
  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

function AuthModal({ onClose, onAuth, defaultMode="login" }) {
  const [mode,setMode]=useState(defaultMode);
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [showPass,setShowPass]=useState(false);
  const [allergies,setAllergies]=useState([]);
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const [resetSent,setResetSent]=useState(false);
  const emailRef=useRef(null);
  useEffect(()=>{emailRef.current?.focus();},[]);
  const toggleAllergy=(a)=>setAllergies(p=>p.includes(a)?p.filter(x=>x!==a):[...p,a]);

  const submit=async()=>{
    setErr("");setLoading(true);
    try{
      if(mode==="signup"){
        if(!name.trim())return setErr("Name required.");
        if(!email.trim()||!pass.trim())return setErr("Email and password required.");
        if(pass.length<6)return setErr("Password must be at least 6 characters.");
        // Create Supabase auth user
        const {data,error}=await supabase.auth.signUp({
          email:email.trim(),
          password:pass,
          options:{ data:{ name:name.trim() } }
        });
        if(error)return setErr(error.message);
        // Set initial profile fields (trigger auto-creates row, we update extras)
        if(data.user){
          await supabase.from("profiles").upsert({
            id:data.user.id,
            email:email.trim(),
            name:name.trim(),
            allergies,
            credits:3,
            tier:"free"
          });
          const u={id:data.user.id,name:name.trim(),email:email.trim(),allergies,credits:3,sex:"",history:[]};
          saveUser(u);onAuth(u);
        }
      } else {
        if(!email.trim()||!pass.trim())return setErr("Email and password required.");
        const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password:pass});
        if(error)return setErr(error.message);
        // Fetch full profile
        const profile=await fetchProfile(data.user.id);
        const u={
          id:data.user.id,
          name:profile?.name||data.user.user_metadata?.name||email.split("@")[0],
          email:email.trim(),
          allergies:profile?.allergies||[],
          credits:profile?.credits??3,
          sex:profile?.sex||"",
          history:profile?.history||[]
        };
        saveUser(u);onAuth(u);
      }
    }catch(e){setErr(e.message);}finally{setLoading(false);}
  };

  const sendReset=async()=>{
    setErr("");setLoading(true);
    try{
      const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{
        redirectTo:"https://foodnfitness.ai/reset"
      });
      if(error)return setErr(error.message);
      setResetSent(true);
    }catch(e){setErr(e.message);}finally{setLoading(false);}
  };

  const inp={background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.12)",borderRadius:10,padding:"11px 14px",color:"#c8e8ce",outline:"none",fontSize:".9rem",width:"100%",boxSizing:"border-box"};
  const pw={position:"relative",display:"flex",alignItems:"center"};
  const eb={position:"absolute",right:12,background:"none",border:"none",color:"#3a6644",cursor:"pointer",padding:2,display:"flex",alignItems:"center"};

  if(mode==="forgot")return(
    <Modal onClose={onClose}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <span style={{color:"#a8ddb5",fontSize:"1.05rem"}}>🔑 Reset password</span>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#3a6644",cursor:"pointer",fontSize:"1.1rem"}}>✕</button>
      </div>
      {err&&<div style={{color:"#f09090",fontSize:".82rem",marginBottom:12,padding:"9px 13px",background:"rgba(200,60,60,.1)",borderRadius:9,border:"1px solid rgba(200,60,60,.2)"}}>{err}</div>}
      {resetSent
        ?<div style={{textAlign:"center",padding:"16px 0"}}>
          <div style={{fontSize:32,marginBottom:12}}>📬</div>
          <div style={{color:"#a8ddb5",fontSize:".95rem",marginBottom:8}}>Check your email</div>
          <div style={{color:"#3a6644",fontSize:".88rem",lineHeight:1.7}}>A password reset link has been sent to <strong style={{color:"#5ed880"}}>{email}</strong>. Check your inbox.</div>
          <button onClick={()=>{setMode("login");setResetSent(false);}} style={{marginTop:16,background:"none",border:"none",color:"#3a6644",fontSize:".82rem",cursor:"pointer"}}>← Back to sign in</button>
        </div>
        :<div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{color:"#4a7a56",fontSize:".82rem"}}>Enter your account email and we will send a reset link.</div>
          <input ref={emailRef} value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" type="email" onKeyDown={e=>e.key==="Enter"&&sendReset()} style={inp}/>
          <button onClick={sendReset} disabled={loading} className="cta-btn" style={{background:"linear-gradient(135deg,#22a35a,#1a7a44)",border:"none",borderRadius:11,padding:"13px",color:"#e8f5eb",fontSize:".9rem",cursor:"pointer",fontWeight:600}}>{loading?"Sending…":"Send reset link →"}</button>
          <button onClick={()=>{setMode("login");setErr("");}} style={{background:"none",border:"none",color:"#3a6644",fontSize:".82rem",cursor:"pointer",textAlign:"center",paddingTop:4}}>← Back to sign in</button>
        </div>
      }
    </Modal>
  );

  return(
    <Modal onClose={onClose}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <span style={{color:"#a8ddb5",fontSize:"1.05rem"}}>{mode==="login"?"Welcome back 🌿":"Join foodnfitness.ai 🌱"}</span>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#3a6644",cursor:"pointer",fontSize:"1.1rem",lineHeight:1}}>✕</button>
      </div>
      {err&&<div style={{color:"#f09090",fontSize:".82rem",marginBottom:12,padding:"9px 13px",background:"rgba(200,60,60,.1)",borderRadius:9,border:"1px solid rgba(200,60,60,.2)"}}>{err}</div>}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {mode==="signup"&&<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" style={inp}/>}
        <input ref={emailRef} value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" type="email" style={inp}/>
        <div style={pw}><input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Password" type={showPass?"text":"password"} onKeyDown={e=>e.key==="Enter"&&submit()} style={{...inp,paddingRight:40}}/><button onClick={()=>setShowPass(p=>!p)} style={eb}><EyeIcon open={showPass}/></button></div>
        {mode==="signup"&&<div>
          <div style={{color:"#4a7a56",fontSize:".78rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>Food allergies</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{ALLERGIES.map(a=><button key={a} onClick={()=>toggleAllergy(a)} style={{background:allergies.includes(a)?"rgba(34,163,90,.22)":"rgba(255,255,255,.04)",border:"1px solid "+(allergies.includes(a)?"rgba(34,163,90,.55)":"rgba(255,255,255,.1)"),borderRadius:20,padding:"4px 11px",color:allergies.includes(a)?"#5ed880":"#4a7a56",fontSize:".84rem",cursor:"pointer",transition:"all .14s"}}>{a}</button>)}</div>
          <div style={{color:"#2a4a30",fontSize:".78rem",marginTop:6,fontStyle:"italic"}}>Editable anytime in your profile.</div>
        </div>}
        <button onClick={submit} disabled={loading} className="cta-btn" style={{background:"linear-gradient(135deg,#22a35a,#1a7a44)",border:"none",borderRadius:11,padding:"13px",color:"#e8f5eb",fontSize:".9rem",cursor:"pointer",fontWeight:600,marginTop:2}}>{loading?"Please wait…":(mode==="login"?"Sign In →":"Create Free Account →")}</button>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:2}}>
          <button onClick={()=>{setMode(m=>m==="login"?"signup":"login");setErr("");}} style={{background:"none",border:"none",color:"#3a6644",fontSize:".82rem",cursor:"pointer",fontFamily:"'Georgia',serif"}}>{mode==="login"?"No account? Sign up free":"Already have an account?"}</button>
          {mode==="login"&&<button onClick={()=>{setMode("forgot");setErr("");}} style={{background:"none",border:"none",color:"#2a4a30",fontSize:".78rem",cursor:"pointer",fontFamily:"'Georgia',serif",fontStyle:"italic"}}>Forgot password?</button>}
        </div>
      </div>
    </Modal>
  );
}

function ProfileModal({ user, onClose, onUpdate, onLogout, onUpgrade }) {
  const [allergies,setAllergies]=useState(user.allergies||[]);
  const [sex,setSex]=useState(user.sex||"");
  const [saving,setSaving]=useState(false);
  const [portalLoading,setPortalLoading]=useState(false);
  const toggle=(a)=>setAllergies(p=>p.includes(a)?p.filter(x=>x!==a):[...p,a]);
  const save=async()=>{
    setSaving(true);
    const u={...user,allergies,sex};
    saveUser(u);
    if(user.id) await upsertProfile(user.id,{allergies,sex});
    onUpdate(u);
    setSaving(false);
  };
  const logout=async()=>{
    await supabase.auth.signOut();
    clearUser();
    onLogout();
  };
  const manageSubscription=async()=>{
    setPortalLoading(true);
    try{
      const resp=await fetch("/.netlify/functions/customer-portal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:user.email})});
      const data=await resp.json();
      if(data.url){window.location.href=data.url;}
      else{alert(data.error||"Could not open subscription portal.");}
    }catch(e){alert("Error: "+e.message);}
    setPortalLoading(false);
  };
  const SEX=[{value:"female",label:"Female",icon:"♀️"},{value:"male",label:"Male",icon:"♂️"}];
  return(
    <Modal onClose={onClose}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{color:"#a8ddb5",fontSize:"1.05rem"}}>👤 {user.name}</span><button onClick={onClose} style={{background:"none",border:"none",color:"#3a6644",cursor:"pointer",fontSize:"1.1rem"}}>✕</button></div>
      <div style={{color:"#2e5535",fontSize:".85rem",marginBottom:20}}>{user.email} · {user.history?.length||0} searches · <span style={{color:(user.credits??0)<=1?"#f09090":(user.credits??0)<=2?"#ffc85a":"#5ed880"}}>{user.credits??0} credits</span></div>
      <div style={{marginBottom:20}}>
        <div style={{color:"#4a7a56",fontSize:".78rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:10}}>Biological sex <span style={{color:"#2a4a30",fontStyle:"italic",letterSpacing:0,textTransform:"none",fontSize:".74rem"}}>(personalises results)</span></div>
        <div style={{display:"flex",gap:8}}>{SEX.map(opt=>{const active=sex===opt.value;return<button key={opt.value} onClick={()=>setSex(active?"":opt.value)} style={{flex:1,background:active?"rgba(34,163,90,.18)":"rgba(255,255,255,.04)",border:"1.5px solid "+(active?"rgba(34,163,90,.55)":"rgba(255,255,255,.1)"),borderRadius:14,padding:"12px 8px",cursor:"pointer",transition:"all .16s",display:"flex",flexDirection:"column",alignItems:"center",gap:5}}><span style={{fontSize:20}}>{opt.icon}</span><span style={{color:active?"#5ed880":"#4a7a56",fontSize:".84rem",fontFamily:"'Georgia',serif"}}>{opt.label}</span></button>;})}</div>
        {!sex&&<div style={{color:"#1e3d25",fontSize:".74rem",marginTop:7,fontStyle:"italic"}}>Optional — tailors hormone, iron & nutrient advice.</div>}
        {sex&&<div style={{color:"#3a6644",fontSize:".74rem",marginTop:7,fontStyle:"italic"}}>✓ Personalised for {sex} biology.</div>}
      </div>
      <div style={{marginBottom:20}}>
        <div style={{color:"#4a7a56",fontSize:".78rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>Food allergies</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{ALLERGIES.map(a=><button key={a} onClick={()=>toggle(a)} style={{background:allergies.includes(a)?"rgba(34,163,90,.22)":"rgba(255,255,255,.04)",border:"1px solid "+(allergies.includes(a)?"rgba(34,163,90,.55)":"rgba(255,255,255,.1)"),borderRadius:20,padding:"4px 11px",color:allergies.includes(a)?"#5ed880":"#4a7a56",fontSize:".84rem",cursor:"pointer",transition:"all .14s"}}>{a}</button>)}</div>
      </div>
      <div style={{display:"flex",gap:9,marginBottom:9}}><button onClick={save} disabled={saving} className="cta-btn" style={{flex:1,background:"linear-gradient(135deg,#22a35a,#1a7a44)",border:"none",borderRadius:10,padding:"11px",color:"#e8f5eb",fontSize:".85rem",cursor:"pointer",fontWeight:600}}>{saving?"Saving…":"Save"}</button><button onClick={logout} style={{background:"rgba(220,80,80,.08)",border:"1px solid rgba(220,80,80,.22)",borderRadius:10,padding:"11px 16px",color:"#f09090",fontSize:".85rem",cursor:"pointer"}}>Sign out</button></div>
      {user.tier&&user.tier!=="free"&&<button onClick={manageSubscription} disabled={portalLoading} style={{width:"100%",background:"rgba(255,255,255,.03)",border:"1px solid rgba(80,180,100,.18)",borderRadius:10,padding:"10px",color:"#4a7a56",fontSize:".82rem",cursor:"pointer"}}>{portalLoading?"Loading…":"⚙️ Manage / cancel subscription"}</button>}
      {(!user.tier||user.tier==="free"||user.tier==="starter")&&<button onClick={onUpgrade} style={{width:"100%",background:"rgba(34,163,90,.07)",border:"1px solid rgba(34,163,90,.22)",borderRadius:10,padding:"10px",color:"#4ec97a",fontSize:".82rem",cursor:"pointer",marginTop:user.tier&&user.tier!=="free"?6:0}}>⬆️ Upgrade plan</button>}
    </Modal>
  );
}

function NoCreditsModal({ onClose, onViewPlans }) {
  return(
    <Modal onClose={onClose} maxWidth={360}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:38,marginBottom:12}}>💪</div>
        <div style={{color:"#c8a96e",fontSize:"1rem",marginBottom:8}}>Out of credits</div>
        <div style={{color:"#5a4a2a",fontSize:".92rem",lineHeight:1.7,marginBottom:20}}>Top up to keep unlocking your wellness plan.<br/><span style={{color:"#7a6030",fontSize:".78rem"}}>1 credit per search</span></div>
        <button onClick={onViewPlans} className="cta-btn" style={{width:"100%",background:"linear-gradient(135deg,#c8a96e,#a07840)",border:"none",borderRadius:11,padding:"12px",color:"#1a1208",fontSize:".9rem",cursor:"pointer",fontWeight:700,marginBottom:8}}>View plans →</button>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#5a4a2a",fontSize:".78rem",cursor:"pointer"}}>Maybe later</button>
      </div>
    </Modal>
  );
}

function SignUpPrompt({ onClose, onSignUp }) {
  return(
    <Modal onClose={onClose} maxWidth={360}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:42,marginBottom:12,display:"inline-block",animation:"float 3s ease-in-out infinite"}}>🌿</div>
        <div style={{color:"#a8ddb5",fontSize:"1rem",marginBottom:8}}>You have used your free search</div>
        <div style={{color:"#3a6644",fontSize:".92rem",lineHeight:1.7,marginBottom:16}}>Sign up free — food, fitness, breathwork and sleep. No card needed.</div>
        <div style={{display:"flex",justifyContent:"center",gap:20,marginBottom:20,padding:"12px 16px",background:"rgba(34,163,90,.06)",border:"1px solid rgba(34,163,90,.15)",borderRadius:12}}>
          {[["4","Pillars"],["3","Free credits"],["Free","To join"]].map(([val,lbl],i)=>(
            <div key={i} style={{textAlign:"center"}}><div style={{color:"#4ec97a",fontSize:"1.1rem",fontWeight:600}}>{val}</div><div style={{color:"#2e5535",fontSize:".74rem",letterSpacing:".06em",textTransform:"uppercase"}}>{lbl}</div></div>
          ))}
        </div>
        <button onClick={onSignUp} className="cta-btn" style={{width:"100%",background:"linear-gradient(135deg,#22a35a,#1a7a44)",border:"none",borderRadius:11,padding:"13px",color:"#e8f5eb",fontSize:".9rem",cursor:"pointer",fontWeight:600,marginBottom:8,boxShadow:"0 4px 20px rgba(34,163,90,.25)"}}>Create free account →</button>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#2e5535",fontSize:".74rem",cursor:"pointer"}}>Maybe later</button>
      </div>
    </Modal>
  );
}

function WeekPlan({ plan }) {
  const [active,setActive]=useState(null);
  if(!Array.isArray(plan)||plan.length===0)return null;
  const rows=[["🥗","food","Food"],["💪","move","Move"],["🌬️","breathe","Breathe"],["🌙","sleep","Sleep"]];
  return(
    <div style={{marginTop:24}}>
      <div style={{color:"#4a9960",fontSize:".78rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:5}}>🗓️ 7-day wellness plan</div>
      <div style={{color:"#2a4030",fontSize:".8rem",marginBottom:14,fontStyle:"italic"}}>Tap any day to expand</div>
      <div className="np-week-grid" style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:5}}>
        {plan.map((d,i)=>(
          <div key={i} className="day-card" onClick={()=>setActive(active===i?null:i)} style={{background:active===i?"rgba(34,163,90,.16)":"rgba(34,163,90,.06)",border:"1px solid "+(active===i?"rgba(34,163,90,.42)":"rgba(34,163,90,.14)"),borderRadius:10,padding:"9px 5px",textAlign:"center"}}>
            <div style={{color:"#4a9960",fontSize:".76rem",letterSpacing:".06em",textTransform:"uppercase",marginBottom:3}}>{d.day?.slice(0,3)||"Day"}</div>
            <div style={{color:"#a8ddb5",fontSize:".72rem",lineHeight:1.3,fontStyle:"italic"}}>{d.focus||""}</div>
          </div>
        ))}
      </div>
      {active!==null&&plan[active]&&(
        <div style={{background:"rgba(34,163,90,.05)",border:"1px solid rgba(34,163,90,.16)",borderRadius:12,padding:"16px",marginTop:8,animation:"fadeUp .22s ease"}}>
          <div style={{color:"#4ec97a",fontSize:".85rem",fontWeight:600,marginBottom:12}}>{plan[active].day} — <em style={{color:"#4a9960",fontWeight:400}}>{plan[active].focus}</em></div>
          {rows.map(([icon,key,lbl])=>(
            <div key={key} style={{display:"flex",gap:11,marginBottom:9,alignItems:"flex-start"}}>
              <span style={{minWidth:90,color:"#2e5535",fontSize:".82rem",flexShrink:0,paddingTop:1}}>{icon} {lbl}</span>
              <span style={{color:"#8dc89e",fontSize:".88rem",lineHeight:1.55}}>{plan[active][key]||"—"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AckBubble({ text, label="A note for you" }) {
  return(
    <div style={{background:"linear-gradient(135deg,rgba(34,163,90,.1),rgba(20,80,40,.07))",border:"1px solid rgba(34,163,90,.22)",borderRadius:16,padding:"18px 20px",marginBottom:14,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:12,right:14,fontSize:20,opacity:.08}}>🌿</div>
      <div style={{color:"#4a9960",fontSize:".78rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:6}}>{label}</div>
      <p style={{color:"#b8e8c4",fontSize:"clamp(1rem,1.6vw,1.12rem)",lineHeight:1.8,margin:0,fontStyle:"italic"}}>{text}</p>
    </div>
  );
}

function TipRow({ tip }) {
  if(!tip)return null;
  return(
    <div style={{background:"linear-gradient(135deg,rgba(34,163,90,.08),rgba(20,100,55,.04))",border:"1px solid rgba(34,163,90,.18)",borderRadius:12,padding:"12px 16px",display:"flex",gap:10,alignItems:"flex-start",marginBottom:14}}>
      <span style={{fontSize:15,marginTop:1,flexShrink:0}}>💡</span>
      <span style={{color:"#a8d8b4",fontSize:"clamp(.95rem,1.5vw,1.06rem)",lineHeight:1.62}}>{tip}</span>
    </div>
  );
}

function PillarGrid({ pillars }) {
  if(!pillars?.length)return null;
  return(
    <div style={{marginBottom:14}}>
      {pillars.map((pillar,pi)=>{
        const meta=PILLAR_META[pillar.type]||PILLAR_META.food;
        return(
          <div key={pi} style={{marginBottom:pi<pillars.length-1?18:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span style={{fontSize:16}}>{meta.icon}</span>
              <span style={{color:meta.color,fontSize:".78rem",letterSpacing:".1em",textTransform:"uppercase"}}>{pillar.label||meta.label}</span>
            </div>
            <div className="np-item-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:7}}>
              {(pillar.items||[]).map((item,i)=>(
                <div key={i} className="item-card" style={{background:meta.bg,border:"1px solid "+meta.border,borderRadius:14,padding:"clamp(12px,1.5vw,17px) clamp(8px,1.2vw,13px)",textAlign:"center",transition:"transform .18s, box-shadow .18s",animation:"fadeUp .3s ease "+(i*.05)+"s both"}}>
                  <div style={{fontSize:"clamp(26px,2.8vw,34px)",marginBottom:5}}>{item.emoji||"🌿"}</div>
                  <div style={{color:"#b8e8c4",fontSize:"clamp(.88rem,1.3vw,1rem)",fontWeight:600,marginBottom:4}}>{item.name}</div>
                  <div style={{color:"#4a7a56",fontSize:"clamp(.75rem,1.1vw,.84rem)",lineHeight:1.4}}>{item.benefit}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecipeList({ recipes, activeRecipe, setActiveRecipe, msgIdx }) {
  if(!recipes?.length)return null;
  return(
    <div style={{marginBottom:14}}>
      <div style={{color:"#4a9960",fontSize:".78rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:10}}>🍳 Recipes & protocols</div>
      {recipes.map((r,i)=>{
        const rid=msgIdx+"-"+i;
        const open=activeRecipe===rid;
        return(
          <div key={i} className="rc" style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(34,163,90,.16)",borderRadius:12,overflow:"hidden",marginBottom:7,transition:"border-color .18s"}}>
            <button onClick={()=>setActiveRecipe(open?null:rid)} style={{width:"100%",textAlign:"left",background:"transparent",border:"none",padding:"12px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{color:"#c8e8ce",fontSize:"clamp(.95rem,1.5vw,1.08rem)"}}>{r.emoji||"🍽️"} {r.name}</span>
              <span style={{color:"#3a6644",fontSize:".78rem",transform:open?"rotate(180deg)":"rotate(0deg)",transition:"transform .2s",display:"inline-block"}}>▼</span>
            </button>
            {open&&(
              <div style={{padding:"0 16px 14px",borderTop:"1px solid rgba(34,163,90,.1)"}}>
                {r.ingredients?.length>0&&<div style={{marginTop:10,marginBottom:9}}><div style={{color:"#3a6644",fontSize:".72rem",letterSpacing:".08em",textTransform:"uppercase",marginBottom:6}}>Ingredients</div><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{r.ingredients.map((g,j)=><span key={j} style={{background:"rgba(34,163,90,.09)",border:"1px solid rgba(34,163,90,.18)",borderRadius:20,padding:"3px 9px",color:"#8dc89e",fontSize:".82rem"}}>{g}</span>)}</div></div>}
                <div style={{color:"#3a6644",fontSize:".72rem",letterSpacing:".08em",textTransform:"uppercase",marginBottom:6}}>Steps</div>
                {(r.steps||[]).map((s,j)=>(
                  <div key={j} style={{display:"flex",gap:8,marginBottom:6,alignItems:"flex-start"}}>
                    <span style={{minWidth:22,height:22,borderRadius:"50%",background:"rgba(34,163,90,.18)",color:"#4ec97a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".76rem",fontWeight:700,flexShrink:0,marginTop:1}}>{j+1}</span>
                    <span style={{color:"#8dc89e",fontSize:".88rem",lineHeight:1.55}}>{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ResultCard({ result, isLast, onGetMore, activeRecipe, setActiveRecipe, msgIdx }) {
  if(!result)return null;
  // Guard: if result has no acknowledgment at all, don't render a broken card
  if(!result.acknowledgment && !result.pillars && !result.cards && !result.recipes) return null;

  const type = result.responseType || "initial";
  const moreBtn = isLast && (
    <div style={{textAlign:"right",marginTop:6}}>
      <button onClick={onGetMore} style={{background:"none",border:"none",color:"#3a6644",fontSize:".8rem",cursor:"pointer",fontStyle:"italic"}}>Get more searches →</button>
    </div>
  );

  // Safe acknowledgment — fall back to empty string so AckBubble doesn't crash
  const ack = result.acknowledgment || "";

  if(type==="initial") return(
    <div style={{animation:"slideUp .3s ease"}}>
      {ack && <AckBubble text={ack}/>}
      <PillarGrid pillars={result.pillars||[]}/>
      <RecipeList recipes={result.recipes||[]} activeRecipe={activeRecipe} setActiveRecipe={setActiveRecipe} msgIdx={msgIdx}/>
      <TipRow tip={result.tip}/>
      {isLast&&<WeekPlan plan={result.weekPlan}/>}
      {moreBtn}
    </div>
  );

  if(type==="items") return(
    <div style={{animation:"slideUp .3s ease"}}>
      {ack && <AckBubble text={ack} label="More for you"/>}
      <PillarGrid pillars={result.pillars||[]}/>
      <TipRow tip={result.tip}/>
      {moreBtn}
    </div>
  );

  if(type==="recipe") return(
    <div style={{animation:"slideUp .3s ease"}}>
      {ack && <AckBubble text={ack} label="Here is how"/>}
      <RecipeList recipes={result.recipes||[]} activeRecipe={activeRecipe} setActiveRecipe={setActiveRecipe} msgIdx={msgIdx}/>
      <TipRow tip={result.tip}/>
      {moreBtn}
    </div>
  );

  if(type==="insight"||type==="answer") {
    const label = type==="insight" ? "Here is the deeper picture" : "To answer your question";
    return(
      <div style={{animation:"slideUp .3s ease"}}>
        {ack && <AckBubble text={ack} label={label}/>}
        {(result.cards||[]).length>0 && (
          <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:14}}>
            {result.cards.map((card,i)=>{
              const meta=PILLAR_META[card.pillar]||PILLAR_META.food;
              return(
                <div key={i} style={{display:"flex",gap:14,alignItems:"flex-start",background:meta.bg,border:"1px solid "+meta.border,borderRadius:14,padding:"14px 16px",animation:"fadeUp .25s ease "+(i*.07)+"s both"}}>
                  <div style={{fontSize:"clamp(24px,2.8vw,30px)",lineHeight:1,flexShrink:0,marginTop:2}}>{card.emoji||"🌿"}</div>
                  <div>
                    <div style={{color:meta.color,fontSize:"clamp(.88rem,1.4vw,1rem)",fontWeight:600,marginBottom:4}}>{card.title}</div>
                    <div style={{color:"#6aaa80",fontSize:"clamp(.82rem,1.3vw,.95rem)",lineHeight:1.65}}>{card.body}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <TipRow tip={result.tip}/>
        {moreBtn}
      </div>
    );
  }

  // Fallback — only render what actually exists
  return(
    <div style={{animation:"slideUp .3s ease"}}>
      {ack && <AckBubble text={ack} label="Here is what I found"/>}
      {result.pillars?.length>0 && <PillarGrid pillars={result.pillars}/>}
      {result.recipes?.length>0 && <RecipeList recipes={result.recipes} activeRecipe={activeRecipe} setActiveRecipe={setActiveRecipe} msgIdx={msgIdx}/>}
      {result.cards?.length>0 && (
        <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:14}}>
          {result.cards.map((card,i)=>{
            const meta=PILLAR_META[card.pillar]||PILLAR_META.food;
            return(
              <div key={i} style={{display:"flex",gap:14,alignItems:"flex-start",background:meta.bg,border:"1px solid "+meta.border,borderRadius:14,padding:"14px 16px"}}>
                <div style={{fontSize:"clamp(24px,2.8vw,30px)",lineHeight:1,flexShrink:0,marginTop:2}}>{card.emoji||"🌿"}</div>
                <div>
                  <div style={{color:meta.color,fontSize:"clamp(.88rem,1.4vw,1rem)",fontWeight:600,marginBottom:4}}>{card.title}</div>
                  <div style={{color:"#6aaa80",fontSize:"clamp(.82rem,1.3vw,.95rem)",lineHeight:1.65}}>{card.body}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <TipRow tip={result.tip}/>
      {moreBtn}
    </div>
  );
}

function PricingPage({ onBack, user, onCreditsAdded }) {
  const [processing, setProcessing] = useState(null);

  const CREDITS_MAP = {
    "price_1T8hNmCJF4DF72elItDLqZIp": 10,
    "price_1T8hOyCJF4DF72elWJQpeY94": 40,
    "price_1T8hPUCJF4DF72el0FctAFJv": 9999,
  };

  const openCheckout = async (t) => {
    if (!window.Stripe) { alert("Payment system loading, please try again in a moment."); return; }
    if (!user) { alert("Please sign in first to purchase a plan."); setShowAuth(true); return; }
    setProcessing(t.stripeId);
    try {
      const resp = await fetch("/.netlify/functions/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: t.stripeId, email: user.email, tier: t.name }),
      });
      const data = await resp.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Checkout error: " + (data.error || "Unknown error"));
        setProcessing(null);
      }
    } catch(e) {
      setProcessing(null);
      alert("Checkout error: " + e.message);
    }
  };;
  return(
    <div style={{minHeight:"100vh",background:"#0b1a0d",color:"#e0ede2",fontFamily:"'Georgia',serif"}}>
      <div style={{position:"relative",zIndex:1,maxWidth:1060,margin:"0 auto",padding:"0 22px 90px"}}>
        <div style={{padding:"24px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={onBack} style={{background:"none",border:"none",color:"#4a7a56",fontSize:".82rem",cursor:"pointer"}}>← Back</button>
          <span style={{color:"#4a7a56",fontSize:".82rem",display:"flex",alignItems:"center",gap:6}}><span style={{animation:"float 4s ease-in-out infinite",display:"inline-block"}}>🌿</span> foodnfitness.ai</span>
        </div>
        <div style={{textAlign:"center",padding:"52px 0 60px",animation:"fadeUp .6s ease"}}>
          <div style={{display:"inline-block",background:"rgba(34,163,90,.1)",border:"1px solid rgba(34,163,90,.22)",borderRadius:40,padding:"5px 17px",fontSize:".7rem",letterSpacing:".18em",textTransform:"uppercase",color:"#4ec97a",marginBottom:22}}>Simple, honest pricing</div>
          <h1 style={{fontSize:"clamp(2.2rem,5.5vw,3.6rem)",fontWeight:400,color:"#c8ecd4",lineHeight:1.15,letterSpacing:"-.02em",marginBottom:14}}>Eat well. Move well.<br/><em style={{color:"#4ec97a"}}>Start for $3.</em></h1>
          <p style={{color:"#3a6644",fontSize:"clamp(.88rem,2vw,.98rem)",maxWidth:440,margin:"0 auto",lineHeight:1.8}}>Food, fitness, breathwork and sleep — all in one place.</p>
        </div>
        <div className="np-tier-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))",gap:18,animation:"fadeUp .6s ease .1s both"}}>
          {TIERS.map((t,i)=>(
            <div key={t.name} className="tier-card" style={{position:"relative",background:t.highlight?"linear-gradient(155deg,rgba(34,163,90,.13),rgba(15,55,28,.18))":"rgba(255,255,255,.03)",border:t.highlight?"1px solid rgba(34,163,90,.38)":"1px solid rgba(255,255,255,.07)",borderRadius:22,padding:"34px 28px",display:"flex",flexDirection:"column",animation:"fadeUp .5s ease "+(.1+i*.09)+"s both"}}>
              {t.badge&&<div style={{position:"absolute",top:-13,left:"50%",transform:"translateX(-50%)",background:"linear-gradient(135deg,#22a35a,#1a7a44)",borderRadius:40,padding:"4px 16px",fontSize:".76rem",letterSpacing:".11em",textTransform:"uppercase",color:"#e8f5eb",fontWeight:600,whiteSpace:"nowrap",animation:"pulseRing 2.5s ease infinite"}}>✦ {t.badge}</div>}
              <div style={{fontSize:".78rem",letterSpacing:".14em",textTransform:"uppercase",color:t.highlight?"#4ec97a":"#2e5535",marginBottom:16}}>{t.name}</div>
              <div style={{marginBottom:4}}><span style={{fontSize:"clamp(2.6rem,5vw,3.2rem)",fontWeight:400,color:"#c8ecd4",letterSpacing:"-.03em",lineHeight:1}}>{t.price}</span><span style={{color:"#2e5535",fontSize:".78rem",marginLeft:5}}>{t.per}</span></div>
              <div style={{color:"#a8ddb5",fontSize:".92rem",marginBottom:4}}>{t.searches}</div>
              <div style={{display:"inline-block",background:"rgba(34,163,90,.07)",border:"1px solid rgba(34,163,90,.14)",borderRadius:20,padding:"3px 12px",fontSize:".8rem",color:"#3a6644",marginBottom:20,alignSelf:"flex-start"}}>{t.rate}</div>
              <p style={{color:"#2e5535",fontSize:".9rem",lineHeight:1.7,marginBottom:22,fontStyle:"italic"}}>{t.desc}</p>
              <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:28,flex:1}}>{t.features.map((f,j)=><div key={j} style={{display:"flex",gap:8,alignItems:"flex-start"}}><span style={{color:"#22a35a",fontSize:".82rem",marginTop:1,flexShrink:0}}>✓</span><span style={{color:"#5a8a6a",fontSize:".9rem",lineHeight:1.55}}>{f}</span></div>)}</div>
              <button className="cta-btn" onClick={()=>openCheckout(t)} disabled={processing===t.stripeId} style={{background:t.highlight?"linear-gradient(135deg,#22a35a,#1a7a44)":"rgba(255,255,255,.05)",border:t.highlight?"none":"1px solid rgba(80,180,100,.22)",borderRadius:12,padding:"13px 20px",color:t.highlight?"#e8f5eb":"#6aaa80",fontSize:".86rem",cursor:processing===t.stripeId?"wait":"pointer",fontWeight:t.highlight?600:400,width:"100%",boxShadow:t.highlight?"0 4px 20px rgba(34,163,90,.22)":"none",opacity:processing&&processing!==t.paddleId?.6:1}}>{processing===t.stripeId?"Processing…":t.cta+" →"}</button>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",marginTop:42,display:"flex",justifyContent:"center",gap:24,flexWrap:"wrap"}}>
          {["🔒 Secure via Stripe","↩️ Cancel anytime","🥗 Food · 💪 Fitness · 🌬️ Breath · 🌙 Sleep"].map((s,i)=><span key={i} style={{color:"#1e3d25",fontSize:".86rem"}}>{s}</span>)}
        </div>
        <div style={{maxWidth:580,margin:"64px auto 0"}}>
          <h2 style={{textAlign:"center",fontSize:"1.45rem",fontWeight:400,color:"#a8ddb5",marginBottom:32}}>Questions</h2>
          {[["What does one search cover?","Each search returns food recommendations, exercises, breathwork techniques and sleep tips — all relevant to your query. 1 credit covers all pillars."],["Do credits roll over?","Starter credits never expire. Monthly plan credits reset on your billing date."],["Can I switch plans?","Yes — upgrade or downgrade any time. Changes apply from your next billing date."],["How do I cancel?","One click in your account settings. No calls, no forms, no guilt."]].map(([q,a],i)=>(
            <div key={i} style={{borderBottom:"1px solid rgba(80,180,100,.09)",padding:"18px 0"}}>
              <div style={{color:"#a8ddb5",fontSize:"1rem",marginBottom:6}}>{q}</div>
              <div style={{color:"#2e5535",fontSize:".9rem",lineHeight:1.75}}>{a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchBar({ value, onChange, onSubmit, loading, hasConvo, placeholder }) {
  return(
    <div className="search-ring" style={{background:"rgba(255,255,255,.055)",border:"1.5px solid rgba(80,180,100,.28)",borderRadius:28,padding:"clamp(6px,1vw,10px) clamp(6px,1vw,10px) clamp(6px,1vw,10px) clamp(18px,2vw,26px)",display:"flex",alignItems:"center",gap:10,transition:"border-color .2s, box-shadow .2s",boxShadow:"0 2px 24px rgba(34,163,90,.07)"}}>
      <span style={{fontSize:16,opacity:.4,flexShrink:0}}>🔍</span>
      <input value={value} onChange={e=>onChange(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!loading&&onSubmit(value)} placeholder={placeholder||"How are you feeling? What do you want to improve?"} style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#c8e8ce",fontSize:"clamp(1rem,1.7vw,1.15rem)",padding:"clamp(12px,1.5vw,17px) 0",caretColor:"#4ec97a",minWidth:0}}/>
      <button onClick={()=>onSubmit(value)} disabled={!value.trim()||loading} style={{background:value.trim()&&!loading?"linear-gradient(135deg,#22a35a,#1a7a44)":"rgba(34,163,90,.13)",border:"none",borderRadius:"clamp(14px,1.5vw,20px)",padding:"clamp(10px,1.2vw,15px) clamp(18px,2.5vw,32px)",color:"#e8f5eb",fontSize:"clamp(.96rem,1.5vw,1.1rem)",cursor:value.trim()&&!loading?"pointer":"default",fontWeight:600,whiteSpace:"nowrap",transition:"background .18s",flexShrink:0}}>
        {loading?<span style={{display:"inline-block",animation:"spin 1s linear infinite"}}>🌿</span>:(hasConvo?"Ask →":"Search")}
      </button>
    </div>
  );
}

function ChipSection({ onQuery }) {
  const [activePillar,setActivePillar]=useState("food");
  const pillars=["food","exercise","breath","sleep"];
  const filtered=SUGGESTIONS.filter(s=>s.pillar===activePillar);
  const meta=PILLAR_META[activePillar];
  return(
    <div>
      <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:14,flexWrap:"wrap",padding:"0 20px"}}>
        {pillars.map(p=>{const m=PILLAR_META[p];const active=activePillar===p;return(
          <button key={p} className="pillar-tab" onClick={()=>setActivePillar(p)} style={{background:active?m.bg:"rgba(255,255,255,.04)",border:"1px solid "+(active?m.border:"rgba(255,255,255,.1)"),borderRadius:30,padding:"7px 16px",color:active?m.color:"#2e5535",fontSize:".84rem",cursor:"pointer",display:"flex",alignItems:"center",gap:6,transition:"all .18s"}}>
            <span>{m.icon}</span><span>{m.label}</span>
          </button>
        );})}
      </div>
      <div className="np-chips-wrap" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"clamp(7px,.9vw,11px)",padding:"0 clamp(20px,4vw,60px) 16px"}}>
        {filtered.map(s=>(
          <button key={s.label} onClick={()=>onQuery(s.query)} className="chip-btn"
            style={{background:meta.bg,border:"1px solid "+meta.border,borderRadius:40,padding:"clamp(8px,1vw,12px) clamp(10px,1.5vw,16px)",display:"flex",alignItems:"center",gap:7,color:meta.color,fontSize:"clamp(.88rem,1.3vw,1rem)",cursor:"pointer",transition:"all .14s",justifyContent:"center",textAlign:"center"}}>
            <span style={{fontSize:14}}>{s.emoji}</span><span>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── HISTORY MODAL ────────────────────────────────────────────────────────────

function HistoryModal({ onClose, onLoad }) {
  const [convs, setConvs] = useState(loadConversations);
  const fmt = (ts) => {
    const d = new Date(ts), now = new Date();
    const diff = now - d;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return Math.floor(diff/60000)+"m ago";
    if (diff < 86400000) return Math.floor(diff/3600000)+"h ago";
    if (diff < 604800000) return Math.floor(diff/86400000)+"d ago";
    return d.toLocaleDateString();
  };
  const del = (id, e) => { e.stopPropagation(); deleteConversation(id); setConvs(loadConversations()); };
  return (
    <Modal onClose={onClose} maxWidth={480}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <span style={{color:"#a8ddb5",fontSize:"1.05rem"}}>🕐 Conversation history</span>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#3a6644",cursor:"pointer",fontSize:"1.1rem"}}>✕</button>
      </div>
      {convs.length===0
        ? <div style={{color:"#2e5535",fontSize:".9rem",textAlign:"center",padding:"30px 0",fontStyle:"italic"}}>No saved conversations yet.<br/>Complete a search and it will appear here.</div>
        : <div style={{display:"flex",flexDirection:"column",gap:7,maxHeight:400,overflowY:"auto"}}>
            {convs.map(c=>(
              <div key={c.id} onClick={()=>{onLoad(c.messages);onClose();}}
                style={{background:"rgba(34,163,90,.06)",border:"1px solid rgba(34,163,90,.16)",borderRadius:12,padding:"12px 14px",cursor:"pointer",transition:"all .15s",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(34,163,90,.12)"}
                onMouseLeave={e=>e.currentTarget.style.background="rgba(34,163,90,.06)"}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:"#c8e8ce",fontSize:".88rem",lineHeight:1.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.title}</div>
                  <div style={{color:"#2e5535",fontSize:".74rem",marginTop:3}}>{fmt(c.date)} · {c.messages.filter(m=>m.role==="user").length} search{c.messages.filter(m=>m.role==="user").length!==1?"es":""}</div>
                </div>
                <button onClick={(e)=>del(c.id,e)} style={{background:"none",border:"none",color:"#2a4a30",cursor:"pointer",fontSize:".82rem",padding:"2px 4px",flexShrink:0,borderRadius:6,transition:"color .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.color="#f09090"}
                  onMouseLeave={e=>e.currentTarget.style.color="#2a4a30"}>✕</button>
              </div>
            ))}
          </div>
      }
      {convs.length>0&&<div style={{color:"#1e3d25",fontSize:".74rem",textAlign:"center",marginTop:14,fontStyle:"italic"}}>Click any conversation to restore it</div>}
    </Modal>
  );
}

// ─── LOGO SVG ─────────────────────────────────────────────────────────────────

function FnfLogo({ size = 40, animated = false }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{display:"block", flexShrink:0, animation: animated ? "float 5s ease-in-out infinite" : "none"}}>

      {/* ── Apple body outline (heart-shaped bottom, rounded top) ── */}
      <path
        d="M50 88 C28 72 14 56 14 40 C14 26 24 18 36 20 C41 21 46 24 50 28 C54 24 59 21 64 20 C76 18 86 26 86 40 C86 56 72 72 50 88Z"
        fill="none"
        stroke="#22a35a"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {/* ── Leaf ── */}
      <ellipse cx="44" cy="13" rx="6" ry="10" transform="rotate(-30 44 13)" fill="#22a35a" opacity="0.9"/>

      {/* ── Stem ── */}
      <path d="M50 20 C50 17 48 13 46 11" stroke="#4a7a56" strokeWidth="2.5" strokeLinecap="round"/>

      {/* ── Fork (left) ── */}
      {/* tines */}
      <line x1="33" y1="34" x2="33" y2="42" stroke="#4ec97a" strokeWidth="2" strokeLinecap="round"/>
      <line x1="36" y1="34" x2="36" y2="42" stroke="#4ec97a" strokeWidth="2" strokeLinecap="round"/>
      <line x1="39" y1="34" x2="39" y2="42" stroke="#4ec97a" strokeWidth="2" strokeLinecap="round"/>
      {/* neck */}
      <path d="M33 42 Q36 46 36 50 L36 62" stroke="#4ec97a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>

      {/* ── Dumbbell (right) ── */}
      {/* bar */}
      <line x1="55" y1="48" x2="72" y2="48" stroke="#a8ddb5" strokeWidth="3" strokeLinecap="round"/>
      {/* left weight plate */}
      <rect x="52" y="42" width="6" height="12" rx="2" fill="#5a9a6a"/>
      {/* right weight plate */}
      <rect x="69" y="42" width="6" height="12" rx="2" fill="#5a9a6a"/>
      {/* left collar */}
      <rect x="57" y="44" width="3" height="8" rx="1" fill="#22a35a"/>
      {/* right collar */}
      <rect x="67" y="44" width="3" height="8" rx="1" fill="#22a35a"/>
    </svg>
  );
}

export default function App() {
  const [page,setPage]=useState("home");
  const [user,setUser]=useState(getUser);
  const [showAuth,setShowAuth]=useState(false);
  const [authMode,setAuthMode]=useState("login");
  const [showProfile,setShowProfile]=useState(false);
  const [showNoCredits,setShowNoCredits]=useState(false);
  const [showSignUp,setShowSignUp]=useState(false);
  const [guestSearches,setGuestSearches]=useState(()=>{try{return parseInt(localStorage.getItem("np_guest_searches")||"0");}catch{return 0;}});
  const getGuestCount=()=>{try{return parseInt(localStorage.getItem("np_guest_searches")||"0");}catch{return 0;}};
  const [messages,setMessages]=useState([]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [activeRecipe, setActiveRecipe] = useState(null);
  const bottomRef=useRef(null);
  const userRef=useRef(user);
  const hasConvo=messages.length>0;

  useEffect(()=>{userRef.current=user;},[user]);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[messages,loading]);

  // Restore Supabase session on load (handles cross-device login)
  useEffect(()=>{
    supabase.auth.getSession().then(async({data:{session}})=>{
      if(session?.user){
        const profile=await fetchProfile(session.user.id);
        if(profile){
          const u={id:session.user.id,name:profile.name,email:profile.email,allergies:profile.allergies||[],credits:profile.credits??3,sex:profile.sex||"",history:profile.history||[]};
          saveUser(u);setUser(u);userRef.current=u;
        }
      }
    });
    // Handle Stripe payment success redirect
    const params = new URLSearchParams(window.location.search);
    if(params.get("payment")==="success"){
      window.history.replaceState({},"","/");
      setTimeout(async()=>{
        // Re-fetch profile to get updated credits from webhook
        const {data:{session}}=await supabase.auth.getSession();
        if(session?.user){
          const profile=await fetchProfile(session.user.id);
          if(profile){
            const u={id:session.user.id,name:profile.name,email:profile.email,allergies:profile.allergies||[],credits:profile.credits??3,sex:profile.sex||"",history:profile.history||[]};
            saveUser(u);setUser(u);userRef.current=u;
            alert("✅ Payment successful! Your credits have been added.");
          }
        }
      }, 2000);
    }
    // Listen for auth changes (e.g. password reset redirect)
    const {data:{subscription}}=supabase.auth.onAuthStateChange(async(event,session)=>{
      if(event==="SIGNED_OUT"){clearUser();setUser(null);userRef.current=null;}
    });
    return()=>subscription.unsubscribe();
  },[]);

  const handleAuth=(u)=>{
    setUser(u);userRef.current=u;setShowAuth(false);setShowSignUp(false);
    localStorage.removeItem("np_guest_searches");setGuestSearches(0);
    if(window.posthog){window.posthog.identify(u.email,{name:u.name,email:u.email});window.posthog.capture("signed_up");}
  };
  const handleLogout=()=>{setUser(null);userRef.current=null;setMessages([]);setShowProfile(false);};

  const recordSuccess=async(isFollowUp,q)=>{
    const cu=userRef.current; if(!cu)return;
    const newCredits=Math.max(0,parseFloat(((cu.credits??0)-1).toFixed(1)));
    const newHistory=[...(cu.history||[]),{query:q,date:Date.now()}].slice(-50);
    const updated={...cu,credits:newCredits,history:newHistory};
    saveUser(updated);setUser(updated);userRef.current=updated;
    // Persist credit deduction and history to Supabase
    if(cu.id) await upsertProfile(cu.id,{credits:newCredits,history:newHistory});
  };

  const fetchWeekPlan=async(concern)=>{
    try{
      const cu=userRef.current;
      const res=await fetch("/.netlify/functions/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2200,system:buildWeekPlanPrompt(cu,concern),messages:[{role:"user",content:"Create a 7-day holistic wellness plan for: "+concern}]})});
      if(!res.ok)return;
      const data=JSON.parse(await res.text());
      const raw=(data.content||[]).map(b=>b.text||"").join("").trim();
      const plan=safeParseJSON(raw,true);
      if(!Array.isArray(plan)||plan.length===0)return;
      setMessages(p=>{const u=[...p];for(let i=u.length-1;i>=0;i--){if(u[i].role==="assistant"&&u[i].result){u[i]={...u[i],result:{...u[i].result,weekPlan:plan}};break;}}return u;});
    }catch(_){}
  };

  const handleQuery=async(query)=>{
    const q=query.trim();if(!q||loading)return;
    const isFollowUp=messages.some(m=>m.role==="assistant");
    if(!user){const c=getGuestCount();if(c>=1){setShowSignUp(true);return;}const n=c+1;localStorage.setItem("np_guest_searches",String(n));setGuestSearches(n);}
    if(user&&(user.credits??0)<1){setShowNoCredits(true);return;}
    const apiMessages=[];
    messages.forEach(m=>{if(m.role==="user")apiMessages.push({role:"user",content:m.content});else if(m.result)apiMessages.push({role:"assistant",content:m.result.acknowledgment||""});});
    apiMessages.push({role:"user",content:q});
    setMessages(p=>[...p,{role:"user",content:q}]);setInput("");setError(null);setLoading(true);
    try{
      const res=await fetch("/.netlify/functions/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,system:buildPrompt(userRef.current,isFollowUp),messages:apiMessages})});
      const text=await res.text();
      if(!res.ok)throw new Error("Server error "+res.status+": "+text.slice(0,180));
      const data=JSON.parse(text);
      const raw=(data.content||[]).map(b=>b.text||"").join("").trim();
      if(!raw)throw new Error("Empty response from AI.");
      const result=safeParseJSON(raw,false);
      if(!result.acknowledgment)throw new Error("Unexpected response shape.");
      setMessages(p=>{
        const updated=[...p,{role:"assistant",content:result.acknowledgment,result}];
        if (user) saveConversation(updated);
        return updated;
      });
      recordSuccess(isFollowUp,q);
      if(window.posthog)window.posthog.capture("search_completed",{query:q,is_follow_up:isFollowUp,pillar_count:(result.pillars||[]).length});
      fetchWeekPlan(q);
    }catch(e){setError(e.message);}finally{setLoading(false);}
  };

  const reset=()=>{setMessages([]);setError(null);setInput("");};
  const handleCreditsAdded = async (credits, tierName) => {
    if (!user) return;
    const newCredits = (user.credits ?? 0) + credits;
    const updated = { ...user, credits: newCredits, tier: tierName };
    saveUser(updated); setUser(updated); userRef.current = updated;
    // Persist to Supabase
    if(user.id) await upsertProfile(user.id, { credits: newCredits, tier: tierName });
    if(window.posthog)window.posthog.capture("payment_completed",{tier:tierName,credits_added:credits});
  };

  if(page==="pricing")return(<><style>{CSS}</style><PricingPage onBack={()=>setPage("home")} user={user} onCreditsAdded={handleCreditsAdded}/></>);

  return(
    <div style={{minHeight:"100vh",background:"#0b1a0d",color:"#e0ede2"}}>
      <style>{CSS}</style>
      {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} onAuth={handleAuth} defaultMode={authMode}/>}
      {showProfile&&user&&<ProfileModal user={user} onClose={()=>setShowProfile(false)} onUpdate={u=>{setUser(u);setShowProfile(false);}} onLogout={handleLogout} onUpgrade={()=>{setShowProfile(false);setPage("pricing");}}/>}
      {showNoCredits&&<NoCreditsModal onClose={()=>setShowNoCredits(false)} onViewPlans={()=>{setShowNoCredits(false);setPage("pricing");}}/>}
      {showSignUp&&<SignUpPrompt onClose={()=>setShowSignUp(false)} onSignUp={()=>{setShowSignUp(false);setAuthMode("signup");setShowAuth(true);}}/>}
      {showHistory && <HistoryModal onClose={()=>setShowHistory(false)} onLoad={(msgs)=>{setMessages(msgs);setInput("");setError(null);}}/>}
      <div style={{position:"fixed",inset:0,background:"#0b1a0d",zIndex:0,pointerEvents:"none"}}/>
      <div style={{position:"relative",zIndex:1,maxWidth:1100,margin:"0 auto",padding:"0 0 80px",overflowX:"hidden",minHeight:"100vh"}}>

        {/* NAV */}
        <nav style={{padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(80,180,100,.07)"}}>
          <button onClick={reset} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
            <FnfLogo size={36} animated={!hasConvo}/>
            <span style={{color:"#5a9a6a",fontSize:"clamp(.9rem,1.4vw,1.05rem)",letterSpacing:".03em",fontWeight:600}}>foodnfitness<span style={{color:"#22a35a"}}>.ai</span></span>
          </button>
          <div style={{display:"flex",gap:7,alignItems:"center"}}>

            <button onClick={()=>setPage("pricing")} style={{background:"none",border:"1px solid rgba(80,180,100,.17)",borderRadius:20,padding:"clamp(6px,.7vw,9px) clamp(14px,1.6vw,22px)",color:"#2e5535",fontSize:"clamp(.82rem,1.2vw,.95rem)",cursor:"pointer"}}>Pricing</button>
            {user && <button onClick={()=>setShowHistory(true)} style={{background:"none",border:"1px solid rgba(80,180,100,.17)",borderRadius:20,padding:"clamp(6px,.7vw,9px) clamp(14px,1.6vw,22px)",color:"#2e5535",fontSize:"clamp(.82rem,1.2vw,.95rem)",cursor:"pointer"}}>History</button>}
            {user
              ?<button onClick={()=>setShowProfile(true)} style={{background:"rgba(34,163,90,.1)",border:"1px solid rgba(34,163,90,.24)",borderRadius:20,padding:"4px 12px",color:"#4ec97a",fontSize:".78rem",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                <span>👤 {user.name.split(" ")[0]}</span>
                <span style={{background:"rgba(34,163,90,.18)",borderRadius:10,padding:"1px 7px",color:(user.credits??0)<=1?"#f09090":(user.credits??0)<=2?"#ffc85a":"#4ec97a",fontSize:".76rem",fontWeight:600}}>{user.credits??0}cr</span>
              </button>
              :<button onClick={()=>{setAuthMode("login");setShowAuth(true);}} style={{background:"linear-gradient(135deg,#22a35a,#1a7a44)",border:"none",borderRadius:20,padding:"5px 15px",color:"#e8f5eb",fontSize:".78rem",cursor:"pointer",fontWeight:600}}>Sign in</button>
            }
          </div>
        </nav>

        {/* HOME - always mounted, just hidden when convo starts */}
        <div style={{display: hasConvo ? "none" : "block"}}>
            <div style={{textAlign:"center",padding:"clamp(36px,6vw,72px) clamp(24px,8vw,120px) clamp(20px,3vw,36px)"}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:18}}>
                <FnfLogo size={80} animated={true}/>
              </div>
              <h1 style={{fontSize:"clamp(2.2rem,5vw,4.2rem)",fontWeight:400,color:"#a8ddb5",margin:"0 0 10px",letterSpacing:"-.02em"}}>How are you feeling today?</h1>
              <p style={{color:"#3a6644",fontSize:"clamp(1rem,1.9vw,1.2rem)",fontStyle:"italic",margin:"0 0 6px"}}>Food · Fitness · Breathwork · Sleep</p>
              <p style={{color:"#2a4a30",fontSize:"clamp(.88rem,1.5vw,1.02rem)",lineHeight:1.75,margin:"0 0 14px"}}>Describe what you are going through — we will build your personalised wellness plan</p>
              <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:8,marginTop:6,marginBottom:4}}>
                {user?.allergies?.length>0&&<div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(200,70,70,.07)",border:"1px solid rgba(200,70,70,.17)",borderRadius:20,padding:"3px 12px"}}><span style={{color:"#8a5050",fontSize:".82rem"}}>🚫 Avoiding: {user.allergies.join(", ")}</span></div>}
                {user?.sex&&<div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(34,163,90,.07)",border:"1px solid rgba(34,163,90,.18)",borderRadius:20,padding:"3px 12px"}}><span style={{color:"#4a7a56",fontSize:".82rem"}}>{user.sex==="female"?"♀️ Female profile":"♂️ Male profile"}</span></div>}
                {user&&!user.sex&&<button onClick={()=>setShowProfile(true)} style={{background:"none",border:"1px dashed rgba(34,163,90,.25)",borderRadius:20,padding:"3px 12px",color:"#2a4a30",fontSize:".78rem",cursor:"pointer",fontFamily:"'Georgia',serif",fontStyle:"italic"}}>+ Add your sex for personalised results</button>}
              </div>
            </div>
            <div style={{padding:"0 clamp(20px,5vw,80px) 20px"}}>
              <SearchBar value={input} onChange={setInput} onSubmit={handleQuery} loading={loading} hasConvo={false} placeholder="e.g. I feel exhausted, anxious and cannot sleep..."/>
            </div>
            <div style={{margin:"0 clamp(20px,5vw,80px) 20px",background:"rgba(255,200,70,.04)",border:"1px solid rgba(255,200,70,.12)",borderRadius:12,padding:"10px 14px",display:"flex",gap:9,alignItems:"flex-start"}}>
              <span style={{fontSize:13,flexShrink:0,marginTop:1,opacity:.7}}>⚠️</span>
              <p style={{margin:0,color:"#6a5e2a",fontSize:"clamp(.8rem,1.2vw,.92rem)",lineHeight:1.65}}><strong style={{color:"#8a7a30"}}>Disclaimer:</strong> foodnfitness.ai provides general wellness suggestions only. Always consult a healthcare professional before making changes to diet, exercise or medication.</p>
            </div>
            <div style={{padding:"0 0 10px"}}>
              <div style={{display:"flex",alignItems:"center",gap:11,padding:"0 20px",marginBottom:14}}>
                <div style={{flex:1,height:1,background:"rgba(80,180,100,.09)"}}/>
                <span style={{color:"#1e3d25",fontSize:"clamp(.8rem,1.2vw,.92rem)",letterSpacing:".1em",whiteSpace:"nowrap"}}>or pick a topic</span>
                <div style={{flex:1,height:1,background:"rgba(80,180,100,.09)"}}/>
              </div>
              <ChipSection onQuery={handleQuery}/>
            </div>
            {!user&&<div style={{textAlign:"center",padding:"12px 0 8px"}}>
              <button onClick={()=>{setAuthMode("signup");setShowAuth(true);}} style={{background:"linear-gradient(135deg,rgba(34,163,90,.18),rgba(34,163,90,.08))",border:"1px solid rgba(34,163,90,.4)",borderRadius:24,padding:"10px 28px",color:"#4ec97a",fontSize:".95rem",cursor:"pointer",fontFamily:"'Georgia',serif",fontWeight:600,letterSpacing:".02em",boxShadow:"0 2px 16px rgba(34,163,90,.15)",transition:"all .18s"}}>
                ✦ Sign up free — get 3 credits
              </button>
            </div>}
        </div>

        {/* CHAT - always mounted, shown when convo starts */}
        <div style={{display: hasConvo ? "block" : "none"}}>
          <div style={{minHeight:"80vh",display:"flex",flexDirection:"column"}}>
            <div style={{padding:"16px 20px 0"}}>
              {messages.map((msg,idx)=>(
                <div key={idx} style={{marginBottom:msg.role==="user"?8:24,minHeight:0}}>
                  {msg.role==="user"&&<div style={{display:"flex",justifyContent:"flex-end"}}><div style={{display:"inline-block",background:"rgba(34,163,90,.14)",border:"1px solid rgba(34,163,90,.22)",borderRadius:"18px 18px 4px 18px",padding:"10px 16px",maxWidth:"82%",color:"#c8e8ce",fontSize:".88rem",lineHeight:1.6}}>{msg.content}</div></div>}
                  {msg.role==="assistant"&&<ResultCard result={msg.result} isLast={idx===messages.length-1} onGetMore={()=>setPage("pricing")} activeRecipe={activeRecipe} setActiveRecipe={setActiveRecipe} msgIdx={idx}/>}
                </div>
              ))}
              {loading&&<div style={{display:"flex",alignItems:"center",gap:10,padding:"24px 0",animation:"fadeIn .15s ease"}}><span style={{fontSize:22,display:"inline-block",animation:"spin 1.8s linear infinite"}}>🌿</span><span style={{color:"#4a9960",fontSize:"1rem",fontStyle:"italic",animation:"pulse 2s ease infinite"}}>Building your wellness plan...</span></div>}
              {error&&<div style={{background:"rgba(200,60,60,.08)",border:"1px solid rgba(200,60,60,.18)",borderRadius:10,padding:"11px 15px",color:"#f09090",fontSize:".82rem",marginBottom:12,lineHeight:1.6}}>⚠️ {error}<button onClick={()=>setError(null)} style={{background:"none",border:"none",color:"#f09090",cursor:"pointer",float:"right",fontSize:".82rem"}}>✕</button></div>}
              <div ref={bottomRef}/>
            </div>
            <div style={{padding:"10px clamp(16px,3vw,32px) clamp(16px,2vw,24px)",borderTop:"1px solid rgba(80,180,100,.07)",marginTop:4}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <button onClick={reset} style={{background:"none",border:"none",color:"#3a6644",fontSize:".82rem",cursor:"pointer"}}>← Start over</button>
                <span style={{color:"#1a3020",fontSize:".78rem"}}>
                  {(()=>{
                    if(user)return messages.filter(m=>m.role==="user").length+" search"+(messages.filter(m=>m.role==="user").length!==1?"es":"")+" · "+(user.credits??0)+" cr left";
                    const g=getGuestCount();
                    if(g>=1)return <span style={{color:"#f09090",fontWeight:500}}>No free searches left — <button onClick={()=>{setAuthMode("signup");setShowAuth(true);}} style={{background:"none",border:"none",color:"#4ec97a",cursor:"pointer",fontFamily:"'Georgia',serif",fontSize:"inherit",padding:0,textDecoration:"underline"}}>sign up free</button></span>;
                    return "1 free search — sign up for 3 credits";
                  })()}
                </span>
              </div>
              <SearchBar value={input} onChange={setInput} onSubmit={handleQuery} loading={loading} hasConvo={true} placeholder="Ask a follow-up — food, exercise, breathwork, sleep..."/>
            </div>
          </div>
        </div>

        <div style={{display: hasConvo ? "none" : "block", textAlign:"center",padding:"24px 0 8px"}}><div style={{color:"#3a6644",fontSize:".82rem",letterSpacing:".06em",marginBottom:8}}>foodnfitness.ai · Eat well. Move well. Live well. · Not medical advice</div><div style={{display:"flex",justifyContent:"center",gap:20}}><a href="/terms.html" style={{color:"#2a5435",fontSize:".75rem",textDecoration:"none"}}>Terms</a><a href="/privacy.html" style={{color:"#2a5435",fontSize:".75rem",textDecoration:"none"}}>Privacy</a><a href="/refund.html" style={{color:"#2a5435",fontSize:".75rem",textDecoration:"none"}}>Refund Policy</a></div></div>
      </div>
    </div>
  );
}
