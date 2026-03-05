import { useState, useEffect, useRef } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { label: "Low Energy",       emoji: "⚡", query: "I feel tired and low on energy all day" },
  { label: "Stress & Anxiety", emoji: "🌿", query: "I'm feeling really stressed and anxious" },
  { label: "Bloating",         emoji: "🌱", query: "I have bloating and digestive discomfort" },
  { label: "Immunity",         emoji: "🛡️", query: "I keep getting sick and want to boost my immunity" },
  { label: "Inflammation",     emoji: "🔥", query: "I have chronic inflammation and joint pain" },
  { label: "Poor Sleep",       emoji: "🌙", query: "I have trouble falling and staying asleep" },
  { label: "Brain Fog",        emoji: "🧠", query: "I have brain fog and can't focus" },
  { label: "Skin Glow",        emoji: "✨", query: "My skin looks dull and I want a natural glow" },
];

const COMMON_ALLERGIES = ["Gluten","Dairy","Nuts","Soy","Eggs","Shellfish","Fish","Sesame"];

const TIERS = [
  { name:"Starter", price:"$5", per:"one-time", searches:"10 searches", rate:"$0.50 per search", description:"Try it out. No commitment.", cta:"Get Started", highlight:false, paddleId:"pri_starter", features:["10 AI-powered food searches","Personalised responses","Foods, recipes & wellness tips","Never expires"] },
  { name:"Nourish", price:"$15", per:"per month", searches:"50 searches", rate:"$0.30 per search", description:"For the health-conscious who return weekly.", cta:"Start Nourishing", highlight:true, paddleId:"pri_nourish", badge:"Most Popular", features:["50 searches per month","Personalised responses","Foods, recipes & wellness tips","40% cheaper per search"] },
  { name:"Thrive", price:"$29", per:"per month", searches:"Unlimited searches", rate:"No limits, ever", description:"For those who live by food-first wellness.", cta:"Start Thriving", highlight:false, paddleId:"pri_thrive", features:["Unlimited searches per month","Personalised responses","Foods, recipes & wellness tips","Best value for daily use"] },
];

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────

const buildSystemPrompt = (user) => {
  const allergyNote = user?.allergies?.length
    ? `CRITICAL ALLERGY ALERT: This user is allergic to: ${user.allergies.join(", ")}. NEVER recommend these or anything containing them under any circumstances.`
    : "";
  const historyNote = user?.history?.length
    ? `User's previous wellness concerns: ${user.history.slice(-5).map(h=>h.query).join("; ")}.`
    : "";
  return `You are a warm, empathetic nutrition and wellness expert with deep knowledge spanning Ayurveda, Traditional Chinese Medicine, Mediterranean diet, African herbalism, South American healing plants, modern nutritional science, adaptogens, medicinal mushrooms, fermented foods, and wild plants. You go beyond obvious food choices and draw from the full breadth of nature's pharmacopeia.

${allergyNote}
${historyNote}

When someone describes how they feel, respond ONLY with a valid raw JSON object — no markdown, no backticks, no preamble, no explanation outside the JSON.

Use EXACTLY this structure:
{
  "acknowledgment": "Warm, personal 2-3 sentence response referencing their exact words. Empathetic and specific, never generic.",
  "foods": [{"name":"...","emoji":"...","benefit":"specific reason tied to their exact situation"}],
  "recipes": [{"name":"...","emoji":"...","ingredients":["..."],"steps":["..."]}],
  "tip": "One highly specific actionable tip for their exact situation.",
  "weekPlan": [
    {"day":"Monday","focus":"one-word theme","breakfast":"meal description","lunch":"meal description","dinner":"meal description","snack":"snack + benefit"},
    {"day":"Tuesday","focus":"...","breakfast":"...","lunch":"...","dinner":"...","snack":"..."},
    {"day":"Wednesday","focus":"...","breakfast":"...","lunch":"...","dinner":"...","snack":"..."},
    {"day":"Thursday","focus":"...","breakfast":"...","lunch":"...","dinner":"...","snack":"..."},
    {"day":"Friday","focus":"...","breakfast":"...","lunch":"...","dinner":"...","snack":"..."},
    {"day":"Saturday","focus":"...","breakfast":"...","lunch":"...","dinner":"...","snack":"..."},
    {"day":"Sunday","focus":"...","breakfast":"...","lunch":"...","dinner":"...","snack":"..."}
  ]
}

Rules:
- foods: 4-6 items, go beyond obvious — include herbs, roots, adaptogens, global superfoods
- recipes: 2-3, under 10 minutes, whole natural ingredients only
- tip: hyper-specific to what they described, not generic wellness advice
- weekPlan: all 7 days, each with a unique focus theme and meals that preventively address their concern
- ${allergyNote || "Avoid common allergens or clearly note them"}
- If this is a follow-up in a conversation, use full context from the conversation history`;
};

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────

const getUser   = () => { try { return JSON.parse(localStorage.getItem("np_user")||"null"); } catch { return null; } };
const saveUser  = (u) => localStorage.setItem("np_user", JSON.stringify(u));
const clearUser = () => localStorage.removeItem("np_user");

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────

const GLOBAL_STYLES = `
  @keyframes fadeUp    { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
  @keyframes spin      { from{transform:rotate(0deg);}to{transform:rotate(360deg);} }
  @keyframes pulse     { 0%,100%{opacity:.6;}50%{opacity:1;} }
  @keyframes float     { 0%,100%{transform:translateY(0);}50%{transform:translateY(-7px);} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-10px);}to{opacity:1;transform:translateY(0);} }
  @keyframes pulseRing { 0%{box-shadow:0 0 0 0 rgba(34,163,90,.35);}70%{box-shadow:0 0 0 10px rgba(34,163,90,0);}100%{box-shadow:0 0 0 0 rgba(34,163,90,0);} }
  *{box-sizing:border-box;} body{margin:0;}
  .chip:hover      {background:rgba(80,180,100,.15)!important;color:#b8e8c4!important;cursor:pointer;}
  .food-card:hover {transform:translateY(-3px);}
  .rc:hover        {border-color:rgba(34,163,90,.35)!important;}
  .tier-card       {transition:transform .3s ease;}
  .tier-card:hover {transform:translateY(-8px);}
  .cta-btn         {transition:all .2s ease;position:relative;overflow:hidden;}
  .cta-btn:hover   {transform:scale(1.03);}
  .cta-btn::after  {content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent);transform:translateX(-100%);transition:transform .5s ease;}
  .cta-btn:hover::after{transform:translateX(100%);}
  .msg-bubble      {animation:fadeUp .3s ease forwards;}
  .day-card        {transition:all .2s ease;cursor:pointer;}
  .day-card:hover  {background:rgba(34,163,90,.12)!important;transform:translateY(-2px);}
  input,textarea   {font-family:'Georgia',serif!important;}
  @media(min-width:768px){
    .home-title  {font-size:3rem!important;}
    .search-input{font-size:1.05rem!important;padding:16px 0!important;}
    .search-btn  {font-size:.95rem!important;padding:14px 28px!important;}
    .chip        {font-size:.9rem!important;padding:9px 18px!important;}
    .ack-text    {font-size:1rem!important;line-height:1.8!important;}
    .food-name   {font-size:.95rem!important;}
    .recipe-name {font-size:1rem!important;}
    .tip-text    {font-size:.97rem!important;}
  }
`;

// ─── AUTH MODAL ───────────────────────────────────────────────────────────────

function AuthModal({ onClose, onAuth }) {
  const [mode, setMode]           = useState("login");
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [allergies, setAllergies] = useState([]);
  const [error, setError]         = useState("");

  const toggleAllergy = (a) => setAllergies(p=>p.includes(a)?p.filter(x=>x!==a):[...p,a]);

  const handleSubmit = () => {
    if (!email||!password) return setError("Email and password required.");
    if (mode==="signup"&&!name) return setError("Name required.");
    if (mode==="signup") {
      const accounts = JSON.parse(localStorage.getItem("np_accounts")||"{}");
      if (accounts[email]) return setError("Account already exists. Please log in.");
      const user = { name, email, allergies, history:[], credits:3, createdAt:Date.now() };
      accounts[email] = { ...user, password };
      localStorage.setItem("np_accounts", JSON.stringify(accounts));
      saveUser(user); onAuth(user);
    } else {
      const accounts = JSON.parse(localStorage.getItem("np_accounts")||"{}");
      const account = accounts[email];
      if (!account) return setError("No account found. Please sign up.");
      if (account.password!==password) return setError("Incorrect password.");
      const user = { name:account.name, email, allergies:account.allergies||[], history:account.history||[], credits:account.credits??3 };
      saveUser(user); onAuth(user);
    }
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.78)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#111e13",border:"1px solid rgba(34,163,90,.28)",borderRadius:22,padding:"32px 28px",maxWidth:420,width:"100%",animation:"slideDown .3s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div style={{color:"#a8ddb5",fontSize:"1.05rem"}}>{mode==="login"?"Welcome back 🌿":"Create account 🌱"}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#3a6644",cursor:"pointer",fontSize:"1.1rem"}}>✕</button>
        </div>
        {error&&<div style={{color:"#e88a8a",fontSize:".78rem",marginBottom:14,padding:"10px 14px",background:"rgba(200,80,80,.08)",borderRadius:10}}>{error}</div>}
        <div style={{display:"flex",flexDirection:"column",gap:11}}>
          {mode==="signup"&&<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"11px 14px",color:"#c8e8ce",outline:"none",fontSize:".9rem"}}/>}
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" type="email" style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"11px 14px",color:"#c8e8ce",outline:"none",fontSize:".9rem"}}/>
          <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" onKeyDown={e=>e.key==="Enter"&&handleSubmit()} style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"11px 14px",color:"#c8e8ce",outline:"none",fontSize:".9rem"}}/>
          {mode==="signup"&&(
            <div>
              <div style={{color:"#4a7a56",fontSize:".7rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:9}}>Food allergies</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {COMMON_ALLERGIES.map(a=>(
                  <button key={a} onClick={()=>toggleAllergy(a)} style={{background:allergies.includes(a)?"rgba(34,163,90,.2)":"rgba(255,255,255,.04)",border:`1px solid ${allergies.includes(a)?"rgba(34,163,90,.5)":"rgba(255,255,255,.1)"}`,borderRadius:20,padding:"5px 12px",color:allergies.includes(a)?"#4ec97a":"#4a7a56",fontSize:".76rem",cursor:"pointer",fontFamily:"'Georgia',serif",transition:"all .15s"}}>{a}</button>
                ))}
              </div>
              <div style={{color:"#2e5535",fontSize:".68rem",marginTop:7,fontStyle:"italic"}}>You can update this anytime in your profile.</div>
            </div>
          )}
          <button onClick={handleSubmit} className="cta-btn" style={{background:"linear-gradient(135deg,#22a35a,#1a7a44)",border:"none",borderRadius:12,padding:"13px",color:"#e8f5eb",fontSize:".9rem",cursor:"pointer",fontFamily:"'Georgia',serif",fontWeight:600,marginTop:4}}>
            {mode==="login"?"Sign In":"Create Account"}
          </button>
          <button onClick={()=>{setMode(m=>m==="login"?"signup":"login");setError("");}} style={{background:"none",border:"none",color:"#3a6644",fontSize:".78rem",cursor:"pointer",fontFamily:"'Georgia',serif"}}>
            {mode==="login"?"No account? Sign up free":"Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE MODAL ────────────────────────────────────────────────────────────

function ProfileModal({ user, onClose, onUpdate, onLogout }) {
  const [allergies, setAllergies] = useState(user.allergies||[]);
  const toggle = (a) => setAllergies(p=>p.includes(a)?p.filter(x=>x!==a):[...p,a]);
  const handleSave = () => {
    const updated = {...user,allergies};
    saveUser(updated);
    const accounts = JSON.parse(localStorage.getItem("np_accounts")||"{}");
    if (accounts[user.email]) { accounts[user.email]={...accounts[user.email],allergies}; localStorage.setItem("np_accounts",JSON.stringify(accounts)); }
    onUpdate(updated);
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.78)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#111e13",border:"1px solid rgba(34,163,90,.28)",borderRadius:22,padding:"32px 28px",maxWidth:420,width:"100%",animation:"slideDown .3s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <div style={{color:"#a8ddb5",fontSize:"1.05rem"}}>👤 {user.name}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#3a6644",cursor:"pointer",fontSize:"1.1rem"}}>✕</button>
        </div>
        <div style={{color:"#3a6644",fontSize:".78rem",marginBottom:22}}>{user.email} · {user.history?.length||0} searches total</div>
        <div style={{marginBottom:20}}>
          <div style={{color:"#4a7a56",fontSize:".7rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:9}}>My food allergies</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
            {COMMON_ALLERGIES.map(a=>(
              <button key={a} onClick={()=>toggle(a)} style={{background:allergies.includes(a)?"rgba(34,163,90,.2)":"rgba(255,255,255,.04)",border:`1px solid ${allergies.includes(a)?"rgba(34,163,90,.5)":"rgba(255,255,255,.1)"}`,borderRadius:20,padding:"5px 12px",color:allergies.includes(a)?"#4ec97a":"#4a7a56",fontSize:".76rem",cursor:"pointer",fontFamily:"'Georgia',serif",transition:"all .15s"}}>{a}</button>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={handleSave} className="cta-btn" style={{flex:1,background:"linear-gradient(135deg,#22a35a,#1a7a44)",border:"none",borderRadius:11,padding:"11px",color:"#e8f5eb",fontSize:".85rem",cursor:"pointer",fontFamily:"'Georgia',serif",fontWeight:600}}>Save</button>
          <button onClick={()=>{clearUser();onLogout();}} style={{background:"rgba(200,80,80,.08)",border:"1px solid rgba(200,80,80,.2)",borderRadius:11,padding:"11px 18px",color:"#e88a8a",fontSize:".85rem",cursor:"pointer",fontFamily:"'Georgia',serif"}}>Sign out</button>
        </div>
      </div>
    </div>
  );
}

// ─── WEEK PLAN ────────────────────────────────────────────────────────────────

function WeekPlan({ plan }) {
  const [activeDay, setActiveDay] = useState(null);
  if (!plan?.length) return null;
  return (
    <div style={{marginTop:28,marginBottom:8}}>
      <div style={{color:"#4a9960",fontSize:".68rem",letterSpacing:".14em",textTransform:"uppercase",marginBottom:6}}>🗓️ Your 7-day preventive food plan</div>
      <div style={{color:"#2e5535",fontSize:".72rem",marginBottom:14,fontStyle:"italic"}}>Tap a day to see full meals</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}}>
        {plan.map((d,i)=>(
          <div key={i} className="day-card" onClick={()=>setActiveDay(activeDay===i?null:i)}
            style={{background:activeDay===i?"rgba(34,163,90,.15)":"rgba(34,163,90,.06)",border:`1px solid ${activeDay===i?"rgba(34,163,90,.4)":"rgba(34,163,90,.15)"}`,borderRadius:12,padding:"10px 6px",textAlign:"center"}}>
            <div style={{color:"#4a9960",fontSize:".58rem",letterSpacing:".08em",textTransform:"uppercase",marginBottom:4}}>{d.day?.slice(0,3)}</div>
            <div style={{color:"#a8ddb5",fontSize:".62rem",lineHeight:1.3,fontStyle:"italic"}}>{d.focus}</div>
          </div>
        ))}
      </div>
      {activeDay!==null&&plan[activeDay]&&(
        <div style={{background:"rgba(34,163,90,.06)",border:"1px solid rgba(34,163,90,.18)",borderRadius:14,padding:"18px",marginTop:10,animation:"fadeUp .25s ease"}}>
          <div style={{color:"#4ec97a",fontSize:".76rem",fontWeight:600,marginBottom:14}}>{plan[activeDay].day} — <em style={{color:"#4a9960",fontWeight:400}}>{plan[activeDay].focus}</em></div>
          {[["🌅 Breakfast",plan[activeDay].breakfast],["☀️ Lunch",plan[activeDay].lunch],["🌙 Dinner",plan[activeDay].dinner],["🍎 Snack",plan[activeDay].snack]].map(([label,val],j)=>(
            <div key={j} style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:10}}>
              <span style={{fontSize:".75rem",minWidth:82,color:"#3a6644",flexShrink:0}}>{label}</span>
              <span style={{color:"#8dc89e",fontSize:".82rem",lineHeight:1.5}}>{val}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PRICING PAGE ─────────────────────────────────────────────────────────────

function PricingPage({ onBack }) {
  const handleSubscribe = (tier) => {
    alert(`Connect Paddle: open checkout for ${tier.name} using priceId "${tier.paddleId}"`);
  };
  return (
    <div style={{minHeight:"100vh",background:"#0b1a0d",fontFamily:"'Georgia',serif",color:"#e0ede2"}}>
      <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-20%",left:"-10%",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(34,163,90,.08) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",bottom:"-20%",right:"-10%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(20,100,55,.1) 0%,transparent 70%)"}}/>
      </div>
      <div style={{position:"relative",zIndex:1,maxWidth:1100,margin:"0 auto",padding:"0 24px 100px"}}>
        <div style={{padding:"28px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={onBack} style={{background:"none",border:"none",color:"#4a7a56",fontSize:".82rem",cursor:"pointer",fontFamily:"'Georgia',serif"}}>← Back</button>
          <div style={{display:"flex",alignItems:"center",gap:8,color:"#6aaa80",fontSize:".85rem"}}>
            <span style={{fontSize:18,animation:"float 4s ease-in-out infinite"}}>🌿</span> Nature's Pantry
          </div>
        </div>
        <div style={{textAlign:"center",padding:"56px 0 64px",animation:"fadeUp .6s ease forwards"}}>
          <div style={{display:"inline-block",background:"rgba(34,163,90,.1)",border:"1px solid rgba(34,163,90,.25)",borderRadius:40,padding:"6px 18px",fontSize:".72rem",letterSpacing:".18em",textTransform:"uppercase",color:"#4ec97a",marginBottom:24}}>Simple, honest pricing</div>
          <h1 style={{fontSize:"clamp(2.4rem,6vw,3.8rem)",fontWeight:400,color:"#c8ecd4",lineHeight:1.15,letterSpacing:"-.02em",marginBottom:16}}>Food is your medicine.<br/><em style={{color:"#4ec97a"}}>Start for $5.</em></h1>
          <p style={{color:"#4a7a56",fontSize:"clamp(.9rem,2vw,1rem)",maxWidth:480,margin:"0 auto",lineHeight:1.75}}>The more you commit, the less you pay per search. No hidden fees.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20,animation:"fadeUp .7s ease .1s both"}}>
          {TIERS.map((tier,i)=>(
            <div key={tier.name} className="tier-card"
              style={{position:"relative",background:tier.highlight?"linear-gradient(160deg,rgba(34,163,90,.14) 0%,rgba(15,60,30,.2) 100%)":"rgba(255,255,255,.03)",border:tier.highlight?"1px solid rgba(34,163,90,.4)":"1px solid rgba(255,255,255,.07)",borderRadius:24,padding:"36px 30px",display:"flex",flexDirection:"column",animation:`fadeUp .6s ease ${.1+i*.1}s both`}}>
              {tier.badge&&<div style={{position:"absolute",top:-14,left:"50%",transform:"translateX(-50%)",background:"linear-gradient(135deg,#22a35a,#1a7a44)",borderRadius:40,padding:"5px 18px",fontSize:".66rem",letterSpacing:".14em",textTransform:"uppercase",color:"#e8f5eb",fontWeight:600,whiteSpace:"nowrap",animation:"pulseRing 2.5s ease infinite"}}>✦ {tier.badge}</div>}
              <div style={{fontSize:".68rem",letterSpacing:".18em",textTransform:"uppercase",color:tier.highlight?"#4ec97a":"#3a6644",marginBottom:18}}>{tier.name}</div>
              <div style={{marginBottom:4}}><span style={{fontSize:"clamp(2.6rem,5vw,3.4rem)",fontWeight:400,color:"#c8ecd4",letterSpacing:"-.03em",lineHeight:1}}>{tier.price}</span><span style={{color:"#3a6644",fontSize:".8rem",marginLeft:6}}>{tier.per}</span></div>
              <div style={{marginBottom:4}}><span style={{color:"#a8ddb5",fontSize:".95rem"}}>{tier.searches}</span></div>
              <div style={{display:"inline-block",background:"rgba(34,163,90,.08)",border:"1px solid rgba(34,163,90,.15)",borderRadius:20,padding:"3px 11px",fontSize:".7rem",color:"#4a9960",marginBottom:22,alignSelf:"flex-start"}}>{tier.rate}</div>
              <p style={{color:"#3a6644",fontSize:".83rem",lineHeight:1.65,marginBottom:24,fontStyle:"italic"}}>{tier.description}</p>
              <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:32,flex:1}}>
                {tier.features.map((f,j)=><div key={j} style={{display:"flex",gap:9}}><span style={{color:"#22a35a",flexShrink:0,fontSize:".85rem"}}>✓</span><span style={{color:"#6aaa80",fontSize:".83rem",lineHeight:1.5}}>{f}</span></div>)}
              </div>
              <button className="cta-btn" onClick={()=>handleSubscribe(tier)}
                style={{background:tier.highlight?"linear-gradient(135deg,#22a35a,#1a7a44)":"rgba(255,255,255,.05)",border:tier.highlight?"none":"1px solid rgba(80,180,100,.25)",borderRadius:13,padding:"14px 22px",color:tier.highlight?"#e8f5eb":"#7dc891",fontSize:".88rem",cursor:"pointer",fontFamily:"'Georgia',serif",fontWeight:tier.highlight?600:400,width:"100%"}}>
                {tier.cta} →
              </button>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",marginTop:44}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:28,flexWrap:"wrap"}}>
            {["🔒 Secure checkout via Paddle","↩️ Cancel anytime","🌿 Powered by AI & nature"].map((item,i)=><span key={i} style={{color:"#2e5535",fontSize:".76rem"}}>{item}</span>)}
          </div>
        </div>
        <div style={{marginTop:72,maxWidth:600,margin:"72px auto 0"}}>
          <h2 style={{textAlign:"center",fontSize:"1.5rem",fontWeight:400,color:"#a8ddb5",marginBottom:36}}>Questions</h2>
          {[
            {q:"What counts as one search?",a:"Typing anything and hitting Search = 1 credit used."},
            {q:"Do unused credits roll over?",a:"Starter credits never expire. Monthly credits reset each billing cycle."},
            {q:"Can I switch plans?",a:"Yes, upgrade or downgrade anytime. Changes apply on your next billing date."},
            {q:"How do I cancel?",a:"One click in your account settings. No calls, no guilt."},
          ].map((item,i)=>(
            <div key={i} style={{borderBottom:"1px solid rgba(80,180,100,.1)",padding:"20px 0"}}>
              <div style={{color:"#a8ddb5",fontSize:".9rem",marginBottom:7}}>{item.q}</div>
              <div style={{color:"#3a6644",fontSize:".83rem",lineHeight:1.7}}>{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage]               = useState("home");
  const [user, setUser]               = useState(getUser);
  const [showAuth, setShowAuth]       = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [showNoCredits, setShowNoCredits] = useState(false);
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);
  const [guestSearches, setGuestSearches] = useState(() => {
    try { return parseInt(localStorage.getItem("np_guest_searches")||"0"); } catch { return 0; }
  });
  const bottomRef = useRef(null);

  // Deduct credits: 1 for first search, 0.5 for follow-ups
  const deductCredit = (isFollowUp) => {
    if (!user) return;
    const cost = isFollowUp ? 0.5 : 1;
    const updated = { ...user, credits: Math.max(0, parseFloat(((user.credits ?? 0) - cost).toFixed(1))) };
    saveUser(updated); setUser(updated);
    const accounts = JSON.parse(localStorage.getItem('np_accounts')||'{}');
    if (accounts[user.email]) {
      accounts[user.email] = { ...accounts[user.email], credits: updated.credits };
      localStorage.setItem('np_accounts', JSON.stringify(accounts));
    }
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages, loading]);

  const handleAuth = (u) => {
    setUser(u);
    setShowAuth(false);
    setShowSignUpPrompt(false);
    setGuestSearches(0);
    localStorage.removeItem("np_guest_searches");
  };
  const handleLogout = () => { setUser(null); setMessages([]); setShowProfile(false); };

  const updateHistory = (query) => {
    if (!user) return;
    const updated = {...user, history:[...(user.history||[]),{query,date:Date.now()}].slice(-50)};
    saveUser(updated); setUser(updated);
    const accounts = JSON.parse(localStorage.getItem("np_accounts")||"{}");
    if (accounts[user.email]) { accounts[user.email]={...accounts[user.email],history:updated.history}; localStorage.setItem("np_accounts",JSON.stringify(accounts)); }
  };

  const handleQuery = async (query) => {
    const q = query.trim(); if (!q) return;
    const isFollowUp = messages.length > 0;
    const cost = isFollowUp ? 0.5 : 1;
    // Guest logic: allow 1 free search, then force sign up
    if (!user) {
      if (guestSearches >= 1) { setShowSignUpPrompt(true); return; }
      const newCount = guestSearches + 1;
      setGuestSearches(newCount);
      localStorage.setItem("np_guest_searches", String(newCount));
    }
    if (user && (user.credits ?? 0) < cost) { setShowNoCredits(true); return; }
    const userMsg = {role:"user",content:q};
    const history = [...messages, userMsg].map(m=>({role:m.role, content:m.role==="user"?m.content:JSON.stringify(m.result||m.content)}));
    setMessages(p=>[...p,userMsg]);
    setInput(""); setLoading(true); setError(null);

    try {
      const res = await fetch("/.netlify/functions/chat", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,system:buildSystemPrompt(user),messages:history}),
      });
      const bodyText = await res.text();
      if (!res.ok) throw new Error("HTTP "+res.status+": "+bodyText.substring(0,200));
      const data = JSON.parse(bodyText);
      const rawText = (data.content||[]).map(b=>b.text||"").join("").trim();
      if (!rawText) throw new Error("Empty response.");
      const cleaned = rawText.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/i,"").trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Could not parse response.");
      const result = JSON.parse(match[0]);
      setMessages(p=>[...p,{role:"assistant",content:result.acknowledgment,result}]);
      deductCredit(isFollowUp);
      updateHistory(q);
    } catch(e) {
      setError(e.message);
      // Keep user message visible so conversation stays on screen
    }
    setLoading(false);
  };

  const reset = () => { setMessages([]); setError(null); setInput(""); };

  if (page==="pricing") return <><style>{GLOBAL_STYLES}</style><PricingPage onBack={()=>setPage("home")}/></>;

  const hasConvo = messages.length > 0;

  return (
    <div style={{minHeight:"100vh",background:"#0b1a0d",fontFamily:"'Georgia',serif",color:"#e0ede2"}}>
      <style>{GLOBAL_STYLES}</style>

      {showAuth && <AuthModal onClose={()=>setShowAuth(false)} onAuth={handleAuth}/>}
      {showProfile && user && <ProfileModal user={user} onClose={()=>setShowProfile(false)} onUpdate={u=>{setUser(u);setShowProfile(false);}} onLogout={handleLogout}/>}

      {showNoCredits && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.78)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#1a1208",border:"1px solid rgba(200,169,110,.25)",borderRadius:22,padding:"32px 28px",maxWidth:380,width:"100%",textAlign:"center",animation:"slideDown .3s ease"}}>
            <div style={{fontSize:40,marginBottom:14}}>🌿</div>
            <div style={{color:"#c8a96e",fontSize:"1rem",marginBottom:8}}>You're out of credits</div>
            <div style={{color:"#5a4a2a",fontSize:".82rem",lineHeight:1.7,marginBottom:24}}>
              Top up to keep exploring nature's remedies.<br/>
              <span style={{color:"#7a6030",fontSize:".75rem"}}>First search costs 1 credit · Follow-ups cost 0.5 credits</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <button onClick={()=>{setShowNoCredits(false);setPage("pricing");}}
                style={{background:"linear-gradient(135deg,#c8a96e,#a07840)",border:"none",borderRadius:13,padding:"13px",color:"#1a1208",fontSize:".9rem",cursor:"pointer",fontFamily:"'Georgia',serif",fontWeight:700}}>
                View plans →
              </button>
              <button onClick={()=>setShowNoCredits(false)}
                style={{background:"none",border:"1px solid rgba(200,169,110,.2)",borderRadius:13,padding:"11px",color:"#7a6030",fontSize:".82rem",cursor:"pointer",fontFamily:"'Georgia',serif"}}>
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {showSignUpPrompt && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.82)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#0f1e11",border:"1px solid rgba(34,163,90,.3)",borderRadius:22,padding:"36px 28px",maxWidth:380,width:"100%",textAlign:"center",animation:"slideDown .3s ease"}}>
            <div style={{fontSize:44,marginBottom:14,animation:"float 3s ease-in-out infinite"}}>🌿</div>
            <div style={{color:"#a8ddb5",fontSize:"1.05rem",marginBottom:8,fontWeight:400}}>You've used your free search</div>
            <div style={{color:"#3a6644",fontSize:".84rem",lineHeight:1.75,marginBottom:6}}>
              Create a free account to keep exploring nature's remedies.
            </div>
            <div style={{display:"inline-flex",alignItems:"center",gap:16,marginBottom:24,padding:"10px 20px",background:"rgba(34,163,90,.07)",border:"1px solid rgba(34,163,90,.15)",borderRadius:14}}>
              <div style={{textAlign:"center"}}>
                <div style={{color:"#4ec97a",fontSize:"1.1rem",fontWeight:600}}>3</div>
                <div style={{color:"#2e5535",fontSize:".65rem",letterSpacing:".08em",textTransform:"uppercase"}}>Free credits</div>
              </div>
              <div style={{width:1,height:28,background:"rgba(34,163,90,.2)"}}/>
              <div style={{textAlign:"center"}}>
                <div style={{color:"#4ec97a",fontSize:"1.1rem",fontWeight:600}}>0.5</div>
                <div style={{color:"#2e5535",fontSize:".65rem",letterSpacing:".08em",textTransform:"uppercase"}}>per follow-up</div>
              </div>
              <div style={{width:1,height:28,background:"rgba(34,163,90,.2)"}}/>
              <div style={{textAlign:"center"}}>
                <div style={{color:"#4ec97a",fontSize:"1.1rem",fontWeight:600}}>Free</div>
                <div style={{color:"#2e5535",fontSize:".65rem",letterSpacing:".08em",textTransform:"uppercase"}}>to sign up</div>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <button onClick={()=>{setShowSignUpPrompt(false);setShowAuth(true);}}
                style={{background:"linear-gradient(135deg,#22a35a,#1a7a44)",border:"none",borderRadius:13,padding:"14px",color:"#e8f5eb",fontSize:".92rem",cursor:"pointer",fontFamily:"'Georgia',serif",fontWeight:600,boxShadow:"0 4px 20px rgba(34,163,90,.25)"}}>
                Create free account →
              </button>
              <button onClick={()=>{setShowSignUpPrompt(false);setShowAuth(true);}}
                style={{background:"none",border:"1px solid rgba(80,180,100,.2)",borderRadius:13,padding:"12px",color:"#4a7a56",fontSize:".84rem",cursor:"pointer",fontFamily:"'Georgia',serif"}}>
                Already have an account? Sign in
              </button>
              <button onClick={()=>setShowSignUpPrompt(false)}
                style={{background:"none",border:"none",color:"#2e5535",fontSize:".74rem",cursor:"pointer",fontFamily:"'Georgia',serif",marginTop:2}}>
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse 100% 50% at 50% 0%,#152e18 0%,#0b1a0d 60%)",zIndex:0,pointerEvents:"none"}}/>

      <div style={{position:"relative",zIndex:1,maxWidth:740,margin:"0 auto",padding:"0 0 60px"}}>

        {/* NAV */}
        <div style={{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(80,180,100,.07)"}}>
          <button onClick={reset} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontFamily:"'Georgia',serif"}}>
            <span style={{fontSize:20}}>🌿</span>
            <span style={{color:"#6aaa80",fontSize:".82rem",letterSpacing:".04em"}}>Nature's Pantry</span>
          </button>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={()=>setPage("pricing")} style={{background:"none",border:"1px solid rgba(80,180,100,.18)",borderRadius:20,padding:"5px 14px",color:"#3a6644",fontSize:".73rem",cursor:"pointer",fontFamily:"'Georgia',serif"}}>Pricing</button>
            {user
              ? <button onClick={()=>setShowProfile(true)} style={{background:"rgba(34,163,90,.1)",border:"1px solid rgba(34,163,90,.25)",borderRadius:20,padding:"5px 14px",color:"#4ec97a",fontSize:".73rem",cursor:"pointer",fontFamily:"'Georgia',serif",display:"flex",alignItems:"center",gap:7}}>
                  <span>👤 {user.name.split(" ")[0]}</span>
                  <span style={{background:"rgba(34,163,90,.2)",borderRadius:12,padding:"2px 8px",color:(user.credits??0)<=0.5?"#e88a8a":(user.credits??0)<=2?"#ffc85a":"#4ec97a",fontSize:".68rem",fontWeight:600}}>{user.credits??0} cr</span>
                </button>
              : <button onClick={()=>setShowAuth(true)} style={{background:"linear-gradient(135deg,#22a35a,#1a7a44)",border:"none",borderRadius:20,padding:"6px 16px",color:"#e8f5eb",fontSize:".73rem",cursor:"pointer",fontFamily:"'Georgia',serif",fontWeight:600}}>Sign in</button>
            }
          </div>
        </div>

        {/* ── ALWAYS-VISIBLE SEARCH BAR ── */}
        <div style={{padding:"16px 20px 8px"}}>
          {hasConvo && (
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <button onClick={reset} style={{background:"none",border:"none",color:"#2e5535",fontSize:".72rem",cursor:"pointer",fontFamily:"'Georgia',serif"}}>← Start over</button>
              <span style={{color:"#1e3d25",fontSize:".68rem"}}>
                {messages.filter(m=>m.role==="user").length} search{messages.filter(m=>m.role==="user").length!==1?"es":""} this session
                {user && <span style={{marginLeft:8,color:"#2e5535"}}>· {user.credits??0} credits left</span>}
              </span>
            </div>
          )}
          <div style={{background:"rgba(255,255,255,.06)",border:"1.5px solid rgba(80,180,100,.32)",borderRadius:20,padding:"6px 6px 6px 18px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 4px 32px rgba(34,163,90,.1)"}}>
            <span style={{fontSize:16,opacity:.5}}>🔍</span>
            <input value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&!loading&&handleQuery(input)}
              placeholder={hasConvo?"Ask a follow-up question...":"e.g. I've been exhausted after lunch every day this week..."}
              className="search-input"
              style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#c8e8ce",fontSize:".92rem",fontFamily:"'Georgia',serif",padding:"13px 0",caretColor:"#4ec97a"}}/>
            <button onClick={()=>handleQuery(input)} disabled={!input.trim()||loading}
              style={{background:input.trim()&&!loading?"linear-gradient(135deg,#22a35a,#1a7a44)":"rgba(34,163,90,.15)",border:"none",borderRadius:14,padding:"11px 20px",color:"#e8f5eb",fontSize:".85rem",cursor:input.trim()&&!loading?"pointer":"not-allowed",fontFamily:"'Georgia',serif",whiteSpace:"nowrap",fontWeight:600,transition:"all .2s"}}>
              {hasConvo?"Ask →":"Search"}
            </button>
          </div>
        </div>

        {/* HOME */}
        {!hasConvo && (
          <div style={{animation:"fadeUp .4s ease forwards"}}>

            {/* Disclaimer */}
            <div style={{margin:"20px 20px 0",background:"rgba(255,200,80,.04)",border:"1px solid rgba(255,200,80,.14)",borderRadius:14,padding:"12px 16px",display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:15,flexShrink:0,marginTop:1}}>⚠️</span>
              <p style={{margin:0,color:"#7a6e38",fontSize:".71rem",lineHeight:1.65}}>
                <strong style={{color:"#a09040"}}>Disclaimer:</strong> Nature's Pantry provides general food and wellness suggestions only and cannot be held responsible for allergic reactions or adverse health effects. Always consult a qualified healthcare professional before making dietary changes. Make responsible decisions based on your personal health needs and known allergies.
              </p>
            </div>

            <div style={{textAlign:"center",padding:"28px 32px 22px"}}>
              <div style={{fontSize:48,marginBottom:12}}>🌿</div>
              <h1 className="home-title" style={{fontSize:"2.1rem",fontWeight:400,color:"#a8ddb5",margin:"0 0 8px",letterSpacing:"-.02em"}}>How are you feeling today?</h1>
              <p style={{color:"#4a7a56",fontSize:".88rem",fontStyle:"italic",margin:"0 0 6px"}}>Describe what you're going through</p>
              <p style={{color:"#3a6644",fontSize:".76rem",margin:0,lineHeight:1.7}}>
                We'll listen, then suggest personalised foods, recipes, a wellness tip &amp; a 7-day preventive food plan
              </p>
              {user?.allergies?.length>0&&(
                <div style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:12,background:"rgba(200,80,80,.07)",border:"1px solid rgba(200,80,80,.18)",borderRadius:20,padding:"4px 14px"}}>
                  <span style={{color:"#8a5050",fontSize:".7rem"}}>🚫 Avoiding: {user.allergies.join(", ")}</span>
                </div>
              )}
            </div>

            {/* divider */}
            <div style={{padding:"4px 20px 12px",display:"flex",alignItems:"center",gap:12}}>
              <div style={{flex:1,height:1,background:"rgba(80,180,100,.1)"}}/>
              <span style={{color:"#2e5535",fontSize:".7rem",letterSpacing:".1em",whiteSpace:"nowrap"}}>or pick a symptom</span>
              <div style={{flex:1,height:1,background:"rgba(80,180,100,.1)"}}/>
            </div>
            <div style={{padding:"0 20px 16px",display:"flex",flexWrap:"wrap",gap:9,justifyContent:"center"}}>
              {SUGGESTIONS.map(s=>(
                <button key={s.label} className="chip" onClick={()=>handleQuery(s.query)}
                  style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(80,180,100,.2)",borderRadius:40,padding:"8px 16px",display:"flex",alignItems:"center",gap:7,color:"#7dc891",fontSize:".82rem",fontFamily:"'Georgia',serif",transition:"all .15s"}}>
                  <span style={{fontSize:13}}>{s.emoji}</span><span>{s.label}</span>
                </button>
              ))}
            </div>

            {!user&&(
              <div style={{textAlign:"center",padding:"4px 0 0"}}>
                <button onClick={()=>setShowAuth(true)} style={{background:"none",border:"none",color:"#2e5535",fontSize:".72rem",cursor:"pointer",fontFamily:"'Georgia',serif",fontStyle:"italic"}}>
                  {guestSearches === 0 ? "✦ 1 free search — no account needed" : "Sign up free for 3 credits & save your history →"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* CONVERSATION */}
        {hasConvo && (
          <div style={{padding:"16px 20px 0"}}>
            {messages.map((msg,idx)=>(
              <div key={idx} className="msg-bubble" style={{marginBottom:msg.role==="user"?10:28}}>

                {/* User bubble */}
                {msg.role==="user"&&(
                  <div style={{display:"flex",justifyContent:"flex-end"}}>
                    <div style={{background:"rgba(34,163,90,.15)",border:"1px solid rgba(34,163,90,.25)",borderRadius:"18px 18px 4px 18px",padding:"11px 17px",maxWidth:"82%",color:"#c8e8ce",fontSize:".88rem",lineHeight:1.6}}>
                      {msg.content}
                    </div>
                  </div>
                )}

                {/* Assistant response */}
                {msg.role==="assistant"&&msg.result&&(
                  <div>
                    {/* Acknowledgment */}
                    <div style={{background:"linear-gradient(135deg,rgba(34,163,90,.1),rgba(20,80,40,.08))",border:"1px solid rgba(34,163,90,.25)",borderRadius:18,padding:"20px 22px",marginBottom:18,position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:14,right:16,fontSize:22,opacity:.12}}>🌿</div>
                      <div style={{color:"#4a9960",fontSize:".66rem",letterSpacing:".14em",textTransform:"uppercase",marginBottom:8}}>A note for you</div>
                      <p className="ack-text" style={{color:"#b8e8c4",fontSize:".89rem",lineHeight:1.75,margin:0,fontStyle:"italic"}}>{msg.result.acknowledgment}</p>
                    </div>

                    {/* Foods */}
                    {msg.result.foods?.length>0&&(
                      <div style={{marginBottom:18}}>
                        <div style={{color:"#4a9960",fontSize:".66rem",letterSpacing:".14em",textTransform:"uppercase",marginBottom:11}}>🌱 Foods that help</div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(115px,1fr))",gap:8}}>
                          {msg.result.foods.map((food,i)=>(
                            <div key={i} className="food-card" style={{background:"rgba(34,163,90,.07)",border:"1px solid rgba(34,163,90,.18)",borderRadius:14,padding:"14px 10px",textAlign:"center",transition:"transform .2s"}}>
                              <div style={{fontSize:22,marginBottom:6}}>{food.emoji}</div>
                              <div className="food-name" style={{color:"#b8e8c4",fontSize:".78rem",fontWeight:600,marginBottom:4}}>{food.name}</div>
                              <div style={{color:"#4a7a56",fontSize:".63rem",lineHeight:1.4}}>{food.benefit}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recipes */}
                    {msg.result.recipes?.length>0&&(
                      <div style={{marginBottom:18}}>
                        <div style={{color:"#4a9960",fontSize:".66rem",letterSpacing:".14em",textTransform:"uppercase",marginBottom:11}}>🍳 Quick recipes</div>
                        <div style={{display:"flex",flexDirection:"column",gap:8}}>
                          {msg.result.recipes.map((recipe,i)=>{
                            const rid=`${idx}-${i}`;
                            return (
                              <div key={i} className="rc" style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(34,163,90,.18)",borderRadius:13,overflow:"hidden",transition:"border-color .2s"}}>
                                <button onClick={()=>setActiveRecipe(activeRecipe===rid?null:rid)}
                                  style={{width:"100%",textAlign:"left",background:"transparent",border:"none",padding:"13px 17px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",fontFamily:"'Georgia',serif"}}>
                                  <span className="recipe-name" style={{color:"#c8e8ce",fontSize:".87rem"}}>{recipe.emoji} {recipe.name}</span>
                                  <span style={{color:"#4a7a56",fontSize:".7rem",display:"inline-block",transform:activeRecipe===rid?"rotate(180deg)":"rotate(0deg)",transition:"transform .2s"}}>▼</span>
                                </button>
                                {activeRecipe===rid&&(
                                  <div style={{padding:"0 17px 15px",borderTop:"1px solid rgba(34,163,90,.1)"}}>
                                    <div style={{marginTop:11,marginBottom:10}}>
                                      <div style={{color:"#4a9960",fontSize:".6rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:7}}>Ingredients</div>
                                      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                                        {(recipe.ingredients||[]).map((ing,j)=><span key={j} style={{background:"rgba(34,163,90,.1)",border:"1px solid rgba(34,163,90,.2)",borderRadius:20,padding:"3px 10px",color:"#8dc89e",fontSize:".72rem"}}>{ing}</span>)}
                                      </div>
                                    </div>
                                    <div>
                                      <div style={{color:"#4a9960",fontSize:".6rem",letterSpacing:".1em",textTransform:"uppercase",marginBottom:7}}>Steps</div>
                                      {(recipe.steps||[]).map((step,j)=>(
                                        <div key={j} style={{display:"flex",gap:8,marginBottom:7,alignItems:"flex-start"}}>
                                          <span style={{minWidth:19,height:19,borderRadius:"50%",background:"rgba(34,163,90,.2)",color:"#4ec97a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".62rem",fontWeight:700,flexShrink:0,marginTop:2}}>{j+1}</span>
                                          <span style={{color:"#8dc89e",fontSize:".81rem",lineHeight:1.55}}>{step}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Tip */}
                    {msg.result.tip&&(
                      <div style={{background:"linear-gradient(135deg,rgba(34,163,90,.1),rgba(20,100,55,.06))",border:"1px solid rgba(34,163,90,.22)",borderRadius:13,padding:"15px 19px",display:"flex",gap:11,alignItems:"flex-start",marginBottom:18}}>
                        <span style={{fontSize:17,marginTop:2}}>💡</span>
                        <div>
                          <div style={{color:"#4a9960",fontSize:".6rem",letterSpacing:".12em",textTransform:"uppercase",marginBottom:5}}>Tip for you</div>
                          <div className="tip-text" style={{color:"#a8d8b4",fontSize:".84rem",lineHeight:1.65}}>{msg.result.tip}</div>
                        </div>
                      </div>
                    )}

                    {/* 7-day plan — only on last assistant message */}
                    {idx===messages.length-1&&msg.result.weekPlan&&<WeekPlan plan={msg.result.weekPlan}/>}

                    {idx===messages.length-1&&(
                      <div style={{textAlign:"right",marginTop:6}}>
                        <button onClick={()=>setPage("pricing")} style={{background:"none",border:"none",color:"#2e5535",fontSize:".7rem",cursor:"pointer",fontFamily:"'Georgia',serif",fontStyle:"italic"}}>Get more searches →</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading&&(
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",animation:"fadeUp .3s ease"}}>
                <span style={{fontSize:18,animation:"spin 2s linear infinite"}}>🌿</span>
                <span style={{color:"#4ec97a",fontSize:".83rem",fontStyle:"italic",animation:"pulse 1.8s ease infinite"}}>Finding what nature made for you...</span>
              </div>
            )}

            {error&&(
              <div style={{color:"#e88a8a",padding:"12px 16px",background:"rgba(200,80,80,.08)",borderRadius:11,border:"1px solid rgba(200,80,80,.15)",fontSize:".8rem",marginBottom:10}}>{error}</div>
            )}
            <div ref={bottomRef}/>
          </div>
        )}



      </div>
    </div>
  );
}
