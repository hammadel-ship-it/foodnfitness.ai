import { useState, useEffect, useRef } from "react";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { label:"Low Energy",       emoji:"⚡", query:"I feel tired and low on energy all day" },
  { label:"Stress & Anxiety", emoji:"🌿", query:"I'm feeling really stressed and anxious" },
  { label:"Bloating",         emoji:"🌱", query:"I have bloating and digestive discomfort" },
  { label:"Immunity",         emoji:"🛡️", query:"I keep getting sick and want to boost my immunity" },
  { label:"Inflammation",     emoji:"🔥", query:"I have chronic inflammation and joint pain" },
  { label:"Poor Sleep",       emoji:"🌙", query:"I have trouble falling and staying asleep" },
  { label:"Brain Fog",        emoji:"🧠", query:"I have brain fog and can't focus" },
  { label:"Skin Glow",        emoji:"✨", query:"My skin looks dull and I want a natural glow" },
];

const ALLERGIES = ["Gluten","Dairy","Nuts","Soy","Eggs","Shellfish","Fish","Sesame"];

const TIERS = [
  { name:"Starter",  price:"$5",  per:"one-time",  searches:"10 searches",      rate:"$0.50 / search", desc:"Try it out. No commitment.",                  cta:"Get Started",    highlight:false, paddleId:"pri_starter", features:["10 AI food searches","Personalised responses","Foods, recipes & tips","Never expires"] },
  { name:"Nourish",  price:"$15", per:"per month", searches:"50 searches",      rate:"$0.30 / search", desc:"For the health-conscious who return weekly.",   cta:"Start Nourishing", highlight:true,  paddleId:"pri_nourish", badge:"Most Popular", features:["50 searches / month","Personalised responses","Foods, recipes & tips","40% cheaper per search"] },
  { name:"Thrive",   price:"$29", per:"per month", searches:"Unlimited",        rate:"No limits ever", desc:"For those who live by food-first wellness.",    cta:"Start Thriving", highlight:false, paddleId:"pri_thrive",  features:["Unlimited searches","Personalised responses","Foods, recipes & tips","Best value for daily use"] },
];

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────

const buildPrompt = (user, isFollowUp) => {
  const allergy = user?.allergies?.length
    ? `CRITICAL: User is allergic to ${user.allergies.join(", ")}. NEVER include these or derivatives.`
    : "Note common allergens where relevant.";
  const history = user?.history?.length
    ? `Prior concerns: ${user.history.slice(-4).map(h=>h.query).join("; ")}.`
    : "";
  const sexNote = user?.sex
    ? `User is ${user.sex === "male" ? "male" : "female"}. Tailor food, hormone, and nutrient recommendations accordingly — for females: iron, oestrogen support, cycle nutrition; for males: testosterone support, muscle recovery, zinc and magnesium focus.`
    : "";

  if (!isFollowUp) {
    return `You are a warm, expert nutritionist drawing from Ayurveda, TCM, Mediterranean, African herbalism, adaptogens, medicinal mushrooms and modern science.
${allergy}
${history}
${sexNote}

Respond with ONLY a valid JSON object. No markdown. No text outside JSON. No trailing commas. Double quotes only. No newlines inside string values.

Exact shape:
{"responseType":"initial","acknowledgment":"string","foods":[{"name":"string","emoji":"string","benefit":"string"}],"recipes":[{"name":"string","emoji":"string","ingredients":["string"],"steps":["string"]}],"tip":"string"}

Rules:
- responseType: always "initial"
- acknowledgment: 2-3 warm sentences referencing exact words used
- foods: 4-6 items, global superfoods and herbs, go beyond obvious
- recipes: exactly 2, under 10 mins, max 3 steps each
- tip: one hyper-specific actionable tip for their exact situation
- ${allergy}`;
  } else {
    return `You are a warm, expert nutritionist continuing a wellness conversation. The user is refining or following up on their original concern.
${allergy}
${sexNote}

Respond with ONLY a valid JSON object. No markdown. No text outside JSON. No trailing commas. Double quotes only. No newlines inside string values.

Analyze what the follow-up is asking and respond with the most relevant shape:

If they want MORE foods/alternatives: {"responseType":"foods","acknowledgment":"string","foods":[{"name":"string","emoji":"string","benefit":"string"}],"tip":"string"}
If they want recipe help: {"responseType":"recipe","acknowledgment":"string","recipes":[{"name":"string","emoji":"string","ingredients":["string"],"steps":["string"]}],"tip":"string"}
If they want lifestyle/habit advice: {"responseType":"insight","acknowledgment":"string","insight":"string","bullets":["string"],"tip":"string"}
If they want a comparison or specific question answered: {"responseType":"answer","acknowledgment":"string","answer":"string","tip":"string"}
If unclear, default to foods shape.

Rules:
- responseType: one of "foods","recipe","insight","answer"
- acknowledgment: 1-2 sentences, warm, referencing their exact follow-up words
- insight: 2-3 paragraphs of expert explanation (for insight type)
- bullets: 3-5 actionable points (for insight type)
- answer: direct thorough answer to their specific question (for answer type)
- tip: always include, hyper-specific to their follow-up
- ${allergy}
- Use full conversation context`;
  }
};

const buildWeekPlanPrompt = (user, concern) => {
  const allergy = user?.allergies?.length
    ? `CRITICAL: User is allergic to ${user.allergies.join(", ")}. NEVER include these or derivatives.`
    : "";
  return `You are a nutritionist creating a 7-day preventive meal plan.

User concern: "${concern}"
${allergy}

Respond with ONLY a valid JSON array of exactly 7 objects. No markdown. No text outside JSON. No trailing commas.

Exact shape:
[{"day":"Monday","focus":"word","breakfast":"meal","lunch":"meal","dinner":"meal","snack":"snack"},{"day":"Tuesday","focus":"word","breakfast":"meal","lunch":"meal","dinner":"meal","snack":"snack"},{"day":"Wednesday","focus":"word","breakfast":"meal","lunch":"meal","dinner":"meal","snack":"snack"},{"day":"Thursday","focus":"word","breakfast":"meal","lunch":"meal","dinner":"meal","snack":"snack"},{"day":"Friday","focus":"word","breakfast":"meal","lunch":"meal","dinner":"meal","snack":"snack"},{"day":"Saturday","focus":"word","breakfast":"meal","lunch":"meal","dinner":"meal","snack":"snack"},{"day":"Sunday","focus":"word","breakfast":"meal","lunch":"meal","dinner":"meal","snack":"snack"}]

Rules:
- focus: one evocative word theme per day
- Each meal: concise, specific, addresses the concern
- No newlines inside strings
- ${allergy}`;
};

// ─── STORAGE ──────────────────────────────────────────────────────────────────

const getUser   = () => { try { return JSON.parse(localStorage.getItem("np_user")||"null"); } catch { return null; } };
const saveUser  = (u) => localStorage.setItem("np_user", JSON.stringify(u));
const clearUser = () => localStorage.removeItem("np_user");

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
  .chip:hover    {background:rgba(80,180,100,.18)!important;color:#c8f0d4!important;}
  .food-card:hover{transform:translateY(-3px);}
  .rc:hover      {border-color:rgba(34,163,90,.4)!important;}
  .tier-card     {transition:transform .25s,box-shadow .25s;}
  .tier-card:hover{transform:translateY(-6px);box-shadow:0 16px 48px rgba(0,0,0,.3);}
  .cta-btn       {position:relative;overflow:hidden;transition:transform .15s,box-shadow .15s;}
  .cta-btn:hover {transform:scale(1.02);}
  .cta-btn:active{transform:scale(.98);}
  .day-card      {transition:all .18s;cursor:pointer;}
  .day-card:hover{background:rgba(34,163,90,.14)!important;transform:translateY(-2px);}
  .msg-in        {animation:slideUp .28s ease forwards;}
  .modal-wrap    {animation:fadeIn .2s ease;}
  .modal-box     {animation:slideUp .25s ease;}
  .search-ring:focus-within{border-color:rgba(80,180,100,.6)!important;box-shadow:0 0 0 3px rgba(34,163,90,.12)!important;}
  /* ── Responsive ── */
  @media(max-width:480px){
    .np-week-grid { grid-template-columns:repeat(4,1fr)!important; }
    .np-food-grid { grid-template-columns:repeat(2,1fr)!important; }
    .np-tier-grid { grid-template-columns:1fr!important; }
    .np-modal-pad { padding:22px 16px!important; }
  }
  @media(min-width:481px) and (max-width:680px){
    .np-week-grid { grid-template-columns:repeat(4,1fr)!important; }
    .np-food-grid { grid-template-columns:repeat(3,1fr)!important; }
    .np-tier-grid { grid-template-columns:1fr!important; }
  }
  @media(min-width:681px){
    .np-week-grid { grid-template-columns:repeat(7,1fr)!important; }
    .np-food-grid { grid-template-columns:repeat(auto-fill,minmax(140px,1fr))!important; }
  }
`;

// ─── SAFE JSON PARSER ─────────────────────────────────────────────────────────

function safeParseJSON(raw, expectArray=false) {
  let s = raw.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/i,"").trim();
  if (expectArray) {
    const a = s.indexOf("["), b = s.lastIndexOf("]");
    if (a !== -1 && b !== -1) s = s.slice(a, b+1);
  } else {
    const a = s.indexOf("{"), b = s.lastIndexOf("}");
    if (a !== -1 && b !== -1) s = s.slice(a, b+1);
  }
  if (!s) throw new Error("No JSON found in response.");
  try { return JSON.parse(s); } catch(_) {}
  s = s.replace(/,\s*([}\]])/g, "$1");
  try { return JSON.parse(s); } catch(_) {}
  // last resort: replace unescaped newlines inside strings
  s = s.replace(/("(?:[^"\\]|\\.)*")|(\n)/g, (m,str,nl) => str ? str : " ");
  return JSON.parse(s);
}

// ─── MODAL WRAPPER ────────────────────────────────────────────────────────────

function Modal({ onClose, children, maxWidth=420 }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="modal-wrap" onClick={onClose}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}
        className="np-modal-pad" style={{background:"#111e13",border:"1px solid rgba(34,163,90,.3)",borderRadius:22,padding:"32px 28px",maxWidth,width:"100%"}}>
        {children}
      </div>
    </div>
  );
}

// ─── AUTH MODAL ───────────────────────────────────────────────────────────────

function AuthModal({ onClose, onAuth, defaultMode="login" }) {
  const [mode, setMode]         = useState(defaultMode);
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [pass, setPass]         = useState("");
  const [allergies, setAllergies] = useState([]);
  const [err, setErr]           = useState("");
  const emailRef = useRef(null);
  useEffect(() => { emailRef.current?.focus(); }, []);

  const toggle = (a) => setAllergies(p => p.includes(a) ? p.filter(x=>x!==a) : [...p,a]);

  const submit = () => {
    setErr("");
    if (!email.trim() || !pass.trim()) return setErr("Email and password required.");
    if (mode==="signup" && !name.trim()) return setErr("Name required.");
    const accounts = JSON.parse(localStorage.getItem("np_accounts")||"{}");
    if (mode==="signup") {
      if (accounts[email]) return setErr("Account exists. Please sign in.");
      const u = { name:name.trim(), email, allergies, history:[], credits:3, createdAt:Date.now() };
      accounts[email] = { ...u, pass };
      localStorage.setItem("np_accounts", JSON.stringify(accounts));
      saveUser(u);
      // send welcome email (fire and forget — don't block auth on failure)
      fetch("/.netlify/functions/welcome", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ name: name.trim(), email }),
      }).catch(()=>{});
      onAuth(u);
    } else {
      const a = accounts[email];
      if (!a) return setErr("No account found. Sign up first.");
      if (a.pass !== pass) return setErr("Incorrect password.");
      const u = { name:a.name, email, allergies:a.allergies||[], history:a.history||[], credits:a.credits??3, sex:a.sex||"" };
      saveUser(u); onAuth(u);
    }
  };

  const inp = {background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.12)",borderRadius:10,padding:"11px 14px",color:"#c8e8ce",outline:"none",fontSize:".9rem",width:"100%"};
  return (
    <Modal onClose={onClose}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <span style={{color:"#a8ddb5",fontSize:"1.05rem"}}>{mode==="login"?"Welcome back 🌿":"Join Nature's Pantry 🌱"}</span>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#3a6644",cursor:"pointer",fontSize:"1.1rem",lineHeight:1}}>✕</button>
      </div>
      {err && <div style={{color:"#f09090",fontSize:".78rem",marginBottom:12,padding:"9px 13px",background:"rgba(200,60,60,.1)",borderRadius:9,border:"1px solid rgba(200,60,60,.2)"}}>{err}</div>}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {mode==="signup" && <input ref={null} value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" style={inp}/>}
        <input ref={emailRef} value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" type="email" style={inp}/>
        <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Password" type="password"
          onKeyDown={e=>e.key==="Enter"&&submit()} style={inp}/>
        {mode==="signup" && (
          <div>
            <div style={{color:"#4a7a56",fontSize:".78rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>Food allergies</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {ALLERGIES.map(a=>(
                <button key={a} onClick={()=>toggle(a)}
                  style={{background:allergies.includes(a)?"rgba(34,163,90,.22)":"rgba(255,255,255,.04)",border:`1px solid ${allergies.includes(a)?"rgba(34,163,90,.55)":"rgba(255,255,255,.1)"}`,borderRadius:20,padding:"4px 11px",color:allergies.includes(a)?"#5ed880":"#4a7a56",fontSize:".84rem",cursor:"pointer",transition:"all .14s"}}>
                  {a}
                </button>
              ))}
            </div>
            <div style={{color:"#2a4a30",fontSize:".78rem",marginTop:6,fontStyle:"italic"}}>Editable anytime in your profile.</div>
          </div>
        )}
        <button onClick={submit} className="cta-btn"
          style={{background:"linear-gradient(135deg,#22a35a,#1a7a44)",border:"none",borderRadius:11,padding:"13px",color:"#e8f5eb",fontSize:".9rem",cursor:"pointer",fontWeight:600,marginTop:2}}>
          {mode==="login"?"Sign In →":"Create Free Account →"}
        </button>
        <button onClick={()=>{setMode(m=>m==="login"?"signup":"login");setErr("");}}
          style={{background:"none",border:"none",color:"#3a6644",fontSize:".88rem",cursor:"pointer",textAlign:"center",paddingTop:2}}>
          {mode==="login"?"No account? Sign up free — get 3 credits":"Already have an account? Sign in"}
        </button>
      </div>
    </Modal>
  );
}

// ─── PROFILE MODAL ────────────────────────────────────────────────────────────

function ProfileModal({ user, onClose, onUpdate, onLogout }) {
  const [allergies, setAllergies] = useState(user.allergies||[]);
  const [sex, setSex]             = useState(user.sex||"");
  const toggle = (a) => setAllergies(p=>p.includes(a)?p.filter(x=>x!==a):[...p,a]);
  const save = () => {
    const u = {...user, allergies, sex};
    saveUser(u);
    const acc = JSON.parse(localStorage.getItem("np_accounts")||"{}");
    if (acc[user.email]) { acc[user.email]={...acc[user.email], allergies, sex}; localStorage.setItem("np_accounts",JSON.stringify(acc)); }
    onUpdate(u);
  };

  const SEX_OPTIONS = [
    { value:"female", label:"Female", icon:"♀️" },
    { value:"male",   label:"Male",   icon:"♂️" },
  ];

  return (
    <Modal onClose={onClose}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <span style={{color:"#a8ddb5",fontSize:"1.05rem"}}>👤 {user.name}</span>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#3a6644",cursor:"pointer",fontSize:"1.1rem"}}>✕</button>
      </div>
      <div style={{color:"#2e5535",fontSize:".85rem",marginBottom:20}}>{user.email} · {user.history?.length||0} total searches · <span style={{color:(user.credits??0)<=1?"#f09090":(user.credits??0)<=2?"#ffc85a":"#5ed880"}}>{user.credits??0} credits</span></div>

      {/* Sex selector */}
      <div style={{marginBottom:20}}>
        <div style={{color:"#4a7a56",fontSize:".78rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:10}}>Biological sex <span style={{color:"#2a4a30",fontStyle:"italic",letterSpacing:0,textTransform:"none",fontSize:".74rem"}}>(personalises your results)</span></div>
        <div style={{display:"flex",gap:8}}>
          {SEX_OPTIONS.map(opt=>{
            const active = sex === opt.value;
            return (
              <button key={opt.value} onClick={()=>setSex(active?"":opt.value)}
                style={{flex:1,background:active?"rgba(34,163,90,.18)":"rgba(255,255,255,.04)",border:`1.5px solid ${active?"rgba(34,163,90,.55)":"rgba(255,255,255,.1)"}`,borderRadius:14,padding:"12px 8px",cursor:"pointer",transition:"all .16s",display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                <span style={{fontSize:20}}>{opt.icon}</span>
                <span style={{color:active?"#5ed880":"#4a7a56",fontSize:".84rem",fontFamily:"'Georgia',serif"}}>{opt.label}</span>
              </button>
            );
          })}
        </div>
        {!sex && <div style={{color:"#1e3d25",fontSize:".74rem",marginTop:7,fontStyle:"italic"}}>Optional — helps tailor hormone, iron & nutrient advice.</div>}
        {sex && <div style={{color:"#3a6644",fontSize:".74rem",marginTop:7,fontStyle:"italic"}}>✓ Results will be personalised for {sex === "female" ? "female" : "male"} biology.</div>}
      </div>

      {/* Allergies */}
      <div style={{marginBottom:20}}>
        <div style={{color:"#4a7a56",fontSize:".78rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>Food allergies</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {ALLERGIES.map(a=>(
            <button key={a} onClick={()=>toggle(a)}
              style={{background:allergies.includes(a)?"rgba(34,163,90,.22)":"rgba(255,255,255,.04)",border:`1px solid ${allergies.includes(a)?"rgba(34,163,90,.55)":"rgba(255,255,255,.1)"}`,borderRadius:20,padding:"4px 11px",color:allergies.includes(a)?"#5ed880":"#4a7a56",fontSize:".84rem",cursor:"pointer",transition:"all .14s"}}>
              {a}
            </button>
          ))}
        </div>
      </div>

      <div style={{display:"flex",gap:9}}>
        <button onClick={save} className="cta-btn" style={{flex:1,background:"linear-gradient(135deg,#22a35a,#1a7a44)",border:"none",borderRadius:10,padding:"11px",color:"#e8f5eb",fontSize:".85rem",cursor:"pointer",fontWeight:600}}>Save</button>
        <button onClick={()=>{clearUser();onLogout();}} style={{background:"rgba(220,80,80,.08)",border:"1px solid rgba(220,80,80,.22)",borderRadius:10,padding:"11px 16px",color:"#f09090",fontSize:".85rem",cursor:"pointer"}}>Sign out</button>
      </div>
    </Modal>
  );
}

// ─── NO CREDITS MODAL ─────────────────────────────────────────────────────────

function NoCreditsModal({ onClose, onViewPlans }) {
  return (
    <Modal onClose={onClose} maxWidth={360}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:38,marginBottom:12}}>🌿</div>
        <div style={{color:"#c8a96e",fontSize:"1rem",marginBottom:8}}>Out of credits</div>
        <div style={{color:"#5a4a2a",fontSize:".92rem",lineHeight:1.7,marginBottom:20}}>
          Top up to keep exploring nature's wisdom.<br/>
          <span style={{color:"#7a6030",fontSize:".73rem"}}>1 credit per search</span>
        </div>
        <button onClick={onViewPlans} className="cta-btn"
          style={{width:"100%",background:"linear-gradient(135deg,#c8a96e,#a07840)",border:"none",borderRadius:11,padding:"12px",color:"#1a1208",fontSize:".9rem",cursor:"pointer",fontWeight:700,marginBottom:8}}>
          View plans →
        </button>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#5a4a2a",fontSize:".78rem",cursor:"pointer"}}>Maybe later</button>
      </div>
    </Modal>
  );
}

// ─── SIGN UP PROMPT ───────────────────────────────────────────────────────────

function SignUpPrompt({ onClose, onSignUp }) {
  return (
    <Modal onClose={onClose} maxWidth={360}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:42,marginBottom:12,display:"inline-block",animation:"float 3s ease-in-out infinite"}}>🌿</div>
        <div style={{color:"#a8ddb5",fontSize:"1rem",marginBottom:8}}>You've used your 3 free searches</div>
        <div style={{color:"#3a6644",fontSize:".92rem",lineHeight:1.7,marginBottom:16}}>Sign up free to keep going. No card needed.</div>
        <div style={{display:"flex",justifyContent:"center",gap:20,marginBottom:20,padding:"12px 16px",background:"rgba(34,163,90,.06)",border:"1px solid rgba(34,163,90,.15)",borderRadius:12}}>
          {[["3","Free searches"],["1","Credit per search"],["Free","To join"]].map(([val,lbl],i)=>(
            <div key={i} style={{textAlign:"center"}}>
              <div style={{color:"#4ec97a",fontSize:"1.1rem",fontWeight:600}}>{val}</div>
              <div style={{color:"#2e5535",fontSize:".74rem",letterSpacing:".06em",textTransform:"uppercase"}}>{lbl}</div>
            </div>
          ))}
        </div>
        <button onClick={onSignUp} className="cta-btn"
          style={{width:"100%",background:"linear-gradient(135deg,#22a35a,#1a7a44)",border:"none",borderRadius:11,padding:"13px",color:"#e8f5eb",fontSize:".9rem",cursor:"pointer",fontWeight:600,marginBottom:8,boxShadow:"0 4px 20px rgba(34,163,90,.25)"}}>
          Create free account →
        </button>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#2e5535",fontSize:".74rem",cursor:"pointer"}}>Maybe later</button>
      </div>
    </Modal>
  );
}

// ─── WEEK PLAN ────────────────────────────────────────────────────────────────

function WeekPlan({ plan }) {
  const [active, setActive] = useState(null);
  if (!Array.isArray(plan) || plan.length === 0) return null;
  return (
    <div style={{marginTop:24}}>
      <div style={{color:"#4a9960",fontSize:".78rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:5}}>🗓️ 7-day preventive food plan</div>
      <div style={{color:"#2a4030",fontSize:".8rem",marginBottom:14,fontStyle:"italic"}}>Tap any day to expand</div>
      <div className="np-week-grid" style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:5}}>
        {plan.map((d,i)=>(
          <div key={i} className="day-card" onClick={()=>setActive(active===i?null:i)}
            style={{background:active===i?"rgba(34,163,90,.16)":"rgba(34,163,90,.06)",border:`1px solid ${active===i?"rgba(34,163,90,.42)":"rgba(34,163,90,.14)"}`,borderRadius:10,padding:"9px 5px",textAlign:"center"}}>
            <div style={{color:"#4a9960",fontSize:".76rem",letterSpacing:".06em",textTransform:"uppercase",marginBottom:3}}>{d.day?.slice(0,3)||"Day"}</div>
            <div style={{color:"#a8ddb5",fontSize:".72rem",lineHeight:1.3,fontStyle:"italic"}}>{d.focus||""}</div>
          </div>
        ))}
      </div>
      {active!==null && plan[active] && (
        <div style={{background:"rgba(34,163,90,.05)",border:"1px solid rgba(34,163,90,.16)",borderRadius:12,padding:"16px",marginTop:8,animation:"fadeUp .22s ease"}}>
          <div style={{color:"#4ec97a",fontSize:".85rem",fontWeight:600,marginBottom:12}}>{plan[active].day} — <em style={{color:"#4a9960",fontWeight:400}}>{plan[active].focus}</em></div>
          {[["🌅 Breakfast",plan[active].breakfast],["☀️ Lunch",plan[active].lunch],["🌙 Dinner",plan[active].dinner],["🍎 Snack",plan[active].snack]].map(([lbl,val],j)=>(
            <div key={j} style={{display:"flex",gap:11,marginBottom:9,alignItems:"flex-start"}}>
              <span style={{minWidth:96,color:"#2e5535",fontSize:".82rem",flexShrink:0,paddingTop:1}}>{lbl}</span>
              <span style={{color:"#8dc89e",fontSize:".88rem",lineHeight:1.55}}>{val||"—"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SHARED SUB-COMPONENTS ────────────────────────────────────────────────────

function AckBubble({ text, label="A note for you" }) {
  return (
    <div style={{background:"linear-gradient(135deg,rgba(34,163,90,.1),rgba(20,80,40,.07))",border:"1px solid rgba(34,163,90,.22)",borderRadius:16,padding:"18px 20px",marginBottom:14,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:12,right:14,fontSize:20,opacity:.08}}>🌿</div>
      <div style={{color:"#4a9960",fontSize:".78rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:6}}>{label}</div>
      <p style={{color:"#b8e8c4",fontSize:"clamp(1rem,1.6vw,1.12rem)",lineHeight:1.8,margin:0,fontStyle:"italic"}}>{text}</p>
    </div>
  );
}

function TipRow({ tip }) {
  if (!tip) return null;
  return (
    <div style={{background:"linear-gradient(135deg,rgba(34,163,90,.08),rgba(20,100,55,.04))",border:"1px solid rgba(34,163,90,.18)",borderRadius:12,padding:"12px 16px",display:"flex",gap:10,alignItems:"flex-start",marginBottom:14}}>
      <span style={{fontSize:15,marginTop:1,flexShrink:0}}>💡</span>
      <span style={{color:"#a8d8b4",fontSize:"clamp(.95rem,1.5vw,1.06rem)",lineHeight:1.62}}>{tip}</span>
    </div>
  );
}

function FoodGrid({ foods }) {
  if (!foods?.length) return null;
  return (
    <div style={{marginBottom:14}}>
      <div style={{color:"#4a9960",fontSize:".78rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:10}}>🌱 Foods that help</div>
      <div className="np-food-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:7}}>
        {foods.map((f,i)=>(
          <div key={i} className="food-card" style={{background:"rgba(34,163,90,.07)",border:"1px solid rgba(34,163,90,.16)",borderRadius:14,padding:"clamp(13px,1.5vw,18px) clamp(9px,1.2vw,14px)",textAlign:"center",transition:"transform .18s"}}>
            <div style={{fontSize:"clamp(26px,2.8vw,34px)",marginBottom:5}}>{f.emoji||"🌿"}</div>
            <div style={{color:"#b8e8c4",fontSize:"clamp(.88rem,1.3vw,1rem)",fontWeight:600,marginBottom:3}}>{f.name}</div>
            <div style={{color:"#4a7a56",fontSize:"clamp(.75rem,1.1vw,.85rem)",lineHeight:1.4}}>{f.benefit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecipeList({ recipes, activeRecipe, setActiveRecipe, msgIdx }) {
  if (!recipes?.length) return null;
  return (
    <div style={{marginBottom:14}}>
      <div style={{color:"#4a9960",fontSize:".78rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:10}}>🍳 Quick recipes</div>
      {recipes.map((r,i)=>{
        const rid = `${msgIdx}-${i}`;
        const open = activeRecipe === rid;
        return (
          <div key={i} className="rc" style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(34,163,90,.16)",borderRadius:12,overflow:"hidden",marginBottom:7,transition:"border-color .18s"}}>
            <button onClick={()=>setActiveRecipe(open?null:rid)}
              style={{width:"100%",textAlign:"left",background:"transparent",border:"none",padding:"12px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{color:"#c8e8ce",fontSize:"clamp(.95rem,1.5vw,1.08rem)"}}>{r.emoji||"🍽️"} {r.name}</span>
              <span style={{color:"#3a6644",fontSize:".78rem",transform:open?"rotate(180deg)":"rotate(0deg)",transition:"transform .2s",display:"inline-block"}}>▼</span>
            </button>
            {open && (
              <div style={{padding:"0 16px 14px",borderTop:"1px solid rgba(34,163,90,.1)"}}>
                <div style={{marginTop:10,marginBottom:9}}>
                  <div style={{color:"#3a6644",fontSize:".72rem",letterSpacing:".08em",textTransform:"uppercase",marginBottom:6}}>Ingredients</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                    {(r.ingredients||[]).map((g,j)=><span key={j} style={{background:"rgba(34,163,90,.09)",border:"1px solid rgba(34,163,90,.18)",borderRadius:20,padding:"3px 9px",color:"#8dc89e",fontSize:".82rem"}}>{g}</span>)}
                  </div>
                </div>
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

// ─── RESULT CARD — adapts to responseType ────────────────────────────────────

function ResultCard({ result, isLast, onGetMore, activeRecipe, setActiveRecipe, msgIdx }) {
  if (!result) return null;
  const type = result.responseType || "initial";

  // ── INITIAL: full rich card ──
  if (type === "initial") {
    return (
      <div style={{animation:"slideUp .3s ease"}}>
        <AckBubble text={result.acknowledgment} />
        <FoodGrid foods={result.foods} />
        <RecipeList recipes={result.recipes} activeRecipe={activeRecipe} setActiveRecipe={setActiveRecipe} msgIdx={msgIdx} />
        <TipRow tip={result.tip} />
        {isLast && <WeekPlan plan={result.weekPlan}/>}
        {isLast && <div style={{textAlign:"right",marginTop:6}}><button onClick={onGetMore} style={{background:"none",border:"none",color:"#3a6644",fontSize:".8rem",cursor:"pointer",fontStyle:"italic"}}>Get more searches →</button></div>}
      </div>
    );
  }

  // ── FOODS follow-up: compact grid with fresh ack ──
  if (type === "foods") {
    return (
      <div style={{animation:"slideUp .3s ease"}}>
        <AckBubble text={result.acknowledgment} label="More for you" />
        <FoodGrid foods={result.foods} />
        <TipRow tip={result.tip} />
        {isLast && <div style={{textAlign:"right",marginTop:6}}><button onClick={onGetMore} style={{background:"none",border:"none",color:"#3a6644",fontSize:".8rem",cursor:"pointer",fontStyle:"italic"}}>Get more searches →</button></div>}
      </div>
    );
  }

  // ── RECIPE follow-up: just recipes ──
  if (type === "recipe") {
    return (
      <div style={{animation:"slideUp .3s ease"}}>
        <AckBubble text={result.acknowledgment} label="Here's how to make it" />
        <RecipeList recipes={result.recipes} activeRecipe={activeRecipe} setActiveRecipe={setActiveRecipe} msgIdx={msgIdx} />
        <TipRow tip={result.tip} />
        {isLast && <div style={{textAlign:"right",marginTop:6}}><button onClick={onGetMore} style={{background:"none",border:"none",color:"#3a6644",fontSize:".8rem",cursor:"pointer",fontStyle:"italic"}}>Get more searches →</button></div>}
      </div>
    );
  }

  // ── INSIGHT follow-up: prose + bullet points ──
  if (type === "insight") {
    return (
      <div style={{animation:"slideUp .3s ease"}}>
        <AckBubble text={result.acknowledgment} label="Here's the deeper picture" />
        {result.insight && (
          <div style={{background:"rgba(255,255,255,.025)",border:"1px solid rgba(34,163,90,.14)",borderRadius:14,padding:"18px 20px",marginBottom:14}}>
            <p style={{color:"#9ecfae",fontSize:"clamp(.97rem,1.5vw,1.08rem)",lineHeight:1.85,margin:0}}>{result.insight}</p>
          </div>
        )}
        {result.bullets?.length > 0 && (
          <div style={{marginBottom:14}}>
            {result.bullets.map((b,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:10,padding:"10px 14px",background:"rgba(34,163,90,.05)",borderRadius:10,border:"1px solid rgba(34,163,90,.12)"}}>
                <span style={{color:"#22a35a",fontWeight:700,fontSize:".85rem",marginTop:1,flexShrink:0}}>→</span>
                <span style={{color:"#8dc89e",fontSize:"clamp(.93rem,1.4vw,1.04rem)",lineHeight:1.6}}>{b}</span>
              </div>
            ))}
          </div>
        )}
        <TipRow tip={result.tip} />
        {isLast && <div style={{textAlign:"right",marginTop:6}}><button onClick={onGetMore} style={{background:"none",border:"none",color:"#3a6644",fontSize:".8rem",cursor:"pointer",fontStyle:"italic"}}>Get more searches →</button></div>}
      </div>
    );
  }

  // ── ANSWER follow-up: direct prose answer ──
  if (type === "answer") {
    return (
      <div style={{animation:"slideUp .3s ease"}}>
        <AckBubble text={result.acknowledgment} label="To answer your question" />
        {result.answer && (
          <div style={{background:"rgba(255,255,255,.025)",border:"1px solid rgba(34,163,90,.14)",borderRadius:14,padding:"18px 20px",marginBottom:14}}>
            <p style={{color:"#9ecfae",fontSize:"clamp(.97rem,1.5vw,1.08rem)",lineHeight:1.85,margin:0}}>{result.answer}</p>
          </div>
        )}
        <TipRow tip={result.tip} />
        {isLast && <div style={{textAlign:"right",marginTop:6}}><button onClick={onGetMore} style={{background:"none",border:"none",color:"#3a6644",fontSize:".8rem",cursor:"pointer",fontStyle:"italic"}}>Get more searches →</button></div>}
      </div>
    );
  }

  // ── FALLBACK: treat like foods ──
  return (
    <div style={{animation:"slideUp .3s ease"}}>
      <AckBubble text={result.acknowledgment} label="Following up" />
      <FoodGrid foods={result.foods} />
      <RecipeList recipes={result.recipes} activeRecipe={activeRecipe} setActiveRecipe={setActiveRecipe} msgIdx={msgIdx} />
      <TipRow tip={result.tip} />
      {isLast && <div style={{textAlign:"right",marginTop:6}}><button onClick={onGetMore} style={{background:"none",border:"none",color:"#3a6644",fontSize:".8rem",cursor:"pointer",fontStyle:"italic"}}>Get more searches →</button></div>}
    </div>
  );
}

// ─── PRICING PAGE ─────────────────────────────────────────────────────────────

function PricingPage({ onBack }) {
  const sub = (t) => alert(`Paddle: open checkout for ${t.name} with priceId "${t.paddleId}"`);
  return (
    <div style={{minHeight:"100vh",background:"#0b1a0d",color:"#e0ede2",fontFamily:"'Georgia',serif"}}>
      <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}>
        <div style={{position:"absolute",top:"-15%",left:"-10%",width:550,height:550,borderRadius:"50%",background:"radial-gradient(circle,rgba(34,163,90,.07) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",bottom:"-15%",right:"-10%",width:480,height:480,borderRadius:"50%",background:"radial-gradient(circle,rgba(20,100,55,.09) 0%,transparent 70%)"}}/>
      </div>
      <div style={{position:"relative",zIndex:1,maxWidth:1060,margin:"0 auto",padding:"0 22px 90px"}}>
        <div style={{padding:"24px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={onBack} style={{background:"none",border:"none",color:"#4a7a56",fontSize:".82rem",cursor:"pointer"}}>← Back</button>
          <span style={{color:"#4a7a56",fontSize:".82rem",display:"flex",alignItems:"center",gap:6}}><span style={{animation:"float 4s ease-in-out infinite",display:"inline-block"}}>🌿</span> Nature's Pantry</span>
        </div>
        <div style={{textAlign:"center",padding:"52px 0 60px",animation:"fadeUp .6s ease"}}>
          <div style={{display:"inline-block",background:"rgba(34,163,90,.1)",border:"1px solid rgba(34,163,90,.22)",borderRadius:40,padding:"5px 17px",fontSize:".7rem",letterSpacing:".18em",textTransform:"uppercase",color:"#4ec97a",marginBottom:22}}>Simple, honest pricing</div>
          <h1 style={{fontSize:"clamp(2.2rem,5.5vw,3.6rem)",fontWeight:400,color:"#c8ecd4",lineHeight:1.15,letterSpacing:"-.02em",marginBottom:14}}>Food is your medicine.<br/><em style={{color:"#4ec97a"}}>Start for $5.</em></h1>
          <p style={{color:"#3a6644",fontSize:"clamp(.88rem,2vw,.98rem)",maxWidth:440,margin:"0 auto",lineHeight:1.8}}>The more you commit, the less per search. No hidden fees, no feature walls.</p>
        </div>
        <div className="np-tier-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))",gap:18,animation:"fadeUp .6s ease .1s both"}}>
          {TIERS.map((t,i)=>(
            <div key={t.name} className="tier-card"
              style={{position:"relative",background:t.highlight?"linear-gradient(155deg,rgba(34,163,90,.13),rgba(15,55,28,.18))":"rgba(255,255,255,.03)",border:t.highlight?"1px solid rgba(34,163,90,.38)":"1px solid rgba(255,255,255,.07)",borderRadius:22,padding:"34px 28px",display:"flex",flexDirection:"column",animation:`fadeUp .5s ease ${.1+i*.09}s both`}}>
              {t.badge && <div style={{position:"absolute",top:-13,left:"50%",transform:"translateX(-50%)",background:"linear-gradient(135deg,#22a35a,#1a7a44)",borderRadius:40,padding:"4px 16px",fontSize:".76rem",letterSpacing:".11em",textTransform:"uppercase",color:"#e8f5eb",fontWeight:600,whiteSpace:"nowrap",animation:"pulseRing 2.5s ease infinite"}}>✦ {t.badge}</div>}
              <div style={{fontSize:".78rem",letterSpacing:".14em",textTransform:"uppercase",color:t.highlight?"#4ec97a":"#2e5535",marginBottom:16}}>{t.name}</div>
              <div style={{marginBottom:4}}><span style={{fontSize:"clamp(2.6rem,5vw,3.2rem)",fontWeight:400,color:"#c8ecd4",letterSpacing:"-.03em",lineHeight:1}}>{t.price}</span><span style={{color:"#2e5535",fontSize:".78rem",marginLeft:5}}>{t.per}</span></div>
              <div style={{color:"#a8ddb5",fontSize:".92rem",marginBottom:4}}>{t.searches}</div>
              <div style={{display:"inline-block",background:"rgba(34,163,90,.07)",border:"1px solid rgba(34,163,90,.14)",borderRadius:20,padding:"3px 12px",fontSize:".8rem",color:"#3a6644",marginBottom:20,alignSelf:"flex-start"}}>{t.rate}</div>
              <p style={{color:"#2e5535",fontSize:".9rem",lineHeight:1.7,marginBottom:22,fontStyle:"italic"}}>{t.desc}</p>
              <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:28,flex:1}}>
                {t.features.map((f,j)=>(
                  <div key={j} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                    <span style={{color:"#22a35a",fontSize:".82rem",marginTop:1,flexShrink:0}}>✓</span>
                    <span style={{color:"#5a8a6a",fontSize:".9rem",lineHeight:1.55}}>{f}</span>
                  </div>
                ))}
              </div>
              <button className="cta-btn" onClick={()=>sub(t)}
                style={{background:t.highlight?"linear-gradient(135deg,#22a35a,#1a7a44)":"rgba(255,255,255,.05)",border:t.highlight?"none":"1px solid rgba(80,180,100,.22)",borderRadius:12,padding:"13px 20px",color:t.highlight?"#e8f5eb":"#6aaa80",fontSize:".86rem",cursor:"pointer",fontWeight:t.highlight?600:400,width:"100%",boxShadow:t.highlight?"0 4px 20px rgba(34,163,90,.22)":"none"}}>
                {t.cta} →
              </button>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",marginTop:42,display:"flex",justifyContent:"center",gap:24,flexWrap:"wrap"}}>
          {["🔒 Secure via Paddle","↩️ Cancel anytime","🌿 AI + nature"].map((s,i)=><span key={i} style={{color:"#1e3d25",fontSize:".86rem"}}>{s}</span>)}
        </div>
        <div style={{maxWidth:580,margin:"64px auto 0"}}>
          <h2 style={{textAlign:"center",fontSize:"1.45rem",fontWeight:400,color:"#a8ddb5",marginBottom:32}}>Questions</h2>
          {[
            ["What counts as one search?","Every search — initial or follow-up — costs 1 credit."],
            ["Do credits roll over?","Starter credits never expire. Monthly plan credits reset on your billing date."],
            ["Can I switch plans?","Yes — upgrade or downgrade any time. Changes apply from your next billing date."],
            ["How do I cancel?","One click in your account settings. No calls, no forms, no guilt."],
          ].map(([q,a],i)=>(
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

// ─── SEARCH BAR ───────────────────────────────────────────────────────────────

function SearchBar({ value, onChange, onSubmit, loading, hasConvo, placeholder }) {
  return (
    <div className="search-ring"
      style={{background:"rgba(255,255,255,.055)",border:"1.5px solid rgba(80,180,100,.28)",borderRadius:28,padding:"clamp(6px,1vw,10px) clamp(6px,1vw,10px) clamp(6px,1vw,10px) clamp(18px,2vw,26px)",display:"flex",alignItems:"center",gap:10,transition:"border-color .2s, box-shadow .2s",boxShadow:"0 2px 24px rgba(34,163,90,.07)"}}>
      <span style={{fontSize:16,opacity:.4,flexShrink:0}}>🔍</span>
      <input value={value} onChange={e=>onChange(e.target.value)}
        onKeyDown={e=>e.key==="Enter"&&!loading&&onSubmit(value)}
        placeholder={placeholder||"Describe how you're feeling..."}
        className="np-search-input" style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#c8e8ce",fontSize:"clamp(1rem,1.7vw,1.15rem)",padding:"clamp(12px,1.5vw,17px) 0",caretColor:"#4ec97a",minWidth:0}}/>
      <button onClick={()=>onSubmit(value)} disabled={!value.trim()||loading}
        className="np-search-btn" style={{background:value.trim()&&!loading?"linear-gradient(135deg,#22a35a,#1a7a44)":"rgba(34,163,90,.13)",border:"none",borderRadius:"clamp(14px,1.5vw,20px)",padding:"clamp(10px,1.2vw,15px) clamp(18px,2.5vw,32px)",color:"#e8f5eb",fontSize:"clamp(.96rem,1.5vw,1.1rem)",cursor:value.trim()&&!loading?"pointer":"default",fontWeight:600,whiteSpace:"nowrap",transition:"background .18s",flexShrink:0}}>
        {loading ? <span style={{display:"inline-block",animation:"spin 1s linear infinite"}}>🌿</span> : <><span className="np-search-btn-text">{hasConvo?"Ask →":"Search"}</span><span className="np-search-btn-icon" style={{display:"none"}}>→</span></>}
      </button>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage]         = useState("home");
  const [user, setUser]         = useState(getUser);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [showProfile, setShowProfile] = useState(false);
  const [showNoCredits, setShowNoCredits] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [guestSearches, setGuestSearches] = useState(()=>{
    try{return parseInt(localStorage.getItem("np_guest_searches")||"0");}catch{return 0;}
  });
  // always read fresh from localStorage — never trust stale closure
  const getGuestCount = () => { try{return parseInt(localStorage.getItem("np_guest_searches")||"0");}catch{return 0;} };

  const [messages, setMessages]   = useState([]);  // [{role,content,result?}]
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [activeRecipe, setActiveRecipe] = useState(null);

  const bottomRef = useRef(null);
  const userRef   = useRef(user);
  const hasConvo  = messages.length > 0;

  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages,loading]);

  // auth helpers
  const handleAuth = (u) => {
    setUser(u); userRef.current = u;
    setShowAuth(false); setShowSignUp(false);
    localStorage.removeItem("np_guest_searches"); setGuestSearches(0);
  };
  const handleLogout = () => { setUser(null); userRef.current = null; setMessages([]); setShowProfile(false); };

  // atomic update via ref — always reads fresh user even after async fetch
  const recordSuccess = (isFollowUp, q) => {
    const cu = userRef.current;
    if (!cu) return;
    const cost = 1;  // 1 credit per search (initial or follow-up)
    const updated = {
      ...cu,
      credits: Math.max(0, parseFloat(((cu.credits ?? 0) - cost).toFixed(1))),
      history: [...(cu.history || []), { query: q, date: Date.now() }].slice(-50),
    };
    saveUser(updated);
    setUser(updated);
    userRef.current = updated;
    const acc = JSON.parse(localStorage.getItem("np_accounts") || "{}");
    if (acc[cu.email]) {
      acc[cu.email] = { ...acc[cu.email], credits: updated.credits, history: updated.history };
      localStorage.setItem("np_accounts", JSON.stringify(acc));
    }
  };

  // ── fetch week plan in background after main result ──
  const fetchWeekPlan = async (concern, existingResult) => {
    try {
      const cu = userRef.current;
      const res = await fetch("/.netlify/functions/chat", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens: 1800,
          system: buildWeekPlanPrompt(cu, concern),
          messages:[{role:"user", content:`Create a 7-day meal plan for someone with this concern: ${concern}`}],
        }),
      });
      if (!res.ok) return;
      const data = JSON.parse(await res.text());
      const raw  = (data.content||[]).map(b=>b.text||"").join("").trim();
      const plan = safeParseJSON(raw, true);
      if (!Array.isArray(plan) || plan.length === 0) return;
      // inject weekPlan into last assistant message
      setMessages(p => {
        const updated = [...p];
        for (let i = updated.length-1; i >= 0; i--) {
          if (updated[i].role === "assistant" && updated[i].result) {
            updated[i] = {...updated[i], result:{...updated[i].result, weekPlan: plan}};
            break;
          }
        }
        return updated;
      });
    } catch(_) { /* week plan is optional — silently skip on error */ }
  };

  // ── main query ──
  const handleQuery = async (query) => {
    const q = query.trim(); if (!q || loading) return;
    // isFollowUp = there is already at least one completed assistant response
    const isFollowUp = messages.some(m => m.role === "assistant");
    const cost = 1;  // 1 credit per search (initial or follow-up)

    // gate: guest — always read fresh from localStorage
    if (!user) {
      const currentCount = getGuestCount();
      if (currentCount >= 3) { setShowSignUp(true); return; }
      const n = currentCount + 1;
      localStorage.setItem("np_guest_searches", String(n));
      setGuestSearches(n);
    }
    // gate: credits
    if (user && (user.credits??0) < cost) { setShowNoCredits(true); return; }

    // build lean history for context (user msgs only + last assistant result summary)
    const apiMessages = [];
    messages.forEach(m => {
      if (m.role === "user") {
        apiMessages.push({ role:"user", content: m.content });
      } else if (m.result) {
        // send only acknowledgment as assistant context to avoid bloating
        apiMessages.push({ role:"assistant", content: m.result.acknowledgment || "" });
      }
    });
    apiMessages.push({ role:"user", content: q });

    setMessages(p=>[...p,{role:"user",content:q}]);
    setInput(""); setError(null); setLoading(true);

    try {
      // ── Step 1: main response (fast, small JSON) ──
      const res = await fetch("/.netlify/functions/chat", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens: 1200,
          system: buildPrompt(userRef.current, isFollowUp),
          messages: apiMessages,
        }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(`Server error ${res.status}: ${text.slice(0,180)}`);

      const data = JSON.parse(text);
      const raw  = (data.content||[]).map(b=>b.text||"").join("").trim();
      if (!raw) throw new Error("Empty response from AI.");

      const result = safeParseJSON(raw, false);
      if (!result.acknowledgment) throw new Error("Unexpected response shape.");

      setMessages(p=>[...p,{role:"assistant",content:result.acknowledgment,result}]);
      recordSuccess(isFollowUp, q);  // atomic: deduct credit + save history

      // ── Step 2: fetch 7-day plan separately in background ──
      fetchWeekPlan(q, result);
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setMessages([]); setError(null); setInput(""); };

  if (page==="pricing") return (<><style>{CSS}</style><PricingPage onBack={()=>setPage("home")}/></>);

  return (
    <div style={{minHeight:"100vh",background:"#0b1a0d",color:"#e0ede2"}}>
      <style>{CSS}</style>

      {/* Modals */}
      {showAuth     && <AuthModal onClose={()=>setShowAuth(false)} onAuth={handleAuth} defaultMode={authMode}/>}
      {showProfile  && user && <ProfileModal user={user} onClose={()=>setShowProfile(false)} onUpdate={u=>{setUser(u);setShowProfile(false);}} onLogout={handleLogout}/>}
      {showNoCredits && <NoCreditsModal onClose={()=>setShowNoCredits(false)} onViewPlans={()=>{setShowNoCredits(false);setPage("pricing");}}/>}
      {showSignUp   && <SignUpPrompt onClose={()=>setShowSignUp(false)} onSignUp={()=>{setShowSignUp(false);setAuthMode("signup");setShowAuth(true);}}/>}

      {/* Ambient background */}
      <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse 110% 55% at 50% 0%,#152e18 0%,#0b1a0d 65%)",zIndex:0,pointerEvents:"none"}}/>

      <div style={{position:"relative",zIndex:1,maxWidth:1100,margin:"0 auto",padding:"0 0 80px",overflowX:"hidden"}}>

        {/* ── NAV ── */}
        <nav className="np-nav" style={{padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(80,180,100,.07)"}}>
          <button onClick={reset} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:7}}>
            <span style={{fontSize:19,display:"inline-block",animation:hasConvo?"none":"float 4s ease-in-out infinite"}}>🌿</span>
            <span className="np-nav-name" style={{color:"#5a9a6a",fontSize:"clamp(.9rem,1.4vw,1.05rem)",letterSpacing:".05em"}}>Nature's Pantry</span>
          </button>
          <div style={{display:"flex",gap:7,alignItems:"center"}}>
            <button onClick={()=>setPage("pricing")} style={{background:"none",border:"1px solid rgba(80,180,100,.17)",borderRadius:20,padding:"clamp(6px,.7vw,9px) clamp(14px,1.6vw,22px)",color:"#2e5535",fontSize:"clamp(.82rem,1.2vw,.95rem)",cursor:"pointer"}}>Pricing</button>
            {user
              ? <button onClick={()=>setShowProfile(true)}
                  style={{background:"rgba(34,163,90,.1)",border:"1px solid rgba(34,163,90,.24)",borderRadius:20,padding:"4px 12px",color:"#4ec97a",fontSize:".71rem",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                  <span>👤 {user.name.split(" ")[0]}</span>
                  <span style={{background:"rgba(34,163,90,.18)",borderRadius:10,padding:"1px 7px",color:(user.credits??0)<=1?"#f09090":(user.credits??0)<=2?"#ffc85a":"#4ec97a",fontSize:".76rem",fontWeight:600}}>{user.credits??0}cr</span>
                </button>
              : <button onClick={()=>{setAuthMode("login");setShowAuth(true);}}
                  style={{background:"linear-gradient(135deg,#22a35a,#1a7a44)",border:"none",borderRadius:20,padding:"5px 15px",color:"#e8f5eb",fontSize:".71rem",cursor:"pointer",fontWeight:600}}>Sign in</button>
            }
          </div>
        </nav>

        {/* ── HOME — centred hero + search ── */}
        {!hasConvo && (
          <div style={{animation:"fadeUp .45s ease"}}>
            {/* Hero */}
            <div className="np-hero-pad" style={{textAlign:"center",padding:"clamp(40px,6vw,80px) clamp(24px,8vw,120px) clamp(24px,3vw,40px)"}}>
              <div style={{fontSize:52,marginBottom:14,display:"inline-block",animation:"float 5s ease-in-out infinite"}}>🌿</div>
              <h1 className="home-title" style={{fontSize:"clamp(2.2rem,5vw,4.2rem)",fontWeight:400,color:"#a8ddb5",margin:"0 0 14px",letterSpacing:"-.02em"}}>How are you feeling today?</h1>
              <p className="home-sub" style={{color:"#3a6644",fontSize:"clamp(1rem,1.9vw,1.2rem)",fontStyle:"italic",margin:"0 0 8px"}}>Describe what you're going through</p>
              <p className="np-home-desc" style={{color:"#2a4a30",fontSize:"clamp(.88rem,1.5vw,1.02rem)",lineHeight:1.75,margin:"0 0 14px"}}>We'll suggest personalised foods, recipes, a wellness tip &amp; a 7-day plan</p>
              <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:8,marginTop:6,marginBottom:4}}>
                {user?.allergies?.length>0 && (
                  <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(200,70,70,.07)",border:"1px solid rgba(200,70,70,.17)",borderRadius:20,padding:"3px 12px"}}>
                    <span style={{color:"#8a5050",fontSize:".82rem"}}>🚫 Avoiding: {user.allergies.join(", ")}</span>
                  </div>
                )}
                {user?.sex && (
                  <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(34,163,90,.07)",border:"1px solid rgba(34,163,90,.18)",borderRadius:20,padding:"3px 12px"}}>
                    <span style={{color:"#4a7a56",fontSize:".82rem"}}>{user.sex==="female"?"♀️ Female profile":"♂️ Male profile"}</span>
                  </div>
                )}
                {user && !user.sex && (
                  <button onClick={()=>setShowProfile(true)} style={{background:"none",border:"1px dashed rgba(34,163,90,.25)",borderRadius:20,padding:"3px 12px",color:"#2a4a30",fontSize:".78rem",cursor:"pointer",fontFamily:"'Georgia',serif",fontStyle:"italic"}}>
                    + Add your sex for personalised results
                  </button>
                )}
              </div>
            </div>

            {/* ── CENTRED SEARCH BAR ── */}
            <div style={{padding:"0 clamp(20px,5vw,80px) 24px"}}>
              <SearchBar value={input} onChange={setInput} onSubmit={handleQuery} loading={loading} hasConvo={false}
                placeholder="e.g. I've been exhausted after lunch every day this week..."/>
            </div>

            {/* Disclaimer */}
            <div className="np-disclaimer" style={{margin:"0 clamp(20px,5vw,80px) 20px",background:"rgba(255,200,70,.04)",border:"1px solid rgba(255,200,70,.12)",borderRadius:12,padding:"10px 14px",display:"flex",gap:9,alignItems:"flex-start"}}>
              <span style={{fontSize:13,flexShrink:0,marginTop:1,opacity:.7}}>⚠️</span>
              <p style={{margin:0,color:"#6a5e2a",fontSize:"clamp(.8rem,1.2vw,.92rem)",lineHeight:1.65}}>
                <strong style={{color:"#8a7a30"}}>Disclaimer:</strong> Nature's Pantry provides general wellness suggestions only and cannot be held responsible for allergic reactions or adverse effects. Always consult a healthcare professional before making dietary changes.
              </p>
            </div>

            {/* Divider + chips */}
            <div style={{padding:"0 20px 10px",display:"flex",alignItems:"center",gap:11}}>
              <div style={{flex:1,height:1,background:"rgba(80,180,100,.09)"}}/>
              <span style={{color:"#1e3d25",fontSize:"clamp(.8rem,1.2vw,.92rem)",letterSpacing:".1em",whiteSpace:"nowrap"}}>or pick a symptom</span>
              <div style={{flex:1,height:1,background:"rgba(80,180,100,.09)"}}/>
            </div>
            <div className="np-chips-pad" style={{padding:"0 clamp(20px,4vw,60px) 16px",display:"flex",flexWrap:"wrap",gap:"clamp(8px,1vw,12px)",justifyContent:"center"}}>
              {SUGGESTIONS.map(s=>(
                <button key={s.label} className="chip" onClick={()=>handleQuery(s.query)}
                  className="np-chip" style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(80,180,100,.18)",borderRadius:40,padding:"clamp(7px,1vw,11px) clamp(14px,1.8vw,22px)",display:"flex",alignItems:"center",gap:7,color:"#6aaa80",fontSize:"clamp(.9rem,1.4vw,1.04rem)",cursor:"pointer",transition:"all .14s"}}>
                  <span style={{fontSize:13}}>{s.emoji}</span><span>{s.label}</span>
                </button>
              ))}
            </div>

            {/* Guest hint */}
            {!user && (
              <div style={{textAlign:"center",padding:"4px 0 8px"}}>
                <button onClick={()=>{setAuthMode("signup");setShowAuth(true);}}
                  style={{background:"none",border:"none",color:"#1e3d25",fontSize:".7rem",cursor:"pointer",fontStyle:"italic"}}>
                  {(()=>{const g=getGuestCount();return g===0?"✦ 3 free searches — no account needed":`✦ ${3-g} free search${(3-g)===1?"":"es"} remaining — sign up to save history`;})()}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── CHAT VIEW ── */}
        {hasConvo && (
          <div>
            {/* Messages */}
            <div className="np-chat-pad" style={{padding:"16px 20px 0"}}>
              {messages.map((msg,idx)=>(
                <div key={idx} style={{marginBottom:msg.role==="user"?8:24}}>
                  {msg.role==="user" && (
                    <div style={{display:"flex",justifyContent:"flex-end"}}>
                      <div style={{background:"rgba(34,163,90,.14)",border:"1px solid rgba(34,163,90,.22)",borderRadius:"18px 18px 4px 18px",padding:"10px 16px",maxWidth:"82%",color:"#c8e8ce",fontSize:".86rem",lineHeight:1.6}}>
                        {msg.content}
                      </div>
                    </div>
                  )}
                  {msg.role==="assistant" && (
                    <ResultCard
                      result={msg.result}
                      isLast={idx===messages.length-1}
                      onGetMore={()=>setPage("pricing")}
                      activeRecipe={activeRecipe}
                      setActiveRecipe={setActiveRecipe}
                      msgIdx={idx}
                    />
                  )}
                </div>
              ))}

              {/* Loading */}
              {loading && (
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",animation:"fadeIn .3s ease"}}>
                  <span style={{fontSize:18,display:"inline-block",animation:"spin 1.8s linear infinite"}}>🌿</span>
                  <span style={{color:"#3a6644",fontSize:".92rem",fontStyle:"italic",animation:"pulse 2s ease infinite"}}>Finding what nature made for you...</span>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{background:"rgba(200,60,60,.08)",border:"1px solid rgba(200,60,60,.18)",borderRadius:10,padding:"11px 15px",color:"#f09090",fontSize:".78rem",marginBottom:12,lineHeight:1.6}}>
                  ⚠️ {error}
                  <button onClick={()=>setError(null)} style={{background:"none",border:"none",color:"#f09090",cursor:"pointer",float:"right",fontSize:".78rem"}}>✕</button>
                </div>
              )}

              <div ref={bottomRef}/>
            </div>

            {/* Search bar pinned to bottom of conversation */}
            <div style={{padding:"10px clamp(16px,3vw,32px) clamp(16px,2vw,24px)",borderTop:"1px solid rgba(80,180,100,.07)",marginTop:4}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <button onClick={reset} style={{background:"none",border:"none",color:"#3a6644",fontSize:".82rem",cursor:"pointer"}}>← Start over</button>
                <span style={{color:"#1a3020",fontSize:".78rem"}}>
                  {(()=>{
                    if (user) return `${messages.filter(m=>m.role==="user").length} search${messages.filter(m=>m.role==="user").length!==1?"es":""} · ${user.credits??0} cr left`;
                    const g = getGuestCount();
                    if (g >= 3) return <span style={{color:"#f09090",fontWeight:500}}>No free searches left — <button onClick={()=>setShowSignUp(true)} style={{background:"none",border:"none",color:"#4ec97a",cursor:"pointer",fontFamily:"'Georgia',serif",fontSize:"inherit",padding:0,textDecoration:"underline"}}>sign up free</button></span>;
                    return `${3-g} free search${(3-g)===1?"":"es"} remaining`;
                  })()}
                </span>
              </div>
              <SearchBar value={input} onChange={setInput} onSubmit={handleQuery} loading={loading} hasConvo={true}
                placeholder="Ask a follow-up question..."/>
            </div>
          </div>
        )}

        {/* Footer */}
        {!hasConvo && (
          <div style={{textAlign:"center",padding:"24px 0 8px",color:"#142018",fontSize:".78rem",letterSpacing:".06em"}}>
            Nature's Pantry · Food-first wellness · Not medical advice
          </div>
        )}
      </div>
    </div>
  );
}
