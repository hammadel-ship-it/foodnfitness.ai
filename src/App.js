import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// --- SUPABASE -----------------------------------------------------------------
const SUPA_URL  = process.env.REACT_APP_SUPABASE_URL;
const SUPA_KEY  = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase  = createClient(SUPA_URL, SUPA_KEY);

// --- DATA ---------------------------------------------------------------------

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
  food:     { label:"Food & Nutrition",    color:"#6fcf97", bg:"rgba(30,112,64,.1)",  border:"rgba(30,112,64,.25)",  icon:"🥗" },
  exercise: { label:"Exercise & Movement", color:"#1e6fa8", bg:"rgba(26,122,191,.1)", border:"rgba(26,122,191,.28)", icon:"💪" },
  breath:   { label:"Breathwork & Stress", color:"#6b4fc8", bg:"rgba(107,72,200,.1)",border:"rgba(107,79,200,.25)",icon:"🌬️" },
  sleep:    { label:"Sleep & Recovery",    color:"#2060a0", bg:"rgba(42,106,176,.1)", border:"rgba(32,96,160,.25)", icon:"🌙" },
};

const ALLERGIES = ["Gluten","Dairy","Nuts","Soy","Eggs","Shellfish","Fish","Sesame"];

// Pricing removed  app is now free

// --- SYSTEM PROMPT ---------------------------------------------------------

const VARIETY_SEEDS = [
  "Draw from Ayurvedic, Mediterranean, and East Asian wellness traditions.",
  "Focus on evidence-based nutrition science and sports physiology.",
  "Draw from traditional Chinese medicine and modern functional medicine.",
  "Blend Scandinavian lifestyle principles with modern nutritional science.",
  "Focus on gut-brain axis research and microbiome-supporting recommendations.",
  "Draw from Japanese longevity research and Blue Zone dietary patterns.",
  "Focus on hormonal balance, circadian rhythm, and chronobiology.",
  "Blend ancient herbal traditions with modern adaptogen science.",
];

const TIME_CONTEXT = () => {
  const h = new Date().getHours();
  if (h < 6)  return "It is very early morning (before 6am). Suggest gentle, restorative practices.";
  if (h < 10) return "It is morning. Energising, activating recommendations are ideal.";
  if (h < 14) return "It is midday. Focus on sustaining energy and mental clarity.";
  if (h < 18) return "It is afternoon. Recommendations should support sustained energy without disrupting sleep.";
  if (h < 21) return "It is evening. Wind-down, recovery and sleep-prep recommendations are ideal.";
  return "It is late evening or night. Prioritise calming, sleep-supporting recommendations only.";
};

const SEASON_CONTEXT = () => {
  const m = new Date().getMonth();
  if (m <= 1 || m === 11) return "It is winter. Prioritise warming foods, immunity, vitamin D, and cosy indoor practices.";
  if (m <= 4) return "It is spring. Emphasise cleansing foods, fresh produce, and renewed energy.";
  if (m <= 7) return "It is summer. Focus on hydration, cooling foods, and outdoor movement.";
  return "It is autumn. Prioritise grounding foods, immune preparation, and sleep hygiene.";
};

const buildPrompt = (user, isFollowUp) => {
  const allergy = user?.allergies?.length
    ? "CRITICAL ALLERGY  NEVER recommend " + user.allergies.join(", ") + " or any derivatives. Check every single item."
    : "";
  const history = user?.history?.length
    ? "User has previously asked about: " + user.history.slice(-6).map(h=>h.query).join("; ") + ". Do NOT repeat the same recommendations."
    : "";
  const sexNote = user?.sex === "female"
    ? "User is female: consider iron, oestrogen balance, cycle-phase nutrition, collagen."
    : user?.sex === "male"
    ? "User is male: consider testosterone support, muscle recovery, zinc, magnesium, prostate health."
    : "";
  const ageNote = user?.age
    ? "User age: " + user.age + " years. Tailor recommendations to this life stage  recovery, hormones, metabolism."
    : "";
  const weightNote = user?.weight
    ? "User weight: " + user.weight + "kg. Use this for dosage, protein targets, caloric context."
    : "";
  const seed = VARIETY_SEEDS[Math.floor(Math.random() * VARIETY_SEEDS.length)];
  const timeCtx = TIME_CONTEXT();
  const seasonCtx = SEASON_CONTEXT();

  const baseRules = "OUTPUT RULES  FOLLOW EXACTLY:\n" +
    "1. Output ONLY a JSON object. Zero text before or after it.\n" +
    "2. No markdown. No backticks. No code fences.\n" +
    "3. Use double quotes for all strings. No single quotes. Write do not instead of dont, you will instead of youll.\n" +
    "4. No newlines inside string values. Keep all strings on one line.\n" +
    "5. No trailing commas.\n";

  if (!isFollowUp) {
    return "Holistic wellness coach. " + sexNote + " " + ageNote + " " + weightNote + " " + history + " " + timeCtx + "\n" +
      "Output ONLY valid JSON, no markdown, double quotes only, no newlines in strings.\n" +
      "{\"responseType\":\"initial\",\"acknowledgment\":\"1 warm sentence\",\"pillars\":[{\"type\":\"food\",\"label\":\"Food\",\"items\":[{\"emoji\":\"\",\"name\":\"item\",\"when\":\"when\",\"benefit\":\"mechanism\",\"struggle\":\"symptom now\",\"outcome\":\"result\",\"timeframe\":\"timing\"}]},{\"type\":\"exercise\",\"label\":\"Movement\",\"items\":[...]},{\"type\":\"breath\",\"label\":\"Breathwork\",\"items\":[...]},{\"type\":\"sleep\",\"label\":\"Sleep\",\"items\":[...]}],\"tip\":\"specific tip\"}\n" +
      "Rules: 2 items per pillar. Specific names, mechanisms, timings. No recipes." +
      (allergy ? " " + allergy : "");
  } else {
    return "Wellness coach follow-up. " + sexNote + " " + ageNote + "\n" +
      "Output ONLY valid JSON, double quotes, no markdown.\n" +
      "For more items: {\"responseType\":\"items\",\"acknowledgment\":\"1 sentence\",\"pillars\":[{\"type\":\"food\",\"label\":\"Foods\",\"items\":[{\"emoji\":\"\",\"name\":\"name\",\"when\":\"when\",\"benefit\":\"mechanism\",\"struggle\":\"now\",\"outcome\":\"result\",\"timeframe\":\"timing\"}]}],\"tip\":\"tip\"}\n" +
      "For recipe: {\"responseType\":\"recipe\",\"acknowledgment\":\"1 sentence\",\"recipes\":[{\"name\":\"Name\",\"emoji\":\"\",\"ingredients\":[\"amount item\"],\"steps\":[\"step\"]}],\"tip\":\"tip\"}\n" +
      "For science/insight: {\"responseType\":\"insight\",\"acknowledgment\":\"1 sentence\",\"cards\":[{\"emoji\":\"\",\"title\":\"title\",\"body\":\"2 sentences\",\"pillar\":\"food\"}],\"tip\":\"tip\"}\n" +
      "3-4 items. Specific. " + (allergy ? allergy : "");
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
- No newlines inside strings. No apostrophes or single quotes inside string values  rephrase to avoid them. No unescaped special characters.
- ${allergy}`;
};

// --- SUPABASE PROFILE HELPERS -------------------------------------------------

// Cache session in localStorage just for instant UI restore on reload
const getUser   = () => { try { return JSON.parse(localStorage.getItem("np_user")||"null"); } catch { return null; } };
const saveUser  = (u) => localStorage.setItem("np_user", JSON.stringify(u));
const clearUser = () => {
  // Only remove auth session - preserve profile prefs (age/weight/sex) across sign-out
  const u = getUser();
  if (u?.email) {
    try { localStorage.setItem("np_prefs_" + u.email, JSON.stringify({age:u.age,weight:u.weight,sex:u.sex,allergies:u.allergies})); } catch(e) {}
  }
  localStorage.removeItem("np_user");
};
const getPrefs = (email) => { try { return JSON.parse(localStorage.getItem("np_prefs_" + email)||"{}"); } catch { return {}; } };

// Fetch full profile from Supabase (credits, allergies, sex, history)
const fetchProfile = async (supaId) => {
  const { data } = await supabase.from("profiles").select("*").eq("id", supaId).single();
  return data;
};

// Upsert profile fields to Supabase
const upsertProfile = async (supaId, fields) => {
  const { error } = await supabase.from("profiles")
    .upsert({ id: supaId, ...fields, updated_at: new Date().toISOString() });
  if (error) console.error("upsertProfile failed:", error.message);
};

// --- CONVERSATION HISTORY -----------------------------------------------------

const CONV_KEY = "np_conversations";
const MAX_CONVS = 500; // Keep full history  never truncate

// -- Local cache (per-user key so different users on same browser don't mix) --
const localKey = (userId) => userId ? "np_conv_" + userId : "np_conv_guest";

const loadConversationsLocal = (userId) => {
  try { return JSON.parse(localStorage.getItem(localKey(userId))||"[]"); } catch { return []; }
};
const saveConversationsLocal = (convs, userId) => {
  try { localStorage.setItem(localKey(userId), JSON.stringify(convs)); } catch(e) {}
};
// Legacy alias for HistoryModal which calls loadConversations()
const loadConversations = (userId) => loadConversationsLocal(userId);

// -- Merge two arrays by id, newest first, no duplicates ----------------------
const mergeConvs = (a, b) => {
  const map = new Map();
  [...a, ...b].forEach(c => { if(c?.id) map.set(c.id, c); });
  return Array.from(map.values()).sort((x,y) => y.date - x.date);
};

// -- Remote: Supabase as source of truth --------------------------------------
const saveConversationsRemote = async (userId, convs) => {
  if (!userId) return;
  try {
    const { error } = await supabase.from("profiles")
      .upsert({ id: userId, conversations: convs, updated_at: new Date().toISOString() });
    if (error) console.error("Remote conv save failed:", error.message);
  } catch(e) { console.error("Remote conv save exception:", e); }
};

// On login: pull remote, merge with any local (guest searches migrate too), save back
const loadConversationsRemote = async (userId) => {
  if (!userId) return loadConversationsLocal(null);
  try {
    const { data } = await supabase.from("profiles")
      .select("conversations")
      .eq("id", userId)
      .single();
    const remote = Array.isArray(data?.conversations) ? data.conversations : [];
    const local  = loadConversationsLocal(userId);
    const guest  = loadConversationsLocal(null); // migrate any guest searches
    const merged = mergeConvs(remote, mergeConvs(local, guest));
    saveConversationsLocal(merged, userId);
    if (guest.length) {
      // Clear guest cache after migrating
      try { localStorage.removeItem(localKey(null)); } catch(e) {}
      // Push merged back to remote so guest searches are permanently saved
      await saveConversationsRemote(userId, merged);
    }
    return merged;
  } catch(e) {
    console.error("Remote conv load failed:", e);
    return loadConversationsLocal(userId);
  }
};

const saveConversation = (messages, userId) => {
  if (!messages.length) return;
  const convs = loadConversationsLocal(userId);
  const firstUserMsg = messages.find(m=>m.role==="user");
  const title = firstUserMsg
    ? firstUserMsg.content.slice(0,60) + (firstUserMsg.content.length>60?"":"")
    : "Conversation";
  const conv = {
    id: Date.now(),
    title,
    date: Date.now(),
    messages: messages.map(m=>({role:m.role,content:m.content,result:m.result||null}))
  };
  const updated = [conv, ...convs.filter(c=>c.id!==conv.id)].slice(0, MAX_CONVS);
  saveConversationsLocal(updated, userId);
  if (userId) saveConversationsRemote(userId, updated);
  return conv.id;
};

const deleteConversation = (id, userId) => {
  const convs = loadConversationsLocal(userId).filter(c=>c.id!==id);
  saveConversationsLocal(convs, userId);
  if (userId) saveConversationsRemote(userId, convs);
};

// --- STYLES -------------------------------------------------------------------

const CSS = `
  @keyframes fadeUp    { from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);} }
  @keyframes fadeIn    { from{opacity:0;}to{opacity:1;} }
  @keyframes spin      { to{transform:rotate(360deg);} }
  @keyframes pulse     { 0%,100%{opacity:.5;}50%{opacity:1;} }
  @keyframes float     { 0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);} }
  @keyframes slideUp   { from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);} }
  @keyframes pulseRing { 0%{box-shadow:0 0 0 0 rgba(61,184,118,.4);}70%{box-shadow:0 0 0 10px rgba(61,184,118,0);}100%{box-shadow:0 0 0 0 rgba(61,184,118,0);} }
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{height:100%;background:#16181a;}
  body{font-family:'Georgia',serif;color:#e0ede2;-webkit-font-smoothing:antialiased;}
  input,textarea,button{font-family:'Georgia',serif;}
  .item-card:hover    {transform:translateY(-3px);box-shadow:0 6px 20px rgba(0,0,0,.2);}
  .rc:hover           {border-color:rgba(61,184,118,.4)!important;}
  .tier-card          {transition:transform .25s,box-shadow .25s;}
  .tier-card:hover    {transform:translateY(-6px);box-shadow:0 16px 48px rgba(0,0,0,.3);}
  .cta-btn            {position:relative;overflow:hidden;transition:transform .15s,box-shadow .15s;}
  .cta-btn:hover      {transform:scale(1.02);}
  .cta-btn:active     {transform:scale(.98);}
  .day-card           {transition:all .18s;cursor:pointer;}
  .day-card:hover     {transform:translateY(-2px);}
  .modal-wrap         {animation:fadeIn .2s ease;}
  .modal-box          {animation:slideUp .25s ease;}
  .search-ring:focus-within{border-color:rgba(61,184,118,.6)!important;box-shadow:0 0 0 3px rgba(61,184,118,.12)!important;}
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

  // 1b. Replace smart/curly quotes with straight quotes
  s = s.replace(/[\u2018\u2019]/g,"'").replace(/[\u201C\u201D]/g,'"');

  // 2. Extract outermost { } or [ ]
  if (expectArray) { const a=s.indexOf("["),b=s.lastIndexOf("]"); if(a!==-1&&b!==-1)s=s.slice(a,b+1); }
  else             { const a=s.indexOf("{"),b=s.lastIndexOf("}"); if(a!==-1&&b!==-1)s=s.slice(a,b+1); }
  if (!s) return {};

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

  // 7. Fix unescaped quotes inside string values  replace " that aren't preceded by : [ , { with \"
  s=s.replace(/:\s*"(.*?)(?<!\\)"/gs,(_,inner)=>':"'+inner.replace(/(?<!\\)"/g,'\\"')+'"');
  try{return JSON.parse(s);}catch(_){}

  // 8. Last resort: strip everything after last valid closing bracket
  const lastCurly = s.lastIndexOf("}");
  const lastSquare = s.lastIndexOf("]");
  const lastClose = Math.max(lastCurly, lastSquare);
  if (lastClose > 0) {
    const trimmed = s.slice(0, lastClose+1);
    try{return JSON.parse(trimmed);}catch(_){}
    try{return JSON.parse(trimmed.replace(/,\s*([}\]])/g,"$1"));}catch(_){}
  }

  // 9. Nuclear option: try to extract any partial valid object
  //    Build a minimal result from whatever keys we can find
  const ackMatch = s.match(/"acknowledgment"\s*:\s*"([^"]+)"/);
  const typeMatch = s.match(/"responseType"\s*:\s*"([^"]+)"/);
  if (ackMatch) {
    return {
      responseType: typeMatch?.[1] || "initial",
      acknowledgment: ackMatch[1],
      pillars: [], cards: [], recipes: [], tip: ""
    };
  }

  // Last resort  return empty shell, repairResult will fill it in
  return {};
}

function Modal({ onClose, children, maxWidth=420 }) {
  useEffect(()=>{ const h=(e)=>e.key==="Escape"&&onClose(); window.addEventListener("keydown",h); return()=>window.removeEventListener("keydown",h); },[onClose]);
  return (
    <div className="modal-wrap" onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div className="modal-box np-modal-pad" onClick={e=>e.stopPropagation()} style={{background:"#1e2226",border:"1px solid rgba(61,184,118,.3)",borderRadius:22,padding:"32px 28px",maxWidth,width:"100%"}}>
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
            tier:"free",
            conversations:[]
          });
          const u={id:data.user.id,name:name.trim(),email:email.trim(),allergies,credits:3,sex:"",age:null,weight:null,history:[]};if(window.tlTrack)window.tlTrack('signup_completed',{plan:'free'});
          saveUser(u);onAuth(u);
        }
      } else {
        if(!email.trim()||!pass.trim())return setErr("Email and password required.");
        const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password:pass});
        if(error)return setErr(error.message);
        // Fetch full profile
        const profile=await fetchProfile(data.user.id);
        const prefs = getPrefs(email.trim()); // survives sign-out
        const u={
          id:data.user.id,
          name:profile?.name||data.user.user_metadata?.name||email.split("@")[0],
          email:email.trim(),
          allergies:profile?.allergies?.length ? profile.allergies : (prefs.allergies||[]),
          credits:profile?.credits??3,
          tier:profile?.tier||"free",
          sex:profile?.sex||prefs.sex||"",
          age:profile?.age??prefs.age??null,
          weight:profile?.weight??prefs.weight??null,
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
        redirectTo:"https://foodnfitness.ai"
      });
      if(error)return setErr(error.message);
      setResetSent(true);
    }catch(e){setErr(e.message);}finally{setLoading(false);}
  };

  const updatePassword=async()=>{
    setErr("");setLoading(true);
    try{
      if(pass.length<6)return setErr("Password must be at least 6 characters.");
      const {error}=await supabase.auth.updateUser({password:pass});
      if(error)return setErr(error.message);
      onClose();
      alert(" Password updated successfully! Please sign in with your new password.");
    }catch(e){setErr(e.message);}finally{setLoading(false);}
  };

  const inp={background:"#1e2226",border:"1px solid rgba(0,0,0,.1)",borderRadius:10,padding:"11px 14px",color:"#2a3838",outline:"none",fontSize:".9rem",width:"100%",boxSizing:"border-box"};
  const pw={position:"relative",display:"flex",alignItems:"center"};
  const eb={position:"absolute",right:12,background:"none",border:"none",color:"#8ea898",cursor:"pointer",padding:2,display:"flex",alignItems:"center"};

  if(mode==="reset")return(
    <Modal onClose={onClose}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <span style={{color:"#8ea898",fontSize:"1.05rem"}}> Set new password</span>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#8ea898",cursor:"pointer",fontSize:"1.1rem"}}></button>
      </div>
      {err&&<div style={{color:"#c84040",fontSize:".82rem",marginBottom:12,padding:"9px 13px",background:"rgba(192,57,43,.08)",borderRadius:9,border:"1px solid rgba(200,60,60,.2)"}}>{err}</div>}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div style={{color:"#8ea898",fontSize:".82rem"}}>Enter your new password below.</div>
        <div style={pw}><input value={pass} onChange={e=>setPass(e.target.value)} placeholder="New password (min 6 characters)" type={showPass?"text":"password"} onKeyDown={e=>e.key==="Enter"&&updatePassword()} style={{...inp,paddingRight:40}}/><button onClick={()=>setShowPass(p=>!p)} style={eb}><EyeIcon open={showPass}/></button></div>
        <button onClick={updatePassword} disabled={loading} className="cta-btn" style={{background:"linear-gradient(135deg,#2d8a50,#1e6038)",border:"none",borderRadius:11,padding:"13px",color:"#eaf0eb",fontSize:".9rem",cursor:"pointer",fontWeight:600}}>{loading?"Updating":"Set new password "}</button>
      </div>
    </Modal>
  );

  if(mode==="forgot")return(
    <Modal onClose={onClose}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <span style={{color:"#8ea898",fontSize:"1.05rem"}}> Reset password</span>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#8ea898",cursor:"pointer",fontSize:"1.1rem"}}></button>
      </div>
      {err&&<div style={{color:"#c84040",fontSize:".82rem",marginBottom:12,padding:"9px 13px",background:"rgba(192,57,43,.08)",borderRadius:9,border:"1px solid rgba(200,60,60,.2)"}}>{err}</div>}
      {resetSent
        ?<div style={{textAlign:"center",padding:"16px 0"}}>
          <div style={{fontSize:32,marginBottom:12}}></div>
          <div style={{color:"#8ea898",fontSize:".95rem",marginBottom:8}}>Check your email</div>
          <div style={{color:"#8ea898",fontSize:".88rem",lineHeight:1.7}}>A password reset link has been sent to <strong style={{color:"#6fcf97"}}>{email}</strong>. Check your inbox.</div>
          <button onClick={()=>{setMode("login");setResetSent(false);}} style={{marginTop:16,background:"none",border:"none",color:"#8ea898",fontSize:".82rem",cursor:"pointer"}}> Back to sign in</button>
        </div>
        :<div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{color:"#8ea898",fontSize:".82rem"}}>Enter your account email and we will send a reset link.</div>
          <input ref={emailRef} value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" type="email" onKeyDown={e=>e.key==="Enter"&&sendReset()} style={inp}/>
          <button onClick={sendReset} disabled={loading} className="cta-btn" style={{background:"linear-gradient(135deg,#2d8a50,#1e6038)",border:"none",borderRadius:11,padding:"13px",color:"#eaf0eb",fontSize:".9rem",cursor:"pointer",fontWeight:600}}>{loading?"Sending":"Send reset link "}</button>
          <button onClick={()=>{setMode("login");setErr("");}} style={{background:"none",border:"none",color:"#8ea898",fontSize:".82rem",cursor:"pointer",textAlign:"center",paddingTop:4}}> Back to sign in</button>
        </div>
      }
    </Modal>
  );

  return(
    <Modal onClose={onClose}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <span style={{color:"#8ea898",fontSize:"1.05rem"}}>{mode==="login"?"Welcome back ":"Join foodnfitness.ai "}</span>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#8ea898",cursor:"pointer",fontSize:"1.1rem",lineHeight:1}}></button>
      </div>
      {err&&<div style={{color:"#c84040",fontSize:".82rem",marginBottom:12,padding:"9px 13px",background:"rgba(192,57,43,.08)",borderRadius:9,border:"1px solid rgba(200,60,60,.2)"}}>{err}</div>}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {mode==="signup"&&<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" style={inp}/>}
        <input ref={emailRef} value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" type="email" style={inp}/>
        <div style={pw}><input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Password" type={showPass?"text":"password"} onKeyDown={e=>e.key==="Enter"&&submit()} style={{...inp,paddingRight:40}}/><button onClick={()=>setShowPass(p=>!p)} style={eb}><EyeIcon open={showPass}/></button></div>
        {mode==="signup"&&<div>
          <div style={{color:"#8ea898",fontSize:".78rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>Food allergies</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{ALLERGIES.map(a=><button key={a} onClick={()=>toggleAllergy(a)} style={{background:allergies.includes(a)?"rgba(61,184,118,.22)":"#1e2226",border:"1px solid "+(allergies.includes(a)?"rgba(61,184,118,.55)":"rgba(255,255,255,.1)"),borderRadius:20,padding:"4px 11px",color:allergies.includes(a)?"#6fcf97":"#8ea898",fontSize:".84rem",cursor:"pointer",transition:"all .14s"}}>{a}</button>)}</div>
          <div style={{color:"#8ea898",fontSize:".78rem",marginTop:6,fontStyle:"italic"}}>Editable anytime in your profile.</div>
        </div>}
        <button onClick={submit} disabled={loading} className="cta-btn" style={{background:"linear-gradient(135deg,#2d8a50,#1e6038)",border:"none",borderRadius:11,padding:"13px",color:"#1e2226",fontSize:".9rem",cursor:"pointer",fontWeight:600,marginTop:2}}>{loading?"Please wait":(mode==="login"?"Sign In ":"Create Free Account ")}</button>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:2}}>
          <button onClick={()=>{setMode(m=>m==="login"?"signup":"login");setErr("");}} style={{background:"none",border:"none",color:"#8ea898",fontSize:".82rem",cursor:"pointer",fontFamily:"'Georgia',serif"}}>{mode==="login"?"No account? Sign up free":"Already have an account?"}</button>
          {mode==="login"&&<button onClick={()=>{setMode("forgot");setErr("");}} style={{background:"none",border:"none",color:"#8ea898",fontSize:".78rem",cursor:"pointer",fontFamily:"'Georgia',serif",fontStyle:"italic"}}>Forgot password?</button>}
        </div>
      </div>
    </Modal>
  );
}

function ProfileModal({ user, onClose, onUpdate, onLogout, onUpgrade }) {
  const [allergies,setAllergies]=useState(user.allergies||[]);
  const [sex,setSex]=useState(user.sex||"");
  const [age,setAge]=useState(user.age||"");
  const [weight,setWeight]=useState(user.weight||"");
  const [saving,setSaving]=useState(false);
  const [portalLoading,setPortalLoading]=useState(false);
  const toggle=(a)=>setAllergies(p=>p.includes(a)?p.filter(x=>x!==a):[...p,a]);
  const [saved,setSaved]=useState(false);
  const save=async()=>{
    setSaving(true);setSaved(false);
    const ageNum = age ? parseInt(age) : null;
    const weightNum = weight ? parseFloat(weight) : null;
    const u={...user,allergies,sex,age:ageNum,weight:weightNum};
    saveUser(u);
    // Persist prefs under email key so they survive sign-out
    try { localStorage.setItem("np_prefs_" + u.email, JSON.stringify({age:ageNum,weight:weightNum,sex,allergies})); } catch(e) {}
    if(user.id) await upsertProfile(user.id,{allergies,sex,age:ageNum,weight:weightNum});
    setSaving(false);setSaved(true);
    onUpdate(u);
    setTimeout(()=>setSaved(false),2000);
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
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{color:"#8ea898",fontSize:"1.05rem"}}> {user.name}</span><button onClick={onClose} style={{background:"none",border:"none",color:"#8ea898",cursor:"pointer",fontSize:"1.1rem"}}></button></div>
      <div style={{color:"#8ea898",fontSize:".85rem",marginBottom:20}}>{user.email}  {user.history?.length||0} searches</div>
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",gap:12,marginBottom:20}}>
          <div style={{flex:1}}>
            <div style={{color:"#8ea898",fontSize:".78rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>Age</div>
            <input type="number" min="10" max="100" value={age} onChange={e=>setAge(e.target.value)} placeholder="e.g. 34"
              style={{width:"100%",background:"#1e2226",border:"1px solid rgba(0,0,0,.1)",borderRadius:10,padding:"10px 12px",color:"#dde8df",fontSize:".95rem",fontFamily:"Georgia,serif",boxSizing:"border-box",outline:"none"}}/>
          </div>
          <div style={{flex:1}}>
            <div style={{color:"#8ea898",fontSize:".78rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>Weight <span style={{textTransform:"none",letterSpacing:0,fontSize:".72rem"}}>(kg)</span></div>
            <input type="number" min="30" max="300" step="0.5" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="e.g. 75"
              style={{width:"100%",background:"#1e2226",border:"1px solid rgba(0,0,0,.1)",borderRadius:10,padding:"10px 12px",color:"#dde8df",fontSize:".95rem",fontFamily:"Georgia,serif",boxSizing:"border-box",outline:"none"}}/>
          </div>
        </div>
        <div style={{color:"#8ea898",fontSize:".78rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:10}}>Biological sex <span style={{color:"#8ea898",fontStyle:"italic",letterSpacing:0,textTransform:"none",fontSize:".74rem"}}>(personalises results)</span></div>
        <div style={{display:"flex",gap:8}}>{SEX.map(opt=>{const active=sex===opt.value;return<button key={opt.value} onClick={()=>setSex(active?"":opt.value)} style={{flex:1,background:active?"rgba(61,184,118,.18)":"#1e2226",border:"1.5px solid "+(active?"rgba(61,184,118,.55)":"rgba(255,255,255,.1)"),borderRadius:14,padding:"12px 8px",cursor:"pointer",transition:"all .16s",display:"flex",flexDirection:"column",alignItems:"center",gap:5}}><span style={{fontSize:20}}>{opt.icon}</span><span style={{color:active?"#6fcf97":"#8ea898",fontSize:".84rem",fontFamily:"'Georgia',serif"}}>{opt.label}</span></button>;})}</div>
        {!sex&&<div style={{color:"#8ea898",fontSize:".74rem",marginTop:7,fontStyle:"italic"}}>Optional  tailors hormone, iron & nutrient advice.</div>}
        {sex&&<div style={{color:"#8ea898",fontSize:".74rem",marginTop:7,fontStyle:"italic"}}> Personalised for {sex} biology.</div>}
      </div>
      <div style={{marginBottom:20}}>
        <div style={{color:"#8ea898",fontSize:".78rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>Food allergies</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{ALLERGIES.map(a=><button key={a} onClick={()=>toggle(a)} style={{background:allergies.includes(a)?"rgba(61,184,118,.22)":"#1e2226",border:"1px solid "+(allergies.includes(a)?"rgba(61,184,118,.55)":"rgba(255,255,255,.1)"),borderRadius:20,padding:"4px 11px",color:allergies.includes(a)?"#6fcf97":"#8ea898",fontSize:".84rem",cursor:"pointer",transition:"all .14s"}}>{a}</button>)}</div>
      </div>
      <div style={{display:"flex",gap:9,marginBottom:9}}><button onClick={save} disabled={saving} className="cta-btn" style={{flex:1,background:"linear-gradient(135deg,#2d8a50,#1e6038)",border:"none",borderRadius:10,padding:"11px",color:"#dde8df",fontSize:".85rem",cursor:"pointer",fontWeight:600}}>{saving?"Saving...":(saved?"Saved!":"Save changes")}</button><button onClick={logout} style={{background:"rgba(220,80,80,.08)",border:"1px solid rgba(220,80,80,.22)",borderRadius:10,padding:"11px 16px",color:"#c84040",fontSize:".85rem",cursor:"pointer"}}>Sign out</button></div>


    </Modal>
  );
}

function NoCreditsModal({ onClose, onViewPlans }) {
  return(
    <Modal onClose={onClose} maxWidth={360}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:38,marginBottom:12}}></div>
        <div style={{color:"#a07020",fontSize:"1rem",marginBottom:8}}>Out of credits</div>
        <div style={{color:"#7a5a18",fontSize:".92rem",lineHeight:1.7,marginBottom:20}}>Top up to keep unlocking your wellness plan.<br/><span style={{color:"#7a6030",fontSize:".78rem"}}>1 credit per search</span></div>
        <button onClick={onViewPlans} className="cta-btn" style={{width:"100%",background:"linear-gradient(135deg,#c8a96e,#a07840)",border:"none",borderRadius:11,padding:"12px",color:"#ffffff",fontSize:".9rem",cursor:"pointer",fontWeight:700,marginBottom:8}}>View plans </button>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#7a5a18",fontSize:".78rem",cursor:"pointer"}}>Maybe later</button>
      </div>
    </Modal>
  );
}

function SignUpPrompt({ onClose, onSignUp }) {
  return(
    <Modal onClose={onClose} maxWidth={360}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:42,marginBottom:12,display:"inline-block",animation:"float 3s ease-in-out infinite"}}></div>
        <div style={{color:"#8ea898",fontSize:"1rem",marginBottom:8}}>You have used all 3 free searches</div>
        <div style={{color:"#8ea898",fontSize:".92rem",lineHeight:1.7,marginBottom:16}}>Sign up free  food, fitness, breathwork and sleep. No card needed.</div>
        <div style={{display:"flex",justifyContent:"center",gap:20,marginBottom:20,padding:"12px 16px",background:"rgba(61,184,118,.06)",border:"1px solid rgba(61,184,118,.15)",borderRadius:12}}>
          {[["4","Pillars"],["3","Free credits"],["Free","To join"]].map(([val,lbl],i)=>(
            <div key={i} style={{textAlign:"center"}}><div style={{color:"#6fcf97",fontSize:"1.1rem",fontWeight:600}}>{val}</div><div style={{color:"#8ea898",fontSize:".74rem",letterSpacing:".06em",textTransform:"uppercase"}}>{lbl}</div></div>
          ))}
        </div>
        <button onClick={onSignUp} className="cta-btn" style={{width:"100%",background:"linear-gradient(135deg,#2d8a50,#1e6038)",border:"none",borderRadius:11,padding:"13px",color:"#eaf0eb",fontSize:".9rem",cursor:"pointer",fontWeight:600,marginBottom:8,boxShadow:"0 4px 20px rgba(61,184,118,.25)"}}>Create free account </button>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#8ea898",fontSize:".74rem",cursor:"pointer"}}>Maybe later</button>
      </div>
    </Modal>
  );
}

// --- IMAGE SYSTEM -------------------------------------------------------------

// Direct Unsplash photo URLs  verified photo IDs
const IMG = (id) => `https://images.unsplash.com/${id}?w=500&h=320&q=80&fit=crop&auto=format`;
// Fallback: keyword-based lookup from a curated set
const SEARCH = (query) => {
  const q = query.toLowerCase();
  // Map common queries to verified Unsplash photo IDs
  const lookup = {
    "fennel": "photo-1416879595882-3373a0480b5b",
    "fennel seeds": "photo-1416879595882-3373a0480b5b",
    "fennel seeds herbal": "photo-1416879595882-3373a0480b5b",
    "cucumber mint water glass": "photo-1541167760496-1628856ab772",
    "cucumber mint": "photo-1541167760496-1628856ab772",
    "fresh mint leaves": "photo-1628557010577-e96890a9f3f7",
    "mint": "photo-1628557010577-e96890a9f3f7",
    "green vegetable juice": "photo-1610970881699-d41ab9ad7bcc",
    "kombucha fermented drink": "photo-1558618666-fcd25c85cd64",
    "chamomile herbal tea cup": "photo-1544787219-7f47ccb76574",
    "herbal tea": "photo-1544787219-7f47ccb76574",
    "golden turmeric latte": "photo-1615485500704-8e990f9900f7",
    "matcha green tea bowl": "photo-1515823662972-da6a2e4d3002",
    "fresh ginger root": "photo-1573506254977-9a6e4f14e7d9",
    "ginger": "photo-1573506254977-9a6e4f14e7d9",
    "fresh cherries bowl": "photo-1528821128474-27f963b062bf",
    "fresh blueberries": "photo-1457296898342-cdd24585d095",
    "avocado halved": "photo-1523049673857-eb18f1d7b578",
    "dried prunes figs": "photo-1519996529931-28324d5a630e",
    "fresh vegetables colorful": "photo-1540420773420-3366772f4999",
    "fresh vegetables healthy food": "photo-1540420773420-3366772f4999",
    "fresh spinach kale leaves": "photo-1576045057995-568f588f82fb",
    "broccoli fresh vegetable": "photo-1459411552884-841db9b3cc2a",
    "fresh cucumber sliced": "photo-1604977042946-1eecc30f269e",
    "cucumber fresh sliced": "photo-1604977042946-1eecc30f269e",
    "cucumber": "photo-1604977042946-1eecc30f269e",
    "salmon fillet fresh": "photo-1519708227418-c8fd9a32b7a2",
    "black garlic bulbs": "photo-1501012070610-bef101015de8",
    "ceylon cinnamon sticks": "photo-1588421357574-87938a86fa28",
    "fresh eggs bowl": "photo-1482049016688-2d3e1b311543",
    "oatmeal porridge bowl": "photo-1517673132405-a56a62b18caf",
    "flaxseeds chia seeds": "photo-1508061253366-f7da158b6d46",
    "fresh lemon citrus fruit": "photo-1587486913049-53fc88980cfc",
    "reishi mushroom": "photo-1516594915697-87eb3b1c14ea",
    "quinoa grain bowl": "photo-1586201375761-83865001e31c",
    "chickpea lentils legumes": "photo-1515543904379-3d757dda9578",
    "fresh beetroot beet": "photo-1593789382576-fca9e7bafcd6",
    "kimchi fermented vegetables": "photo-1569050467447-ce54b3bbc37d",
    "yogurt kefir dairy": "photo-1488477181946-6428a0291777",
    "sweet potato roasted": "photo-1596097635121-14b38c5d7f29",
    "healthy smoothie drink": "photo-1553530666-ba11a90a3332",
    "lavender aromatherapy": "photo-1611909023032-2d6b3134ecba",
    "fresh grapefruit orange citrus": "photo-1587132137056-bfbf0166836e",
    "yoga outdoor exercise": "photo-1506126613408-eca07ce68773",
    "pilates exercise mat": "photo-1518611012118-696072aa579a",
    "stretching flexibility exercise": "photo-1544367567-0f2fcb009e0b",
    "meditation breathing calm peaceful": "photo-1506126613408-eca07ce68773",
    "peaceful sleep bedroom cozy": "photo-1541781774459-bb2af2f05b55",
    "outdoor fitness exercise workout": "photo-1476480862126-209bfaa8edc8",
    "aloe vera plant": "photo-1598440947952-7398b500bb6c",
    "bone broth soup bowl": "photo-1547592180-85f173990554",
    "apple cider vinegar bottle": "photo-1526887593587-b730e579d80c",
    "fresh papaya tropical fruit": "photo-1526318472351-c6ffd3cbf2de",
    "dried figs prunes fruit": "photo-1519996529931-28324d5a630e",
    "collagen supplement powder": "photo-1571019613454-1cb2f99b2d8b",
    "dandelion greens herb": "photo-1540420773420-3366772f4999",
    "olive oil bottle": "photo-1474979266404-7eaacbcd87c5",
    "cold pressed olive oil": "photo-1474979266404-7eaacbcd87c5",
    "healthy food nutrition": "photo-1512621776951-a57141f2eefd",
    "healthy food": "photo-1512621776951-a57141f2eefd",
  };
  for (const [key, id] of Object.entries(lookup)) {
    if (q.includes(key) || key.includes(q.split(" ")[0])) {
      return IMG(id);
    }
  }
  // Final fallback  generic healthy food
  return IMG("photo-1512621776951-a57141f2eefd");
};

// Comprehensive keyword  Unsplash photo ID map
// Keys are lowercase substrings; MOST SPECIFIC entries must come FIRST
const IMAGE_MAP = [
  // --- FOOD: Teas & drinks --------------------------------------------------
  [["fennel tea","fennel seed","fennel"],               IMG("photo-1416879595882-3373a0480b5b")],
  [["cucumber mint","mint water","cucumber water","infused water"],IMG("photo-1541167760496-1628856ab772")],
  [["mint","peppermint","spearmint"],                   IMG("photo-1628557010577-e96890a9f3f7")],
  [["lemon water","lemon ginger","ginger lemon"],       IMG("photo-1547592180-85f173990554")],
  [["green juice","celery juice","vegetable juice"],    IMG("photo-1610970881699-d41ab9ad7bcc")],
  [["kombucha","water kefir"],                          IMG("photo-1558618666-fcd25c85cd64")],
  [["golden milk","turmeric latte","turmeric tea"],     IMG("photo-1615485500704-8e990f9900f7")],
  [["matcha","green tea","ceremonial matcha"],          IMG("photo-1515823662972-da6a2e4d3002")],
  [["chamomile","chamomile tea"],                       IMG("photo-1544787219-7f47ccb76574")],
  [["herbal tea","peppermint tea","licorice tea","dandelion tea"], IMG("photo-1544787219-7f47ccb76574")],
  [["bone broth","collagen broth"],                     IMG("photo-1547592180-85f173990554")],
  [["smoothie","protein shake","green drink"],          IMG("photo-1553530666-ba11a90a3332")],
  [["apple cider vinegar","acv"],                       IMG("photo-1526887593587-b730e579d80c")],
  [["warm water","hot water","lemon warm"],             IMG("photo-1544787219-7f47ccb76574")],
  [["aloe vera","aloe juice"],                          IMG("photo-1598440947952-7398b500bb6c")],
  [["collagen","gelatin","peptide"],                    IMG("photo-1571019613454-1cb2f99b2d8b")],

  // --- FOOD: Specific items -------------------------------------------------
  [["montmorency cherry","tart cherry","sour cherry"],  IMG("photo-1528821128474-27f963b062bf")],
  [["black garlic","fermented garlic"],                 IMG("photo-1501012070610-bef101015de8")],
  [["ceylon cinnamon","cinnamon bark","cinnamon"],      IMG("photo-1588421357574-87938a86fa28")],
  [["wild alaskan salmon","wild salmon"],               IMG("photo-1519708227418-c8fd9a32b7a2")],
  [["sardine","anchovy","mackerel","trout"],             IMG("photo-1519708227418-c8fd9a32b7a2")],
  [["salmon","fish oil","omega"],                       IMG("photo-1519708227418-c8fd9a32b7a2")],
  [["ginger shot","ginger root","ginger tea","ginger"], IMG("photo-1573506254977-9a6e4f14e7d9")],
  [["turmeric root","turmeric"],                        IMG("photo-1615485500704-8e990f9900f7")],
  [["blueberry","blueberries","acai","bilberry"],       IMG("photo-1457296898342-cdd24585d095")],
  [["cherry","cherries"],                               IMG("photo-1528821128474-27f963b062bf")],
  [["avocado"],                                         IMG("photo-1523049673857-eb18f1d7b578")],
  [["spinach","kale","watercress","arugula","leafy"],    IMG("photo-1576045057995-568f588f82fb")],
  [["broccoli","cauliflower","brussels"],               IMG("photo-1459411552884-841db9b3cc2a")],
  [["cucumber","celery"],                               IMG("photo-1604977042946-1eecc30f269e")],
  [["beetroot","beet juice"],                           IMG("photo-1593789382576-fca9e7bafcd6")],
  [["kimchi","sauerkraut","fermented","probiotic"],     IMG("photo-1569050467447-ce54b3bbc37d")],
  [["kefir","yogurt","dairy"],                          IMG("photo-1488477181946-6428a0291777")],
  [["lemon","lime","citrus"],                           IMG("photo-1587486913049-53fc88980cfc")],
  [["reishi","lion mane","chaga","mushroom"],           IMG("photo-1516594915697-87eb3b1c14ea")],
  [["walnut","almond","cashew","pistachio","pecan","nut"],IMG("photo-1608797178974-15b35a64ede9")],
  [["quinoa","millet","buckwheat"],                     IMG("photo-1586201375761-83865001e31c")],
  [["lentil","chickpea","legume","bean"],               IMG("photo-1515543904379-3d757dda9578")],
  [["sweet potato","yam"],                              IMG("photo-1596097635121-14b38c5d7f29")],
  [["pomegranate"],                                     IMG("photo-1615485736208-84e11f6f7d42")],
  [["pineapple","papaya","bromelain"],                  IMG("photo-1526318472351-c6ffd3cbf2de")],
  [["flaxseed","chia seed","psyllium","fiber"],         IMG("photo-1508061253366-f7da158b6d46")],
  [["prune","fig","dried fruit"],                       IMG("photo-1519996529931-28324d5a630e")],
  [["egg","eggs"],                                      IMG("photo-1482049016688-2d3e1b311543")],
  [["oat","porridge","granola","oatmeal"],              IMG("photo-1517673132405-a56a62b18caf")],
  [["garlic"],                                          IMG("photo-1501012070610-bef101015de8")],
  [["grapefruit","orange"],                             IMG("photo-1587132137056-bfbf0166836e")],
  [["ashwagandha","rhodiola","adaptogen","maca"],       IMG("photo-1544787219-7f47ccb76574")],
  [["magnesium","zinc","vitamin d","supplement"],       IMG("photo-1584308666744-24d5c474f2ae")],
  [["lavender","aromatherapy","essential oil"],         IMG("photo-1611909023032-2d6b3134ecba")],
  [["dandelion","nettle","burdock","milk thistle"],     IMG("photo-1576045057995-568f588f82fb")],
  [["activated charcoal","bentonite clay","slippery elm"],IMG("photo-1584308666744-24d5c474f2ae")],

  // --- EXERCISE & MOVEMENT -------------------------------------------------
  [["yoga nidra","yin yoga","restorative yoga"],        IMG("photo-1545389336-cf090694435e")],
  [["yoga"],                                            IMG("photo-1506126613408-eca07ce68773")],
  [["pilates"],                                         IMG("photo-1518611012118-696072aa579a")],
  [["stretch","hip flexor","hamstring","mobility"],     IMG("photo-1544367567-0f2fcb009e0b")],
  [["foam roll","self-massage","trigger point"],        IMG("photo-1544367567-0f2fcb009e0b")],
  [["joint circle","joint rotation","gentle joint"],    IMG("photo-1544367567-0f2fcb009e0b")],
  [["walk","hiking","stroll"],                          IMG("photo-1476480862126-209bfaa8edc8")],
  [["run","jog","sprint"],                              IMG("photo-1476480862126-209bfaa8edc8")],
  [["swim","pool","aquatic"],                           IMG("photo-1530549387789-4c1017266635")],
  [["cycle","bike","cycling"],                          IMG("photo-1534787238021-b74ed5f5cce8")],
  [["hiit","interval","circuit"],                       IMG("photo-1571019614242-c5c5dee9f50b")],
  [["deadlift","squat","bench","barbell"],              IMG("photo-1571019614242-c5c5dee9f50b")],
  [["strength","weight training","resistance","dumbbell"],IMG("photo-1571019614242-c5c5dee9f50b")],
  [["plank","core","abdominal","crunch"],               IMG("photo-1571019614242-c5c5dee9f50b")],
  [["turkish get","kettlebell","get-up"],               IMG("photo-1571019614242-c5c5dee9f50b")],
  [["farmer walk","loaded carry","suitcase carry"],     IMG("photo-1571019614242-c5c5dee9f50b")],
  [["cluster","power clean","olympic"],                 IMG("photo-1571019614242-c5c5dee9f50b")],
  [["tai chi","qigong"],                                IMG("photo-1506126613408-eca07ce68773")],
  [["lymphatic","arm swing","lymph"],                   IMG("photo-1544367567-0f2fcb009e0b")],
  [["cold shower","ice bath","cold plunge","contrast shower"],IMG("photo-1585858229735-cd08574d5a73")],
  [["sauna","steam","heat therapy"],                    IMG("photo-1532573958045-0e0da3eb6f2e")],
  [["progressive muscle","muscle relaxation"],          IMG("photo-1545389336-cf090694435e")],

  // --- BREATHWORK & STRESS --------------------------------------------------
  [["box breath","4-4-4","square breath"],              IMG("photo-1506126613408-eca07ce68773")],
  [["4-7-8","478 breath"],                              IMG("photo-1545389336-cf090694435e")],
  [["wim hof","power breath","bellows breath","bhastrika"],IMG("photo-1545389336-cf090694435e")],
  [["humming bee","bhramari"],                          IMG("photo-1545389336-cf090694435e")],
  [["alternate nostril","nadi shodhana"],               IMG("photo-1545389336-cf090694435e")],
  [["ujjayi","ocean breath"],                           IMG("photo-1545389336-cf090694435e")],
  [["breath hold","retention","kumbhaka"],              IMG("photo-1545389336-cf090694435e")],
  [["breath","breathing","pranayama","inhale","exhale"],IMG("photo-1545389336-cf090694435e")],
  [["meditat","mindful","awareness","present"],         IMG("photo-1545389336-cf090694435e")],
  [["journal","gratitude","diary"],                     IMG("photo-1506880135364-e28660dc35fa")],
  [["nature","forest","earthing","grounding","barefoot"],IMG("photo-1476480862126-209bfaa8edc8")],

  // --- SLEEP & RECOVERY ----------------------------------------------------
  [["blue light","screen time","blue light glass"],     IMG("photo-1541781774459-bb2af2f05b55")],
  [["red light","photobiomodulation","infrared"],       IMG("photo-1541781774459-bb2af2f05b55")],
  [["binaural","sound therapy","40hz","gamma","white noise"],IMG("photo-1541781774459-bb2af2f05b55")],
  [["bedroom temp","cool room","thermostat","temperature control"],IMG("photo-1541781774459-bb2af2f05b55")],
  [["sleep position","pillow","elevation"],             IMG("photo-1541781774459-bb2af2f05b55")],
  [["wind down","bedtime routine","sleep hygiene"],     IMG("photo-1541781774459-bb2af2f05b55")],
  [["magnesium glycinate","sleep supplement"],          IMG("photo-1541781774459-bb2af2f05b55")],
  [["melatonin","sleep hormone"],                       IMG("photo-1541781774459-bb2af2f05b55")],
  [["nap","rest","recovery sleep"],                     IMG("photo-1541781774459-bb2af2f05b55")],
  [["sleep"],                                           IMG("photo-1541781774459-bb2af2f05b55")],
];

// Pillar fallbacks  used when nothing in IMAGE_MAP matches
const PILLAR_FALLBACKS = {
  food:     IMG("photo-1512621776951-a57141f2eefd"),  // colorful vegetables
  exercise: IMG("photo-1571019614242-c5c5dee9f50b"),  // gym workout
  breath:   IMG("photo-1545389336-cf090694435e"),     // meditation
  sleep:    IMG("photo-1541781774459-bb2af2f05b55"),  // bedroom night
};

// getImageUrl: tries AI term, then full name, then each word pair in name
function getImageUrl(name, pillarType, aiTerm) {
  const nameL = (name || "").toLowerCase();
  const aiL   = (aiTerm || "").toLowerCase();

  // Build candidates: AI term, full name, then sliding 2-word windows of name
  const candidates = [];
  if (aiL)   candidates.push(aiL);
  if (nameL) candidates.push(nameL);
  // Also try word pairs e.g. "black garlic" from "Fermented Black Garlic"
  const words = nameL.split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    candidates.push(words[i] + " " + words[i+1]);
  }
  // And single words
  for (const w of words) if (w.length > 3) candidates.push(w);

  for (const str of candidates) {
    for (const [keywords, url] of IMAGE_MAP) {
      if (keywords.some(k => str.includes(k))) return url;
    }
  }
  // No map match  search by AI term or item name directly (always semantically correct)
  if (aiL && aiL.length > 2) return SEARCH(aiL + " food healthy");
  if (nameL && nameL.length > 2) return SEARCH(nameL + " healthy");
  return PILLAR_FALLBACKS[pillarType] || PILLAR_FALLBACKS.food;
}


function WeekPlan({ plan }) {
  const [active,setActive]=useState(null);
  try {
  if(!Array.isArray(plan)||plan.length===0)return null;
  const rows=[["","food","Food"],["","move","Move"],["","breathe","Breathe"],["","sleep","Sleep"]];
  return(
    <div style={{marginTop:28}}>
      <div style={{color:"#8ea898",fontSize:".85rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:6}}> Your 7-day wellness plan</div>
      <div style={{color:"#8ea898",fontSize:".82rem",marginBottom:14,fontStyle:"italic"}}>Tap any day to expand</div>
      <div className="np-week-grid" style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}}>
        {plan.map((d,i)=>(
          <div key={i} className="day-card" onClick={()=>setActive(active===i?null:i)} style={{background:active===i?"rgba(61,184,118,.18)":"rgba(61,184,118,.07)",border:"1px solid "+(active===i?"rgba(61,184,118,.45)":"rgba(61,184,118,.16)"),borderRadius:12,padding:"10px 5px",textAlign:"center"}}>
            <div style={{color:"#8ea898",fontSize:".82rem",letterSpacing:".06em",textTransform:"uppercase",marginBottom:4}}>{d.day?.slice(0,3)||"Day"}</div>
            <div style={{color:"#8ea898",fontSize:".78rem",lineHeight:1.3,fontStyle:"italic"}}>{d.focus||""}</div>
          </div>
        ))}
      </div>
      {active!==null&&plan[active]&&(
        <div style={{background:"rgba(61,184,118,.05)",border:"1px solid rgba(61,184,118,.18)",borderRadius:14,padding:"20px",marginTop:10,animation:"fadeUp .22s ease"}}>
          <div style={{color:"#6fcf97",fontSize:"1rem",fontWeight:600,marginBottom:14}}>{plan[active].day}  <em style={{color:"#8ea898",fontWeight:400}}>{plan[active].focus}</em></div>
          {rows.map(([icon,key,lbl])=>(
            <div key={key} style={{display:"flex",gap:12,marginBottom:12,alignItems:"flex-start"}}>
              <span style={{minWidth:100,color:"#8ea898",fontSize:".9rem",flexShrink:0,paddingTop:2}}>{icon} {lbl}</span>
              <span style={{color:"#8ea898",fontSize:".95rem",lineHeight:1.6}}>{plan[active][key]||""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  } catch(e) { console.error("WeekPlan crash",e); return null; }
}

function AckBubble({ text, label="A note for you" }) {
  try { if(!text) return <></>; return(
    <div style={{background:"linear-gradient(135deg,rgba(61,184,118,.1),rgba(30,120,60,.07))",border:"1px solid rgba(61,184,118,.22)",borderRadius:18,padding:"20px 24px",marginBottom:18,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:14,right:16,fontSize:28,opacity:.08}}></div>
      <div style={{color:"#8ea898",fontSize:".8rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>{label}</div>
      <p style={{color:"#3a4e38",fontSize:"clamp(1.05rem,1.8vw,1.2rem)",lineHeight:1.85,margin:0,fontStyle:"italic"}}>{text}</p>
    </div>
  ); } catch(e) { console.error("AckBubble crash",e); return null; }
}

function TipRow({ tip }) {
  try {
  if(!tip)return null;
  return(
    <div style={{background:"linear-gradient(135deg,rgba(61,184,118,.1),rgba(30,120,65,.05))",border:"1px solid rgba(61,184,118,.22)",borderRadius:14,padding:"16px 20px",display:"flex",gap:12,alignItems:"flex-start",marginBottom:16}}>
      <span style={{fontSize:22,marginTop:2,flexShrink:0}}></span>
      <div>
        <div style={{color:"#8ea898",fontSize:".78rem",letterSpacing:".08em",textTransform:"uppercase",marginBottom:5}}>Pro tip</div>
        <span style={{color:"#8ea898",fontSize:"clamp(1rem,1.6vw,1.1rem)",lineHeight:1.7}}>{tip}</span>
      </div>
    </div>
  );
  } catch(e) { console.error("TipRow crash",e); return null; }
}

// --- ITEM DETAIL MODAL -------------------------------------------------------
function ItemDetailModal({ item, meta, pillarType, onClose, onDeepDive }) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  if(!item || !meta || !onClose) return null;
  const safeMeta = meta || PILLAR_META.food;

  const loadDetail = async () => {
    if (detail || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: "You are a wellness expert. Output ONLY a JSON object. No markdown, no backticks. Use double quotes only. No contractions or apostrophes.\n\nFormat: {\"science\":\"2-3 sentences on mechanism\",\"howToUse\":\"Specific dosage and timing\",\"bestFor\":[\"condition 1\",\"condition 2\",\"condition 3\"],\"combinations\":[\"pairs well with X\",\"avoid Z\"],\"quickTip\":\"One surprising tip\"}",         messages: [{ role: "user", content: `Tell me everything about "${item.name}" for wellness. Benefit context: ${item.benefit}` }]
        })
      });
      const data = await res.json();
      const raw = (data.content || []).map(b => b.text || "").join("").trim();
      const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const j = JSON.parse(clean.slice(clean.indexOf("{"), clean.lastIndexOf("}") + 1));
      setDetail(j);
    } catch(e) { setDetail({ science: item.benefit, howToUse: "See recommendation above.", bestFor: [], combinations: [], quickTip: "" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadDetail(); }, []);

  return (
    <div className="modal-wrap" onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:400,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"0"}}>
      <div className="modal-box" onClick={e=>e.stopPropagation()} style={{background:"#1e2226",borderRadius:"24px 24px 0 0",width:"100%",maxWidth:640,maxHeight:"90vh",overflowY:"auto",animation:"slideUp .3s ease"}}>
        {/* Hero - emoji + colour, no photo */}
        <div style={{width:"100%",background:"linear-gradient(160deg,"+safeMeta.bg+",rgba(0,0,0,.3))",padding:"28px 24px 20px",position:"relative",flexShrink:0,borderBottom:"1px solid "+safeMeta.border}}>
          <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"rgba(0,0,0,.4)",border:"none",borderRadius:"50%",width:34,height:34,color:"#1e2226",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>&times;</button>
          <div style={{fontSize:52,marginBottom:10,lineHeight:1}}>{item.emoji||""}</div>
          <div style={{color:safeMeta.color,fontSize:".72rem",letterSpacing:".12em",textTransform:"uppercase",marginBottom:4}}>{safeMeta.label}</div>
          <div style={{color:"#dde8df",fontSize:"1.4rem",fontWeight:700,lineHeight:1.25}}>{item.name}</div>
          {item.when&&<div style={{marginTop:8,display:"inline-block",background:safeMeta.bg,border:"0.5px solid "+safeMeta.border,borderRadius:20,padding:"3px 12px",color:safeMeta.color,fontSize:".78rem"}}>{item.when}</div>}
        </div>

        {/* Content */}
        <div style={{padding:"24px 24px 40px"}}>
          {loading && (
            <div style={{textAlign:"center",padding:"40px 0"}}>
              <div style={{width:32,height:32,border:"3px solid rgba(61,184,118,.2)",borderTop:"3px solid #2d8a50",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 12px"}}/>
              <div style={{color:"#8ea898",fontSize:".9rem"}}>Loading deep dive...</div>
            </div>
          )}
          {detail && !loading && (
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              {/* Science */}
              <div style={{background:"rgba(61,184,118,.07)",border:"1px solid rgba(61,184,118,.2)",borderRadius:14,padding:"18px 20px"}}>
                <div style={{color:meta.color,fontSize:".75rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}> The science</div>
                <p style={{color:"#3a4e38",fontSize:"1rem",lineHeight:1.8,margin:0}}>{detail.science}</p>
              </div>
              {/* How to use */}
              <div style={{background:"rgba(61,184,118,.07)",border:"1px solid rgba(61,184,118,.2)",borderRadius:14,padding:"18px 20px"}}>
                <div style={{color:meta.color,fontSize:".75rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}> How to use it</div>
                <p style={{color:"#3a4e38",fontSize:"1rem",lineHeight:1.8,margin:0}}>{detail.howToUse}</p>
              </div>
              {/* Best for */}
              {detail.bestFor?.length > 0 && (
                <div>
                  <div style={{color:meta.color,fontSize:".75rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:10}}> Best for</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {detail.bestFor.map((b,i) => (
                      <span key={i} style={{background:meta.bg,border:"1px solid "+meta.border,borderRadius:20,padding:"6px 14px",color:"#8ea898",fontSize:".88rem"}}>{b}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Combinations */}
              {detail.combinations?.length > 0 && (
                <div style={{background:"#1e2226",border:"1px solid rgba(0,0,0,.07)",borderRadius:14,padding:"18px 20px"}}>
                  <div style={{color:meta.color,fontSize:".75rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:10}}> Combinations</div>
                  {detail.combinations.map((c,i) => (
                    <div key={i} style={{color:"#8ea898",fontSize:".92rem",lineHeight:1.6,marginBottom:i<detail.combinations.length-1?8:0}}> {c}</div>
                  ))}
                </div>
              )}
              {/* Quick tip */}
              {detail.quickTip && (
                <div style={{background:"linear-gradient(135deg,rgba(61,184,118,.12),rgba(30,120,65,.06))",border:"1px solid rgba(61,184,118,.25)",borderRadius:14,padding:"16px 20px",display:"flex",gap:12}}>
                  <span style={{fontSize:22,flexShrink:0}}></span>
                  <p style={{color:"#8ea898",fontSize:"1rem",lineHeight:1.7,margin:0}}>{detail.quickTip}</p>
                </div>
              )}
              {/* Ask follow-up */}
              <button onClick={()=>onDeepDive(item.name)} style={{background:"linear-gradient(135deg,#2d8a50,#1e6038)",border:"none",borderRadius:12,padding:"14px",color:"#1e2226",fontSize:"1rem",cursor:"pointer",fontWeight:600,width:"100%",marginTop:4}}>
                Ask a follow-up about {item.name} 
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProtocolItem({ item, pillarType, meta, onExpand, index }) {
  try {
  if (!item || !item.name) return null;
  const C = {
    food:     { accent:"#6fcf97", border:"rgba(111,207,151,.2)",  iconBg:"rgba(111,207,151,.12)", outcomeBg:"rgba(111,207,151,.07)", reliefColor:"rgba(111,207,151,.55)" },
    exercise: { accent:"#5aaee0", border:"rgba(90,174,224,.2)",   iconBg:"rgba(90,174,224,.12)",  outcomeBg:"rgba(90,174,224,.07)",  reliefColor:"rgba(90,174,224,.5)"   },
    breath:   { accent:"#9b7fe8", border:"rgba(155,127,232,.2)",  iconBg:"rgba(155,127,232,.12)", outcomeBg:"rgba(155,127,232,.07)", reliefColor:"rgba(155,127,232,.55)" },
    sleep:    { accent:"#5b9bd5", border:"rgba(91,155,213,.2)",   iconBg:"rgba(91,155,213,.12)",  outcomeBg:"rgba(91,155,213,.07)",  reliefColor:"rgba(91,155,213,.5)"   },
  }[pillarType] || { accent:"#6fcf97", border:"rgba(111,207,151,.2)", iconBg:"rgba(111,207,151,.12)", outcomeBg:"rgba(111,207,151,.07)", reliefColor:"rgba(111,207,151,.55)" };

  return (
    <div onClick={()=>onExpand(item, pillarType)} className="item-card"
      style={{cursor:"pointer",animation:"fadeUp .32s ease both",animationDelay:(index*0.08)+"s",marginBottom:10}}>

      <div style={{background:"#1e2226",borderRadius:16,overflow:"hidden",border:"0.5px solid rgba(255,255,255,.06)"}}>

        {/* Header: icon + name + when/relief */}
        <div style={{padding:"18px 18px 0",display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
          <div style={{width:48,height:48,borderRadius:12,background:C.iconBg,border:"0.5px solid "+C.border,
                       display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
            {item.emoji||meta.icon}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:"1rem",fontWeight:600,color:"#eaf0eb",lineHeight:1.35,marginBottom:5}}>
              {item.name}
            </div>
            <div style={{fontSize:".78rem",lineHeight:1.4}}>
              {item.when&&<span style={{color:"rgba(255,255,255,.35)",fontWeight:600}}>{item.when}</span>}
              {item.when&&item.timeframe&&<span style={{margin:"0 6px",color:"rgba(255,255,255,.2)"}}>·</span>}
              {item.timeframe&&<span style={{color:C.reliefColor}}>{"feels better in "+item.timeframe}</span>}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{height:"0.5px",background:"rgba(255,255,255,.05)",margin:"0 18px"}}/>

        {/* Benefit */}
        <div style={{padding:"14px 18px",fontSize:".9rem",color:"#9ab0a0",lineHeight:1.7}}>
          {item.benefit}
        </div>

        {/* Outcome strip */}
        {item.outcome&&(
          <div style={{margin:"0 18px 18px",background:C.outcomeBg,borderLeft:"3px solid "+C.accent,
                       borderRadius:"0 8px 8px 0",padding:"10px 14px"}}>
            <div style={{fontSize:".62rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",
                         marginBottom:4,color:C.accent}}>You will feel</div>
            <div style={{fontSize:".9rem",color:"#c8d9cb",lineHeight:1.5}}>{item.outcome}</div>
          </div>
        )}

        {!item.outcome&&<div style={{height:4}}/>}

        {/* Footer */}
        <div style={{borderTop:"0.5px solid rgba(255,255,255,.05)",padding:"8px 18px",
                     display:"flex",justifyContent:"flex-end",alignItems:"center",gap:4}}>
          <span style={{color:C.accent,fontSize:".68rem",opacity:.5}}>Tap to learn more</span>
          <span style={{color:C.accent,fontSize:10,opacity:.5}}>›</span>
        </div>
      </div>
    </div>
  );
  } catch(e) { console.error("ProtocolItem crash",e); return null; }
}
const ItemCard = ProtocolItem;
function PillarGrid({ pillars, onExpand }) {
  try {
  if(!pillars?.length) return null;
  const ICONS = { food:"🥗", exercise:"💪", breath:"🌬️", sleep:"🌙" };
  const PILLAR_C = {
    food:     { dot:"#6fcf97", line:"rgba(111,207,151,.15)" },
    exercise: { dot:"#5aaee0", line:"rgba(90,174,224,.15)"  },
    breath:   { dot:"#9b7fe8", line:"rgba(155,127,232,.15)" },
    sleep:    { dot:"#5b9bd5", line:"rgba(91,155,213,.15)"  },
  };
  return(
    <div style={{marginBottom:18}}>
      {pillars.map((pillar,pi)=>{
        if (!pillar || !Array.isArray(pillar.items)) return null;
        const pillarType = (pillar.type||"food").toLowerCase();
        const meta = PILLAR_META[pillarType]||PILLAR_META.food;
        const col = PILLAR_C[pillarType]||PILLAR_C.food;
        const validItems = (pillar.items||[]).filter(i=>i&&i.name);
        if (!validItems.length) return null;
        return(
          <div key={pi} style={{marginBottom:pi<pillars.length-1?28:0}}>
            {/* Pillar header */}
            <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:14}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:col.dot,flexShrink:0}}/>
              <span style={{fontSize:".7rem",letterSpacing:".12em",textTransform:"uppercase",fontWeight:700,color:col.dot}}>
                {ICONS[pillarType]} {pillar.label||meta.label}
              </span>
              <div style={{flex:1,height:"0.5px",background:col.line}}/>
            </div>
            {/* Cards */}
            <div>
              {validItems.map((item,i)=>(
                <ProtocolItem key={i} item={item} meta={meta} pillarType={pillarType} onExpand={onExpand} index={i}/>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
  } catch(e) { console.error("PillarGrid crash",e); return null; }
}

function RecipeList({ recipes, activeRecipe, setActiveRecipe, msgIdx }) {
  try {
  if(!recipes?.length||!Array.isArray(recipes))return null;
  return(
    <div style={{marginBottom:18}}>
      <div style={{color:"#8ea898",fontSize:".85rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:12}}> Recipes & protocols</div>
      {recipes.map((r,i)=>{
        const rid=msgIdx+"-"+i;
        const open=activeRecipe===rid;
        return(
          <div key={i} className="rc" style={{background:"#1e2226",border:"1px solid rgba(61,184,118,.18)",borderRadius:14,overflow:"hidden",marginBottom:10,transition:"border-color .18s"}}>
            <button onClick={()=>setActiveRecipe(open?null:rid)} style={{width:"100%",textAlign:"left",background:"transparent",border:"none",padding:"16px 18px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{color:"#2a3838",fontSize:"clamp(1rem,1.6vw,1.12rem)",fontWeight:600}}>{r.emoji||""} {r.name}</span>
              <span style={{color:"#8ea898",fontSize:".88rem",transform:open?"rotate(180deg)":"rotate(0deg)",transition:"transform .2s",display:"inline-block"}}></span>
            </button>
            {open&&(
              <div style={{padding:"0 18px 18px",borderTop:"1px solid rgba(61,184,118,.1)"}}>
                {r.ingredients?.length>0&&<div style={{marginTop:14,marginBottom:12}}><div style={{color:"#8ea898",fontSize:".78rem",letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>Ingredients</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{r.ingredients.map((g,j)=><span key={j} style={{background:"rgba(61,184,118,.1)",border:"1px solid rgba(61,184,118,.2)",borderRadius:20,padding:"5px 12px",color:"#8ea898",fontSize:".9rem"}}>{g}</span>)}</div></div>}
                <div style={{color:"#8ea898",fontSize:".78rem",letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>Steps</div>
                {(r.steps||[]).map((s,j)=>(
                  <div key={j} style={{display:"flex",gap:12,marginBottom:10,alignItems:"flex-start"}}>
                    <span style={{minWidth:26,height:26,borderRadius:"50%",background:"rgba(61,184,118,.2)",color:"#6fcf97",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".82rem",fontWeight:700,flexShrink:0,marginTop:2}}>{j+1}</span>
                    <span style={{color:"#8ea898",fontSize:"clamp(.92rem,1.4vw,1rem)",lineHeight:1.65}}>{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
  } catch(e) { console.error("RecipeList crash",e); return null; }
}

// --- VISUAL CARD GRID (for insight/answer follow-ups) -------------------------
function VisualCardCard({ card, onExpand, index }) {
  try {
  if (!card || !card.title) return null;
  const pillarKey = (card.pillar||"food").toLowerCase();
  const meta = PILLAR_META[pillarKey] || PILLAR_META.food;
  // Pass as ProtocolItem without before/after - science/insight cards dont need it
  const fakeItem = { name: card.title, benefit: card.body, emoji: card.emoji||meta.icon, when: null, outcome: null, timeframe: null };
  return (
    <ProtocolItem item={fakeItem} pillarType={pillarKey} meta={meta} onExpand={onExpand||(() =>{})} index={index||0}/>
  );
  } catch(e) { console.error("VisualCardCard crash",e); return null; }
}

function VisualCardGrid({ cards, onExpand }) {
  try {
  if (!cards?.length) return null;
  return (
    <div style={{paddingLeft:4,marginBottom:18}}>
      {(cards||[]).filter(c=>c&&c.title).map((card, i) => <VisualCardCard key={i} card={card} onExpand={onExpand} index={i}/>)}
    </div>
  );
  } catch(e) { console.error("VisualCardGrid crash",e); return null; }
}

function ResultCard({ result, isLast, onGetMore, activeRecipe, setActiveRecipe, msgIdx, onAskFollowUp }) {
  const [expandedItem, setExpandedItem] = useState(null);
  const [expandedMeta, setExpandedMeta] = useState(null);
  const [expandedPillar, setExpandedPillar] = useState(null);

  // -- Hard guards  never crash --------------------------------------------
  if (!result || typeof result !== "object") return null;

  // Safely extract all fields with defaults
  const ack       = String(result.acknowledgment || "");
  const pillars   = Array.isArray(result.pillars)  ? result.pillars.filter(Boolean)  : [];
  const cards     = Array.isArray(result.cards)    ? result.cards.filter(c => c && c.title) : [];
  const recipes   = Array.isArray(result.recipes)  ? result.recipes.filter(Boolean)  : [];
  const tip       = result.tip || "";

  // If truly nothing  show a soft fallback instead of blank green
  if (!ack && !pillars.length && !cards.length && !recipes.length && !tip) {
    return (
      <div style={{padding:"16px 20px",background:"rgba(61,184,118,.06)",borderRadius:12,border:"1px solid rgba(61,184,118,.15)",color:"#8ea898",fontSize:".95rem",lineHeight:1.6}}>
        Your wellness plan is ready  scroll up to see your results.
      </div>
    );
  }

  // Bulletproof type detection  content takes priority over responseType field
  const rawType = (result.responseType || "").toLowerCase().trim();
  let type;
  if      (pillars.length > 0)                      type = rawType === "items" ? "items" : "initial";
  else if (recipes.length > 0)                      type = "recipe";
  else if (cards.length > 0)                        type = (rawType === "answer") ? "answer" : "insight";
  else if (rawType === "items")                     type = "items";
  else if (rawType === "recipe")                    type = "recipe";
  else if (rawType === "insight" || rawType === "answer") type = rawType;
  else                                              type = "initial";

  const handleExpand = (item, pillarType) => {
    try {
      const meta = PILLAR_META[(pillarType||"food")] || PILLAR_META.food;
      setExpandedItem(item);
      setExpandedMeta(meta);
      setExpandedPillar(pillarType || "food");
    } catch(e) { console.error("handleExpand error:", e); }
  };

  const handleDeepDive = (itemName) => {
    try {
      setExpandedItem(null);
      if (onAskFollowUp) onAskFollowUp("Tell me more about " + itemName + "  how to use it, when, how much, and what to combine it with");
    } catch(e) { console.error("handleDeepDive error:", e); }
  };

  const modal = expandedItem && expandedMeta
    ? <ItemDetailModal item={expandedItem} meta={expandedMeta} pillarType={expandedPillar} onClose={()=>setExpandedItem(null)} onDeepDive={handleDeepDive}/>
    : null;

  // -- Safe renderer  every branch wrapped ---------------------------------
  const renderContent = () => {
    try {
      if (type === "initial" || type === "items") return (
        <div>
          {ack && <AckBubble text={ack} label={type === "items" ? "More for you" : undefined}/>}
          {pillars.length > 0 && <PillarGrid pillars={pillars} onExpand={handleExpand}/>}
          {recipes.length > 0 && <RecipeList recipes={recipes} activeRecipe={activeRecipe} setActiveRecipe={setActiveRecipe} msgIdx={msgIdx}/>}
          {cards.length  > 0 && <VisualCardGrid cards={cards} onExpand={handleExpand}/>}
          <TipRow tip={tip}/>
          {type === "initial" && isLast && <WeekPlan plan={result.weekPlan}/>}
        </div>
      );

      if (type === "recipe") return (
        <div>
          {ack && <AckBubble text={ack} label="Here is how"/>}
          {recipes.length > 0 && <RecipeList recipes={recipes} activeRecipe={activeRecipe} setActiveRecipe={setActiveRecipe} msgIdx={msgIdx}/>}
          {pillars.length > 0 && <PillarGrid pillars={pillars} onExpand={handleExpand}/>}
          {cards.length  > 0 && <VisualCardGrid cards={cards} onExpand={handleExpand}/>}
          <TipRow tip={tip}/>
        </div>
      );

      if (type === "insight" || type === "answer") return (
        <div>
          {ack && <AckBubble text={ack} label={type === "insight" ? "Here is the deeper picture" : "To answer your question"}/>}
          {cards.length  > 0 && <VisualCardGrid cards={cards} onExpand={handleExpand}/>}
          {pillars.length > 0 && <PillarGrid pillars={pillars} onExpand={handleExpand}/>}
          {recipes.length > 0 && <RecipeList recipes={recipes} activeRecipe={activeRecipe} setActiveRecipe={setActiveRecipe} msgIdx={msgIdx}/>}
          <TipRow tip={tip}/>
        </div>
      );

      // Absolute fallback  render whatever we have
      return (
        <div>
          {ack && <AckBubble text={ack}/>}
          {pillars.length > 0 && <PillarGrid pillars={pillars} onExpand={handleExpand}/>}
          {cards.length  > 0 && <VisualCardGrid cards={cards} onExpand={handleExpand}/>}
          {recipes.length > 0 && <RecipeList recipes={recipes} activeRecipe={activeRecipe} setActiveRecipe={setActiveRecipe} msgIdx={msgIdx}/>}
          <TipRow tip={tip}/>
        </div>
      );
    } catch(renderErr) {
      console.error("ResultCard render error:", renderErr);
      return (
        <div style={{padding:"16px 20px",background:"rgba(61,184,118,.06)",borderRadius:12,border:"1px solid rgba(61,184,118,.2)"}}>
          <div style={{color:"#8ea898",fontSize:".95rem",marginBottom:4}}> Could not display this result.</div>
          {ack && <div style={{color:"#8ea898",fontSize:".9rem",lineHeight:1.6,fontStyle:"italic"}}>{ack}</div>}
        </div>
      );
    }
  };

  return (
    <div style={{animation:"slideUp .3s ease"}}>
      {modal}
      {renderContent()}
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
    <div style={{minHeight:"100vh",background:"#16181a",color:"#dde8df",fontFamily:"'Georgia',serif"}}>
      <div style={{position:"relative",zIndex:1,maxWidth:1060,margin:"0 auto",padding:"0 22px 90px"}}>
        <div style={{padding:"24px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={onBack} style={{background:"none",border:"none",color:"#8ea898",fontSize:".82rem",cursor:"pointer"}}> Back</button>

        </div>
        <div style={{textAlign:"center",padding:"52px 0 60px",animation:"fadeUp .6s ease"}}>
          <div style={{display:"inline-block",background:"rgba(61,184,118,.1)",border:"1px solid rgba(61,184,118,.22)",borderRadius:40,padding:"5px 17px",fontSize:".7rem",letterSpacing:".18em",textTransform:"uppercase",color:"#6fcf97",marginBottom:22}}>Simple, honest pricing</div>
          <h1 style={{fontSize:"clamp(2.2rem,5.5vw,3.6rem)",fontWeight:400,color:"#2a3838",lineHeight:1.15,letterSpacing:"-.02em",marginBottom:14}}>Eat well. Move well.<br/><em style={{color:"#6fcf97"}}>Start for 3.</em></h1>
          <p style={{color:"#8ea898",fontSize:"clamp(.88rem,2vw,.98rem)",maxWidth:440,margin:"0 auto",lineHeight:1.8}}>Food, fitness, breathwork and sleep  all in one place.</p>
        </div>
        <div className="np-tier-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))",gap:18,animation:"fadeUp .6s ease .1s both"}}>
          {TIERS.map((t,i)=>(
            <div key={t.name} className="tier-card" style={{position:"relative",background:t.highlight?"linear-gradient(155deg,rgba(61,184,118,.13),rgba(20,80,40,.18))":"#1e2226",border:t.highlight?"1px solid rgba(61,184,118,.38)":"1px solid rgba(0,0,0,.06)",borderRadius:22,padding:"34px 28px",display:"flex",flexDirection:"column",animation:"fadeUp .5s ease "+(.1+i*.09)+"s both"}}>
              {t.badge&&<div style={{position:"absolute",top:-13,left:"50%",transform:"translateX(-50%)",background:"linear-gradient(135deg,#2d8a50,#1e6038)",borderRadius:40,padding:"4px 16px",fontSize:".76rem",letterSpacing:".11em",textTransform:"uppercase",color:"#dde8df",fontWeight:600,whiteSpace:"nowrap",animation:"pulseRing 2.5s ease infinite"}}> {t.badge}</div>}
              {user&&user.tier&&(user.tier.toLowerCase()===t.name.toLowerCase()||user.tier===t.name)&&<div style={{position:"absolute",top:-13,left:"50%",transform:"translateX(-50%)",background:"rgba(61,184,118,.18)",border:"1px solid rgba(61,184,118,.4)",borderRadius:40,padding:"4px 16px",fontSize:".76rem",letterSpacing:".11em",textTransform:"uppercase",color:"#6fcf97",fontWeight:600,whiteSpace:"nowrap"}}> Current plan</div>}
              <div style={{fontSize:".78rem",letterSpacing:".14em",textTransform:"uppercase",color:t.highlight?"#1e7040":"#ddd9d3",marginBottom:16}}>{t.name}</div>
              <div style={{marginBottom:4}}><span style={{fontSize:"clamp(2.6rem,5vw,3.2rem)",fontWeight:400,color:"#2a3838",letterSpacing:"-.03em",lineHeight:1}}>{t.price}</span><span style={{color:"#8ea898",fontSize:".78rem",marginLeft:5}}>{t.per}</span></div>
              <div style={{color:"#8ea898",fontSize:".92rem",marginBottom:4}}>{t.searches}</div>
              <div style={{display:"inline-block",background:"rgba(61,184,118,.07)",border:"1px solid rgba(61,184,118,.14)",borderRadius:20,padding:"3px 12px",fontSize:".8rem",color:"#8ea898",marginBottom:20,alignSelf:"flex-start"}}>{t.rate}</div>
              <p style={{color:"#8ea898",fontSize:".9rem",lineHeight:1.7,marginBottom:22,fontStyle:"italic"}}>{t.desc}</p>
              <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:28,flex:1}}>{t.features.map((f,j)=><div key={j} style={{display:"flex",gap:8,alignItems:"flex-start"}}><span style={{color:"#6fcf97",fontSize:".82rem",marginTop:1,flexShrink:0}}></span><span style={{color:"#8ea898",fontSize:".9rem",lineHeight:1.55}}>{f}</span></div>)}</div>
              <button className="cta-btn" onClick={()=>openCheckout(t)} disabled={processing===t.stripeId||(user&&user.tier&&user.tier.toLowerCase()===t.name.toLowerCase())} style={{background:t.highlight?"linear-gradient(135deg,#2d8a50,#1e6038)":"#1e2226",border:t.highlight?"none":"1px solid rgba(61,184,118,.22)",borderRadius:12,padding:"13px 20px",color:t.highlight?"#eaf0eb":"#8ea898",fontSize:".86rem",cursor:processing===t.stripeId?"wait":"pointer",fontWeight:t.highlight?600:400,width:"100%",boxShadow:t.highlight?"0 4px 20px rgba(61,184,118,.22)":"none",opacity:processing&&processing!==t.paddleId?.6:1}}>{processing===t.stripeId?"Processing":(user&&user.tier&&user.tier.toLowerCase()===t.name.toLowerCase()?"Current plan ":t.cta+" ")}</button>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",marginTop:42,display:"flex",justifyContent:"center",gap:24,flexWrap:"wrap"}}>
          {[" Secure via Stripe"," Cancel anytime"," Food   Fitness   Breath   Sleep"].map((s,i)=><span key={i} style={{color:"#8ea898",fontSize:".86rem"}}>{s}</span>)}
        </div>
        <div style={{maxWidth:580,margin:"64px auto 0"}}>
          <h2 style={{textAlign:"center",fontSize:"1.45rem",fontWeight:400,color:"#8ea898",marginBottom:32}}>Questions</h2>
          {[["What does one search cover?","Each search returns food recommendations, exercises, breathwork techniques and sleep tips  all relevant to your query. 1 credit covers all pillars."],["Do credits roll over?","Starter credits never expire. Monthly plan credits reset on your billing date."],["Can I switch plans?","Yes  upgrade or downgrade any time. Upgrading between monthly plans (Thrive  Optimise) is prorated automatically. Upgrading from the one-time Starter pack to a monthly plan charges the full monthly price."],["How do I cancel?","One click in your account settings. No calls, no forms, no guilt."]].map(([q,a],i)=>(
            <div key={i} style={{borderBottom:"1px solid rgba(61,184,118,.09)",padding:"18px 0"}}>
              <div style={{color:"#8ea898",fontSize:"1rem",marginBottom:6}}>{q}</div>
              <div style={{color:"#8ea898",fontSize:".9rem",lineHeight:1.75}}>{a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchBar({ value, onChange, onSubmit, loading, hasConvo, placeholder }) {
  return(
    <div className="search-ring" style={{background:"rgba(255,255,255,.055)",border:"1.5px solid rgba(61,184,118,.28)",borderRadius:28,padding:"clamp(6px,1vw,10px) clamp(6px,1vw,10px) clamp(6px,1vw,10px) clamp(18px,2vw,26px)",display:"flex",alignItems:"center",gap:10,transition:"border-color .2s, box-shadow .2s",boxShadow:"0 2px 24px rgba(61,184,118,.07)"}}>
      <span style={{fontSize:16,opacity:.4,flexShrink:0}}></span>
      <input value={value} onChange={e=>onChange(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!loading&&onSubmit(value)} placeholder={placeholder||"How are you feeling? What do you want to improve?"} style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#2a3838",fontSize:"clamp(1rem,1.7vw,1.15rem)",padding:"clamp(12px,1.5vw,17px) 0",caretColor:"#1e7040",minWidth:0}}/>
      <button onClick={()=>onSubmit(value)} disabled={!value.trim()||loading} style={{background:value.trim()&&!loading?"linear-gradient(135deg,#2d8a50,#1e6038)":"rgba(61,184,118,.13)",border:"none",borderRadius:"clamp(14px,1.5vw,20px)",padding:"clamp(10px,1.2vw,15px) clamp(18px,2.5vw,32px)",color:"#dde8df",fontSize:"clamp(.96rem,1.5vw,1.1rem)",cursor:value.trim()&&!loading?"pointer":"default",fontWeight:600,whiteSpace:"nowrap",transition:"background .18s",flexShrink:0}}>
        {loading?<span style={{display:"inline-block",animation:"spin 1s linear infinite"}}></span>:(hasConvo?"Ask ":"Search")}
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
          <button key={p} className="pillar-tab" onClick={()=>setActivePillar(p)} style={{background:active?m.bg:"#1e2226",border:"1px solid "+(active?m.border:"rgba(255,255,255,.1)"),borderRadius:30,padding:"7px 16px",color:active?m.color:"#8ea898",fontSize:".84rem",cursor:"pointer",display:"flex",alignItems:"center",gap:6,transition:"all .18s"}}>
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

// --- HISTORY MODAL ------------------------------------------------------------

function HistoryModal({ onClose, onLoad, user }) {
  const uid = user?.id || null;
  const [convs, setConvs] = useState(()=>loadConversations(uid));
  const fmt = (ts) => {
    const d = new Date(ts), now = new Date();
    const diff = now - d;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return Math.floor(diff/60000)+"m ago";
    if (diff < 86400000) return Math.floor(diff/3600000)+"h ago";
    if (diff < 604800000) return Math.floor(diff/86400000)+"d ago";
    return d.toLocaleDateString();
  };
  const del = (id, e) => { e.stopPropagation(); deleteConversation(id, uid); setConvs(loadConversations(uid)); };
  return (
    <Modal onClose={onClose} maxWidth={480}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <span style={{color:"#8ea898",fontSize:"1.05rem"}}> Conversation history</span>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#8ea898",cursor:"pointer",fontSize:"1.1rem"}}></button>
      </div>
      {convs.length===0
        ? <div style={{color:"#8ea898",fontSize:".9rem",textAlign:"center",padding:"30px 0",fontStyle:"italic"}}>No saved conversations yet.<br/>Complete a search and it will appear here.</div>
        : <div style={{display:"flex",flexDirection:"column",gap:7,maxHeight:400,overflowY:"auto"}}>
            {convs.map(c=>(
              <div key={c.id} onClick={()=>{onLoad(c.messages);onClose();}}
                style={{background:"rgba(61,184,118,.06)",border:"1px solid rgba(61,184,118,.16)",borderRadius:12,padding:"12px 14px",cursor:"pointer",transition:"all .15s",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(30,112,64,.1)"}
                onMouseLeave={e=>e.currentTarget.style.background="rgba(61,184,118,.06)"}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:"#2a3838",fontSize:".88rem",lineHeight:1.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.title}</div>
                  <div style={{color:"#8a9a8e",fontSize:".74rem",marginTop:3}}>{fmt(c.date)}  {c.messages.filter(m=>m.role==="user").length} search{c.messages.filter(m=>m.role==="user").length!==1?"es":""}</div>
                </div>
                <button onClick={(e)=>del(c.id,e)} style={{background:"none",border:"none",color:"#8ea898",cursor:"pointer",fontSize:".82rem",padding:"2px 4px",flexShrink:0,borderRadius:6,transition:"color .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.color="#c84040"}
                  onMouseLeave={e=>e.currentTarget.style.color="#ddd9d3"}></button>
              </div>
            ))}
          </div>
      }
      {convs.length>0&&<div style={{color:"#8ea898",fontSize:".74rem",textAlign:"center",marginTop:14,fontStyle:"italic"}}>Click any conversation to restore it</div>}
    </Modal>
  );
}

// --- LOGO SVG -----------------------------------------------------------------

function FnfLogo({ size = 40, animated = false }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{display:"block", flexShrink:0, animation: animated ? "float 5s ease-in-out infinite" : "none"}}>

      {/* -- Apple body outline (heart-shaped bottom, rounded top) -- */}
      <path
        d="M50 88 C28 72 14 56 14 40 C14 26 24 18 36 20 C41 21 46 24 50 28 C54 24 59 21 64 20 C76 18 86 26 86 40 C86 56 72 72 50 88Z"
        fill="none"
        stroke="#1e7040"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {/* -- Leaf -- */}
      <ellipse cx="44" cy="13" rx="6" ry="10" transform="rotate(-30 44 13)" fill="#1e7040" opacity="0.9"/>

      {/* -- Stem -- */}
      <path d="M50 20 C50 17 48 13 46 11" stroke="#6fcf97" strokeWidth="2.5" strokeLinecap="round"/>

      {/* -- Fork (left) -- */}
      {/* tines */}
      <line x1="33" y1="34" x2="33" y2="42" stroke="#1e7040" strokeWidth="2" strokeLinecap="round"/>
      <line x1="36" y1="34" x2="36" y2="42" stroke="#1e7040" strokeWidth="2" strokeLinecap="round"/>
      <line x1="39" y1="34" x2="39" y2="42" stroke="#1e7040" strokeWidth="2" strokeLinecap="round"/>
      {/* neck */}
      <path d="M33 42 Q36 46 36 50 L36 62" stroke="#1e7040" strokeWidth="2.5" strokeLinecap="round" fill="none"/>

      {/* -- Dumbbell (right) -- */}
      {/* bar */}
      <line x1="55" y1="48" x2="72" y2="48" stroke="#3a4e48" strokeWidth="3" strokeLinecap="round"/>
      {/* left weight plate */}
      <rect x="52" y="42" width="6" height="12" rx="2" fill="#7d9483"/>
      {/* right weight plate */}
      <rect x="69" y="42" width="6" height="12" rx="2" fill="#7d9483"/>
      {/* left collar */}
      <rect x="57" y="44" width="3" height="8" rx="1" fill="#1e7040"/>
      {/* right collar */}
      <rect x="67" y="44" width="3" height="8" rx="1" fill="#1e7040"/>
    </svg>
  );
}

// --- SIGNUP GATE MODAL (shown after 3 free searches) -------------------------
function SignupGateModal({ onSignup, onLogin, onClose }) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <div style={{position:"absolute",inset:0,background:"rgba(5,14,7,.92)",backdropFilter:"blur(12px)"}} onClick={onClose}/>
      <div style={{position:"relative",width:"100%",maxWidth:420,background:"#1e2226",border:"1px solid rgba(61,184,118,.3)",borderRadius:24,overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,.7)"}}>
        <div style={{height:4,background:"linear-gradient(90deg,#3db876,#6fcf97,#3db876)"}}/>
        <div style={{padding:"36px 32px 40px"}}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{width:64,height:64,borderRadius:"50%",background:"rgba(61,184,118,.15)",border:"1px solid rgba(61,184,118,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 16px"}}></div>
            <div style={{color:"#dde8df",fontSize:"1.5rem",fontWeight:700,fontFamily:"Georgia,serif",marginBottom:8}}>You have used your 3 free searches</div>
            <div style={{color:"#8ea898",fontSize:".95rem",lineHeight:1.7}}>Create a free account to keep going  unlimited searches, saved history, and personalised plans.</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
            {[["v","Unlimited searches - always free"],["v","Saved conversation history"],["v","Personalised to your profile"],["v","Weekly wellness plans"]].map(([icon,text],i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:"rgba(61,184,118,.07)",border:"1px solid rgba(61,184,118,.15)",borderRadius:12,padding:"12px 16px"}}>
                <span style={{fontSize:20}}>{icon}</span>
                <span style={{color:"#8ea898",fontSize:".95rem"}}>{text}</span>
              </div>
            ))}
          </div>
          <button onClick={onSignup} style={{width:"100%",padding:"16px",background:"linear-gradient(135deg,#2d8a50,#1e6038)",border:"none",borderRadius:14,color:"#dde8df",fontSize:"1.05rem",fontWeight:700,cursor:"pointer",marginBottom:12,fontFamily:"Georgia,serif"}}>
            Create free account 
          </button>
          <button onClick={onLogin} style={{width:"100%",padding:"14px",background:"transparent",border:"1px solid rgba(61,184,118,.25)",borderRadius:14,color:"#8ea898",fontSize:".95rem",cursor:"pointer",fontFamily:"Georgia,serif"}}>
            I already have an account
          </button>
          <div style={{textAlign:"center",marginTop:16,color:"#8ea898",fontSize:".8rem"}}>Free forever  No card required</div>
        </div>
      </div>
    </div>
  );
}


// --- ERROR BOUNDARY ----------------------------------------------------------
class SafeResult extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, errorMsg: "" }; }
  static getDerivedStateFromError(err) { return { hasError: true, errorMsg: err?.message || "" }; }
  componentDidCatch(err, info) { console.error("ResultCard crash:", err, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:"16px 20px",background:"rgba(61,184,118,.06)",borderRadius:12,border:"1px solid rgba(61,184,118,.2)",display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:20}}></span>
          <div>
            <div style={{color:"#8ea898",fontSize:".95rem",marginBottom:4}}>Something went wrong displaying this result.</div>
            <button onClick={()=>this.setState({hasError:false,errorMsg:""})} style={{background:"none",border:"none",color:"#6fcf97",fontSize:".85rem",cursor:"pointer",padding:0,textDecoration:"underline"}}>Try again</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Top-level App error boundary  catches anything SafeResult misses
class AppErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err, info) { console.error("App-level crash:", err, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{minHeight:"100vh",background:"#16181a",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{textAlign:"center",maxWidth:400}}>
            <div style={{fontSize:48,marginBottom:16}}></div>
            <div style={{color:"#2a3838",fontSize:"1.2rem",fontWeight:600,marginBottom:8,fontFamily:"Georgia,serif"}}>Something went wrong</div>
            <div style={{color:"#8ea898",fontSize:".95rem",marginBottom:24,lineHeight:1.6}}>The app hit an unexpected error. Your search history is safe.</div>
            <button onClick={()=>{ this.setState({hasError:false}); window.location.reload(); }}
              style={{background:"linear-gradient(135deg,#2d8a50,#1e6038)",border:"none",borderRadius:12,padding:"12px 28px",color:"#dde8df",fontSize:"1rem",cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:600}}>
              Reload app
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


function App() {
  const [page,setPage]=useState("home");
  const [user,setUser]=useState(getUser);
  const [showAuth,setShowAuth]=useState(false);
  const [authMode,setAuthMode]=useState("login");
  const [showProfile,setShowProfile]=useState(false);

  const [showSignUp,setShowSignUp]=useState(false);
  const [showSignupGate,setShowSignupGate]=useState(false);
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

  useEffect(()=>{
    const handler = (e) => console.error("[fnf] unhandled error:", e?.message || e);
    window.addEventListener("error", handler);
    window.addEventListener("unhandledrejection", e => console.error("[fnf] unhandled promise:", e?.reason));
    return () => window.removeEventListener("error", handler);
  }, []);

  useEffect(()=>{userRef.current=user;},[user]);
  // Smart scroll  only scroll on new messages, never on weekPlan injection
  const msgCountRef = useRef(0);
  const userScrolledRef = useRef(false);
  useEffect(()=>{
    const el = bottomRef.current;
    if (!el) return;
    const newCount = messages.filter(m=>m.role).length;
    // Only scroll if a genuinely new message was added (not weekPlan patch)
    if (newCount > msgCountRef.current) {
      msgCountRef.current = newCount;
      userScrolledRef.current = false;
      setTimeout(()=>{ if (!userScrolledRef.current) el.scrollIntoView({behavior:"smooth"}); }, 80);
    }
  }, [messages, loading]);

  // Track manual scroll  stop auto-scroll if user scrolled up
  useEffect(()=>{
    const onScroll = () => { userScrolledRef.current = true; };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Restore Supabase session on load (handles cross-device login)
  useEffect(()=>{
    supabase.auth.getSession().then(async({data:{session}})=>{
      if(session?.user){
        const profile=await fetchProfile(session.user.id);
        if(profile){
          const cached = getUser();
          const prefs = getPrefs(profile.email); // survives sign-out
          const u={
            id:session.user.id,
            name:profile.name||cached?.name||"",
            email:profile.email||cached?.email||"",
            allergies:profile.allergies?.length ? profile.allergies : (prefs.allergies||cached?.allergies||[]),
            credits:profile.credits??cached?.credits??3,
            tier:profile.tier||cached?.tier||"free",
            sex:profile.sex||prefs.sex||cached?.sex||"",
            age:profile.age??prefs.age??cached?.age??null,
            weight:profile.weight??prefs.weight??cached?.weight??null,
            history:profile.history||cached?.history||[]
          };
          saveUser(u);setUser(u);userRef.current=u;
          loadConversationsRemote(session.user.id).then(convs=>saveConversationsLocal(convs, session.user.id));
        }
      }
    });

    // Listen for auth changes (e.g. password reset redirect)
    const {data:{subscription}}=supabase.auth.onAuthStateChange(async(event,session)=>{
      if(event==="SIGNED_IN"&&session?.user){
        // Sync history whenever a sign-in is detected (covers OAuth, magic link, etc.)
        loadConversationsRemote(session.user.id).then(convs=>saveConversationsLocal(convs, session.user.id));
      }
      if(event==="SIGNED_OUT"){ const uid=userRef.current?.id; clearUser(); setUser(null); userRef.current=null; }
      if(event==="PASSWORD_RECOVERY"){
        // Open auth modal in reset mode so user can set new password
        setAuthMode("reset");
        setShowAuth(true);
      }
    });
    return()=>subscription.unsubscribe();
  },[]);

  const handleAuth=(u)=>{
    setUser(u);userRef.current=u;setShowAuth(false);setShowSignUp(false);
    localStorage.removeItem("np_guest_searches");setGuestSearches(0);
    if(window.posthog){window.posthog.identify(u.email,{name:u.name,email:u.email});window.posthog.capture("signed_up");}
    // Pull full history from Supabase on every login  merges remote + local + guest
    if(u?.id) loadConversationsRemote(u.id).then(convs=>saveConversationsLocal(convs, u.id));
  };
  const handleLogout=()=>{setUser(null);userRef.current=null;setMessages([]);setShowProfile(false);};

  const recordSuccess=async(isFollowUp,q)=>{
    const cu=userRef.current; if(!cu)return;
    const newHistory=[...(cu.history||[]),{query:q,date:Date.now()}].slice(-50);
    const updated={...cu,history:newHistory};
    saveUser(updated);setUser(updated);userRef.current=updated;
    if(cu.id) await upsertProfile(cu.id,{history:newHistory});
  };

  const fetchWeekPlan=async(concern)=>{
    try{
      const cu=userRef.current;
      const res=await fetch("/.netlify/functions/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:1200,system:buildWeekPlanPrompt(cu,concern),messages:[{role:"user",content:"Create a 7-day holistic wellness plan for: "+concern}]})});
      if(!res.ok)return;
      let data; try { data=JSON.parse(await res.text()); } catch(_){return;}
      const raw=(data.content||[]).map(b=>b.text||"").join("").trim();
      const plan=safeParseJSON(raw,true);
      if(!Array.isArray(plan)||plan.length===0)return;
      setMessages(p=>{const u=[...p];for(let i=u.length-1;i>=0;i--){if(u[i].role==="assistant"&&u[i].result){u[i]={...u[i],result:{...u[i].result,weekPlan:plan}};break;}}return u;});
    }catch(_){}
  };

  const GUEST_LIMIT = 3;

  const handleQuery=async(query)=>{
    const q=query.trim();if(!q||loading)return;
    const isFollowUp=messages.some(m=>m.role==="assistant");
    if(!user){
      const c=getGuestCount();
      if(c>=GUEST_LIMIT){setShowSignupGate(true);return;}
      const n=c+1;
      localStorage.setItem("np_guest_searches",String(n));
      setGuestSearches(n);
      if(n>=GUEST_LIMIT){
        // allow this search but gate will show after result renders
      }
    }

    const apiMessages=[];
    messages.forEach(m=>{if(m.role==="user")apiMessages.push({role:"user",content:m.content});else if(m.result)apiMessages.push({role:"assistant",content:m.result.acknowledgment||""});});
    apiMessages.push({role:"user",content:q});
    setMessages(p=>[...p,{role:"user",content:q}]);setInput("");setError(null);setLoading(true);
    // Repair a parsed result so it always has enough to render
    const repairResult = (r, q) => {
      try {
        if (!r || typeof r !== "object") {
          return { responseType:"initial", acknowledgment:"Here are your recommendations.", pillars:[], cards:[], recipes:[], tip:"" };
        }
        // Ensure acknowledgment
        if (!r.acknowledgment || typeof r.acknowledgment !== "string") r.acknowledgment = "Here is what I found for you.";
        // Ensure arrays exist and are actual arrays
        if (!Array.isArray(r.pillars))  r.pillars  = [];
        if (!Array.isArray(r.cards))    r.cards    = [];
        if (!Array.isArray(r.recipes))  r.recipes  = [];
        // Clean pillars  ensure each has type, label, items array
        r.pillars = r.pillars.filter(Boolean).map(p => ({
          type:  String(p.type  || "food"),
          label: String(p.label || ""),
          items: Array.isArray(p.items) ? p.items.filter(Boolean).map(item => ({
            name:      String(item.name      || ""),
            benefit:   String(item.benefit   || ""),
            emoji:     String(item.emoji     || ""),
            when:      String(item.when      || ""),
            struggle:  String(item.struggle  || ""),
            outcome:   String(item.outcome   || ""),
            timeframe: String(item.timeframe || ""),
          })).filter(item => item.name) : []
        }));
        // Clean cards  ensure each has title, body, pillar
        r.cards = r.cards.filter(Boolean).map(c => ({
          title:  String(c.title  || c.name || ""),
          body:   String(c.body   || c.benefit || ""),
          emoji:  String(c.emoji  || ""),
          pillar: String(c.pillar || "food"),
          image:  String(c.image  || ""),
        })).filter(c => c.title);
        // Clean recipes
        r.recipes = r.recipes.filter(Boolean).map(rec => ({
          name:        String(rec.name  || "Recipe"),
          emoji:       String(rec.emoji || ""),
          ingredients: Array.isArray(rec.ingredients) ? rec.ingredients.filter(Boolean).map(String) : [],
          steps:       Array.isArray(rec.steps)       ? rec.steps.filter(Boolean).map(String)       : [],
        }));
        // Ensure responseType
        if (!r.responseType) {
          if (r.pillars.length)       r.responseType = "initial";
          else if (r.cards.length)    r.responseType = "insight";
          else if (r.recipes.length)  r.responseType = "recipe";
          else                        r.responseType = "initial";
        }
        r.tip = String(r.tip || "");
        return r;
      } catch(e) {
        console.error("repairResult error:", e);
        return { responseType:"initial", acknowledgment:"Here are your recommendations.", pillars:[], cards:[], recipes:[], tip:"" };
      }
    };

    const attemptQuery = async (attempt=1) => {
      // attempt 1: Sonnet, 2800 tokens, 26s timeout
      // attempt 2: Haiku,  2000 tokens, 22s timeout (faster, cheaper)
      // attempt 3: Haiku,  1600 tokens, 20s timeout (minimal)
      // Attempt 1: Haiku fast (8s target), 2: Haiku minimal (6s), 3: Haiku tiny (5s)
      const timeouts = [25000, 22000, 20000];
      const models   = ["claude-haiku-4-5-20251001","claude-haiku-4-5-20251001","claude-haiku-4-5-20251001"];
      const tokens   = [1200, 1000, 800];
      const idx = Math.min(attempt-1, 2);
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeouts[idx]);
      let res;
      try {
        res = await fetch("/.netlify/functions/chat", {
          method: "POST",
          signal: ctrl.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: models[idx],
            max_tokens: tokens[idx],
            system: buildPrompt(userRef.current, isFollowUp),
            messages: apiMessages
          })
        });
      } catch(fetchErr) {
        clearTimeout(timer);
        if (fetchErr.name === "AbortError") throw new Error("TIMEOUT");
        throw fetchErr;
      }
      clearTimeout(timer);
      const text=await res.text();
      if(!res.ok)throw new Error("Server error "+res.status+": "+text.slice(0,180));
      let data; try { data=JSON.parse(text); } catch(_){ if(attempt<3) return attemptQuery(attempt+1); throw new Error("Invalid server response"); }
      const raw=(data.content||[]).map(b=>b.text||"").join("").trim();
      if(!raw){ if(attempt<3) return attemptQuery(attempt+1); }
      let result;
      try { result = safeParseJSON(raw, false); } catch(parseErr) {
        if(attempt<3) return attemptQuery(attempt+1);
        throw parseErr;
      }
      const repaired = repairResult(result, q);
      // Must have something renderable
      const hasContent = repaired && (
        repaired.pillars?.length || repaired.cards?.length ||
        repaired.recipes?.length || repaired.acknowledgment
      );
      if (!hasContent && attempt<3) return attemptQuery(attempt+1);
      // Always return something  even a minimal shell
      return repaired || { responseType:"initial", acknowledgment:"Here are your recommendations.", pillars:[], cards:[], recipes:[], tip:"" };
    };
    try{
      const result = await attemptQuery();
      setMessages(p=>{
        const updated=[...p,{role:"assistant",content:result.acknowledgment,result}];
        if (user) saveConversation(updated, user.id);
        return updated;
      });
      if(!user && getGuestCount()>=GUEST_LIMIT){
        setTimeout(()=>setShowSignupGate(true), 1800);
      }
      recordSuccess(isFollowUp,q);
      if(window.posthog)window.posthog.capture("search_completed",{query:q,is_follow_up:isFollowUp,pillar_count:(result.pillars||[]).length});if(window.tlTrack)window.tlTrack('feature_used',{feature:'search',is_follow_up:isFollowUp,pillar_count:(result.pillars||[]).length});
      fetchWeekPlan(q);
    }catch(e){
      // Network/server hard failure  show inline error but keep prior results visible
      const msg = e.message === "TIMEOUT"
        ? "Took too long to respond - tap Ask again to retry."
        : e.message?.includes("504") || e.message?.includes("503")
          ? "Server is busy - tap Ask to retry."
          : "Something went wrong - tap Ask to try again.";
      setError(msg);
    }finally{setLoading(false);}
  };

  const reset=()=>{setMessages([]);setError(null);setInput("");};




  try { return(
    <div style={{minHeight:"100vh",background:"#16181a",color:"#dde8df"}}>
      <style>{CSS}</style>
      {showAuth&&<AuthModal key={authMode} onClose={()=>setShowAuth(false)} onAuth={handleAuth} defaultMode={authMode}/>}
      {showSignupGate&&!user&&<SignupGateModal
        onSignup={()=>{setShowSignupGate(false);setAuthMode("signup");setShowAuth(true);if(window.tlTrack)window.tlTrack("signup_started");}}
        onLogin={()=>{setShowSignupGate(false);setAuthMode("login");setShowAuth(true);}}
        onClose={()=>setShowSignupGate(false)}
      />}
      {showProfile&&user&&<ProfileModal user={user} onClose={()=>setShowProfile(false)} onUpdate={u=>{setUser(u);setShowProfile(false);}} onLogout={handleLogout} onUpgrade={()=>{}}/>}

      {showSignUp&&<SignUpPrompt onClose={()=>setShowSignUp(false)} onSignUp={()=>{setShowSignUp(false);setAuthMode("signup");setShowAuth(true);if(window.tlTrack)window.tlTrack("signup_started");}}/>}
      {showHistory && <HistoryModal onClose={()=>setShowHistory(false)} onLoad={(msgs)=>{setMessages(msgs);setInput("");setError(null);}} user={user}/>}
      <div style={{position:"fixed",inset:0,background:"#16181a",zIndex:0,pointerEvents:"none"}}/>
      <div style={{position:"relative",zIndex:1,maxWidth:1100,margin:"0 auto",padding:"0 0 80px",overflowX:"hidden",minHeight:"100vh"}}>

        {/* NAV */}
        <nav style={{padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"0.5px solid rgba(255,255,255,.06)"}}>
          <button onClick={reset} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
            <FnfLogo size={36} animated={!hasConvo}/>
            <span style={{color:"#8ea898",fontSize:"clamp(.9rem,1.4vw,1.05rem)",letterSpacing:".03em",fontWeight:600}}>foodnfitness<span style={{color:"#6fcf97"}}>.ai</span></span>
          </button>
          <div style={{display:"flex",gap:7,alignItems:"center"}}>

            
            {user && <button onClick={()=>setShowHistory(true)} style={{background:"none",border:"1px solid rgba(61,184,118,.17)",borderRadius:20,padding:"clamp(6px,.7vw,9px) clamp(14px,1.6vw,22px)",color:"#8ea898",fontSize:"clamp(.82rem,1.2vw,.95rem)",cursor:"pointer"}}>History</button>}
            {user
              ?<button onClick={()=>setShowProfile(true)} style={{background:"rgba(61,184,118,.1)",border:"1px solid rgba(61,184,118,.24)",borderRadius:20,padding:"4px 12px",color:"#6fcf97",fontSize:".78rem",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                <span> {user.name.split(" ")[0]}</span>
                
              </button>
              :<button onClick={()=>{setAuthMode("login");setShowAuth(true);}} style={{background:"linear-gradient(135deg,#2d8a50,#1e6038)",border:"none",borderRadius:20,padding:"5px 15px",color:"#dde8df",fontSize:".78rem",cursor:"pointer",fontWeight:600}}>Sign in</button>
            }
          </div>
        </nav>

        {/* HOME - always mounted, just hidden when convo starts */}
        <div style={{display: hasConvo ? "none" : "block"}}>
            <div style={{textAlign:"center",padding:"clamp(36px,6vw,72px) clamp(24px,8vw,120px) clamp(20px,3vw,36px)"}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:18}}>
                <FnfLogo size={80} animated={true}/>
              </div>
              <h1 style={{fontSize:"clamp(2.2rem,5vw,4.2rem)",fontWeight:400,color:"#8ea898",margin:"0 0 10px",letterSpacing:"-.02em"}}>How are you feeling today?</h1>
              <p style={{color:"#8ea898",fontSize:"clamp(1rem,1.9vw,1.2rem)",fontStyle:"italic",margin:"0 0 6px"}}>Food  Fitness  Breathwork  Sleep</p>
              <p style={{color:"#8ea898",fontSize:"clamp(.88rem,1.5vw,1.02rem)",lineHeight:1.75,margin:"0 0 14px"}}>Describe what you are going through  we will build your personalised wellness plan</p>
              <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:8,marginTop:6,marginBottom:4}}>
                {user?.allergies?.length>0&&<div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(200,70,70,.07)",border:"1px solid rgba(200,70,70,.17)",borderRadius:20,padding:"3px 12px"}}><span style={{color:"#c04040",fontSize:".82rem"}}> Avoiding: {user.allergies.join(", ")}</span></div>}
                {user?.sex&&<div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(61,184,118,.07)",border:"1px solid rgba(61,184,118,.18)",borderRadius:20,padding:"3px 12px"}}><span style={{color:"#8ea898",fontSize:".82rem"}}>{user.sex==="female"?" Female profile":" Male profile"}</span></div>}
                {user&&(!user.sex||!user.age||!user.weight)&&<button onClick={()=>setShowProfile(true)} style={{background:"none",border:"1px dashed rgba(61,184,118,.25)",borderRadius:20,padding:"3px 12px",color:"#8ea898",fontSize:".78rem",cursor:"pointer",fontFamily:"'Georgia',serif",fontStyle:"italic"}}>
  + {[!user.sex&&"sex",!user.age&&"age",!user.weight&&"weight"].filter(Boolean).join(", ")}  personalise results
</button>}
              </div>
            </div>
            <div style={{padding:"0 clamp(20px,5vw,80px) 20px"}}>
              <SearchBar value={input} onChange={setInput} onSubmit={handleQuery} loading={loading} hasConvo={false} placeholder="How are you feeling? What do you want to improve?"/>
            </div>
            <div style={{margin:"0 clamp(20px,5vw,80px) 20px",background:"rgba(255,200,70,.04)",border:"1px solid rgba(255,200,70,.12)",borderRadius:12,padding:"10px 14px",display:"flex",gap:9,alignItems:"flex-start"}}>
              <span style={{fontSize:13,flexShrink:0,marginTop:1,opacity:.7}}></span>
              <p style={{margin:0,color:"#966010",fontSize:"clamp(.8rem,1.2vw,.92rem)",lineHeight:1.65}}><strong style={{color:"#8a7a30"}}>Disclaimer:</strong> foodnfitness.ai provides general wellness suggestions only. Always consult a healthcare professional before making changes to diet, exercise or medication.</p>
            </div>
            <div style={{padding:"0 0 10px"}}>
              <div style={{display:"flex",alignItems:"center",gap:11,padding:"0 20px",marginBottom:14}}>
                <div style={{flex:1,height:1,background:"rgba(61,184,118,.09)"}}/>
                <span style={{color:"#8ea898",fontSize:"clamp(.8rem,1.2vw,.92rem)",letterSpacing:".1em",whiteSpace:"nowrap"}}>or pick a topic</span>
                <div style={{flex:1,height:1,background:"rgba(61,184,118,.09)"}}/>
              </div>
              <ChipSection onQuery={handleQuery}/>
            </div>
            {!user&&<div style={{textAlign:"center",padding:"12px 0 8px"}}>
              <button onClick={()=>{setAuthMode("signup");setShowAuth(true);if(window.tlTrack)window.tlTrack("signup_started");}} style={{background:"linear-gradient(135deg,rgba(61,184,118,.15),rgba(61,184,118,.06))",border:"1px solid rgba(61,184,118,.4)",borderRadius:24,padding:"10px 28px",color:"#6fcf97",fontSize:".95rem",cursor:"pointer",fontFamily:"'Georgia',serif",fontWeight:600,letterSpacing:".02em",boxShadow:"0 2px 16px rgba(61,184,118,.15)",transition:"all .18s"}}>
                 Sign up free  unlimited searches
              </button>
            </div>}
        </div>

        {/* CHAT - always mounted, shown when convo starts */}
        <div style={{display: hasConvo ? "block" : "none"}}>
          <div style={{minHeight:"80vh",display:"flex",flexDirection:"column"}}>
            <div style={{padding:"16px 20px 0"}}>
              {(messages||[]).map((msg,idx)=>{
                if(!msg) return null;
                return (
                  <div key={idx} style={{marginBottom:msg.role==="user"?8:24,minHeight:0}}>
                    {msg.role==="user"&&<div style={{display:"flex",justifyContent:"flex-end"}}><div style={{display:"inline-block",background:"#252c28",border:"0.5px solid rgba(111,207,151,.18)",borderRadius:"20px 20px 5px 20px",padding:"14px 20px",maxWidth:"82%",color:"#dde8df",fontSize:"1.05rem",lineHeight:1.7,fontWeight:500}}>{msg.content}</div></div>}
                    {msg.role==="assistant"&&<SafeResult><ResultCard result={msg.result} isLast={idx===messages.length-1} onGetMore={()=>{}} activeRecipe={activeRecipe} setActiveRecipe={setActiveRecipe} msgIdx={idx} onAskFollowUp={(q)=>{setInput(q);setTimeout(()=>handleQuery(q),100);}}/></SafeResult>}
                  </div>
                );
              })}
              {loading&&<div style={{animation:"fadeIn .2s ease",padding:"8px 0"}}>
  {/* Animated loading message */}
  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
    <span style={{fontSize:20,display:"inline-block",animation:"spin 1.6s linear infinite"}}>🌿</span>
    <span style={{color:"#8ea898",fontSize:".95rem",fontStyle:"italic"}}>Personalising your plan...</span>
  </div>
  {/* Skeleton cards - shows structure while loading */}
  {["🥗 Food & Nutrition","💪 Exercise","🌬️ Breathwork","🌙 Sleep"].map((label,pi)=>(
    <div key={pi} style={{marginBottom:22,animation:"fadeUp .3s ease both",animationDelay:(pi*0.1)+"s"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"#1e2226",border:"0.5px solid rgba(0,0,0,.07)",borderRadius:10,marginBottom:10}}>
        <span style={{fontSize:16}}>{label.split(" ")[0]}</span>
        <span style={{color:"rgba(255,255,255,.2)",fontSize:".75rem",letterSpacing:".08em",textTransform:"uppercase"}}>{label.split(" ").slice(1).join(" ")}</span>
      </div>
      {[1,2,3].map(i=>(
        <div key={i} style={{display:"flex",gap:0,marginBottom:8}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0,paddingTop:6,marginRight:12}}>
            <div style={{width:9,height:9,borderRadius:"50%",background:"rgba(0,0,0,.07)"}}/>
            <div style={{width:1.5,height:40,background:"#1e2226",marginTop:4}}/>
          </div>
          <div style={{flex:1,background:"#1e2226",border:"0.5px solid rgba(255,255,255,.08)",borderRadius:12,overflow:"hidden"}}>
            <div style={{background:"#1e2226",padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{width:120+(i*20),height:12,background:"#f8f5f0",borderRadius:6,animation:"pulse 1.8s ease infinite",animationDelay:(i*0.15)+"s"}}/>
              <div style={{width:60,height:10,background:"#1e2226",borderRadius:20}}/>
            </div>
            <div style={{padding:"10px 14px 14px"}}>
              <div style={{width:"90%",height:10,background:"#1e2226",borderRadius:6,marginBottom:6,animation:"pulse 1.8s ease infinite",animationDelay:".2s"}}/>
              <div style={{width:"70%",height:10,background:"#1e2226",borderRadius:6,animation:"pulse 1.8s ease infinite",animationDelay:".35s"}}/>
            </div>
          </div>
        </div>
      ))}
    </div>
  ))}
</div>}
              {error&&<div style={{background:"rgba(200,60,60,.08)",border:"1px solid rgba(200,60,60,.18)",borderRadius:10,padding:"11px 15px",color:"#c84040",fontSize:".82rem",marginBottom:12,lineHeight:1.6}}> {error}<button onClick={()=>setError(null)} style={{background:"none",border:"none",color:"#c84040",cursor:"pointer",float:"right",fontSize:".82rem"}}></button></div>}
              <div ref={bottomRef}/>
            </div>
            <div style={{padding:"10px clamp(16px,3vw,32px) clamp(16px,2vw,24px)",borderTop:"1px solid rgba(61,184,118,.07)",marginTop:4}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                <button onClick={reset} style={{background:"none",border:"none",color:"#8ea898",fontSize:".82rem",cursor:"pointer",flexShrink:0}}> Start over</button>
                <span style={{color:"#8ea898",fontSize:".75rem",textAlign:"right",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {(()=>{
                    if(user){const searches=messages.filter(m=>m.role==="user").length;const credDisplay=user.tier==="optimise"?" unlimited":(user.credits??0)+" cr left";return searches+" search"+(searches!==1?"es":"")+"  "+credDisplay;}
                    const g=getGuestCount();
                    const rem=Math.max(0,3-g);
                    if(rem===0)return <span style={{color:"#c84040",fontWeight:500,fontSize:".75rem"}}>3 free searches used  <button onClick={()=>{setAuthMode("signup");setShowAuth(true);if(window.tlTrack)window.tlTrack("signup_started");}} style={{background:"none",border:"none",color:"#6fcf97",cursor:"pointer",fontFamily:"'Georgia',serif",fontSize:"inherit",padding:0,textDecoration:"underline"}}>sign up free to continue</button></span>;
                    return rem+" of 3 free search"+(rem!==1?"es":"")+" used";
                  })()}
                </span>
              </div>
              <SearchBar value={input} onChange={setInput} onSubmit={handleQuery} loading={loading} hasConvo={true} placeholder="Ask a follow-up  food, exercise, breathwork, sleep..."/>
            </div>
          </div>
        </div>

        <div style={{display: hasConvo ? "none" : "block", textAlign:"center",padding:"24px 0 8px"}}><div style={{color:"#8ea898",fontSize:".82rem",letterSpacing:".06em",marginBottom:8}}>foodnfitness.ai  Eat well. Move well. Live well.  Not medical advice</div><div style={{display:"flex",justifyContent:"center",gap:20}}><a href="/terms.html" style={{color:"#8ea898",fontSize:".75rem",textDecoration:"none"}}>Terms</a><a href="/privacy.html" style={{color:"#8ea898",fontSize:".75rem",textDecoration:"none"}}>Privacy</a><a href="/refund.html" style={{color:"#8ea898",fontSize:".75rem",textDecoration:"none"}}>Refund Policy</a></div></div>
      </div>
    </div>
  );
  } catch(appRenderErr) {
    console.error("App render crash:", appRenderErr);
    return (
      <div style={{minHeight:"100vh",background:"#16181a",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center",padding:24}}>
          <div style={{fontSize:48,marginBottom:16}}></div>
          <div style={{color:"#2a3838",fontSize:"1.1rem",fontFamily:"Georgia,serif",marginBottom:16}}>Something went wrong. Please reload.</div>
          <button onClick={()=>window.location.reload()} style={{background:"#1e7040",border:"none",borderRadius:10,padding:"10px 24px",color:"#1e2226",fontSize:"1rem",cursor:"pointer"}}>Reload</button>
        </div>
      </div>
    );
  }
}

export default function AppWithBoundary() {
  return <AppErrorBoundary><App/></AppErrorBoundary>;
}
