import { useState } from "react";

const SUGGESTIONS = [
  { label: "Low Energy", emoji: "⚡", query: "I feel tired and low on energy all day" },
  { label: "Stress & Anxiety", emoji: "🌿", query: "I'm feeling really stressed and anxious" },
  { label: "Bloating", emoji: "🌱", query: "I have bloating and digestive discomfort" },
  { label: "Immunity", emoji: "🛡️", query: "I keep getting sick and want to boost my immunity" },
  { label: "Inflammation", emoji: "🔥", query: "I have chronic inflammation and joint pain" },
  { label: "Poor Sleep", emoji: "🌙", query: "I have trouble falling and staying asleep" },
  { label: "Brain Fog", emoji: "🧠", query: "I have brain fog and can't focus" },
  { label: "Skin Glow", emoji: "✨", query: "My skin looks dull and I want a natural glow" },
];

const SYSTEM_PROMPT = `You are a warm, empathetic nutrition and wellness expert. When someone describes how they feel, you:
1. First acknowledge their specific situation with genuine empathy (2-3 sentences, personal and warm, referencing exactly what they said)
2. Then suggest natural foods and recipes tailored precisely to their concern

Respond ONLY with a raw JSON object — no markdown, no backticks, no explanation. Use this exact structure:
{
  "acknowledgment": "Warm, personal 2-3 sentence response acknowledging exactly what they described. Be specific to their words, not generic.",
  "foods": [{"name": "food name", "emoji": "emoji", "benefit": "specific reason it helps their exact situation"}],
  "recipes": [{"name": "recipe name", "emoji": "emoji", "ingredients": ["item1", "item2"], "steps": ["step1", "step2"]}],
  "tip": "one highly specific, actionable tip directly related to what they described"
}

Rules:
- acknowledgment must reference their specific words and situation, not be generic
- foods: 3-5 items, benefits must relate to their specific concern
- recipes: up to 3, under 10 minutes, natural ingredients only
- tip: specific to their exact situation, not generic wellness advice`;

export default function NutritionAdvisor() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [lastQuery, setLastQuery] = useState("");

  const handleQuery = async (query) => {
    setLoading(true);
    setResult(null);
    setError(null);
    setActiveRecipe(null);
    setLastQuery(query);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: query }],
        }),
      });

      const bodyText = await res.text();
      if (!res.ok) throw new Error("HTTP " + res.status + ": " + bodyText.substring(0, 200));

      let data;
      try { data = JSON.parse(bodyText); } catch { throw new Error("Response not JSON: " + bodyText.substring(0, 200)); }

      const rawText = (data.content || []).map(b => b.text || "").join("").trim();
      if (!rawText) throw new Error("Empty response");

      const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON found");

      const parsed = JSON.parse(match[0]);
      setResult(parsed);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleSubmit = () => { if (input.trim()) handleQuery(input.trim()); };
  const handleBack = () => { setResult(null); setError(null); setLastQuery(""); };

  return (
    <div style={{ minHeight: "100vh", background: "#0b1a0d", fontFamily: "'Georgia', serif", color: "#e0ede2" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        .chip:hover { background: rgba(80,180,100,0.15) !important; color: #b8e8c4 !important; cursor: pointer; }
        .food-card:hover { transform: translateY(-3px); }
        .recipe-card:hover { border-color: rgba(34,163,90,0.35) !important; }
        @media (min-width: 768px) {
          .home-title { font-size: 3.2rem !important; }
          .home-sub { font-size: 1.05rem !important; }
          .home-desc { font-size: 0.9rem !important; }
          .search-wrap { padding: 8px 8px 8px 24px !important; }
          .search-input { font-size: 1.05rem !important; padding: 16px 0 !important; }
          .search-btn { font-size: 0.95rem !important; padding: 14px 28px !important; border-radius: 14px !important; }
          .chip { font-size: 0.9rem !important; padding: 9px 18px !important; }
          .chip-emoji { font-size: 15px !important; }
          .divider-label { font-size: 0.8rem !important; }
          .ack-text { font-size: 1rem !important; line-height: 1.8 !important; }
          .section-label { font-size: 0.8rem !important; }
          .food-emoji { font-size: 30px !important; }
          .food-name { font-size: 0.95rem !important; }
          .food-benefit { font-size: 0.76rem !important; }
          .recipe-name { font-size: 1rem !important; }
          .ing-tag { font-size: 0.85rem !important; padding: 5px 13px !important; }
          .step-text { font-size: 0.92rem !important; }
          .tip-text { font-size: 0.97rem !important; }
          .back-btn { font-size: 0.9rem !important; }
          .result-label { font-size: 1rem !important; }
        }
      `}</style>

      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse 100% 50% at 50% 0%, #152e18 0%, #0b1a0d 60%)", zIndex: 0, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto", padding: "0 0 80px" }}>

        {/* ── HOME ── */}
        {!result && !loading && (
          <div style={{ animation: "fadeUp 0.4s ease forwards" }}>
            <div style={{ textAlign: "center", padding: "60px 32px 28px" }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>🌿</div>
              <h1 className="home-title" style={{ fontSize: "2.2rem", fontWeight: 400, color: "#a8ddb5", margin: "0 0 8px", letterSpacing: "-0.02em" }}>Nature's Pantry</h1>
              <p className="home-sub" style={{ color: "#4a7a56", fontSize: "0.9rem", fontStyle: "italic", margin: "0 0 6px" }}>How are you feeling today?</p>
              <p className="home-desc" style={{ color: "#3a6644", fontSize: "0.78rem", margin: 0, lineHeight: 1.7 }}>
                Describe what you're going through — we'll listen, then suggest the right foods, recipes &amp; a wellness tip just for you
              </p>
            </div>

            {/* Search */}
            <div style={{ padding: "0 20px 20px" }}>
              <div className="search-wrap" style={{ background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(80,180,100,0.35)", borderRadius: 20, padding: "6px 6px 6px 20px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 32px rgba(34,163,90,0.1)" }}>
                <span style={{ fontSize: 18, opacity: 0.6 }}>🔍</span>
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  placeholder="e.g. I've been exhausted after lunch every day this week..."
                  className="search-input"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#c8e8ce", fontSize: "0.95rem", fontFamily: "'Georgia', serif", padding: "14px 0", caretColor: "#4ec97a" }} />
                <button onClick={handleSubmit} disabled={!input.trim()}
                  className="search-btn"
                  style={{ background: input.trim() ? "linear-gradient(135deg, #22a35a, #1a7a44)" : "rgba(34,163,90,0.2)", border: "none", borderRadius: 14, padding: "12px 22px", color: "#e8f5eb", fontSize: "0.88rem", cursor: input.trim() ? "pointer" : "not-allowed", fontFamily: "'Georgia', serif", whiteSpace: "nowrap", fontWeight: 600, transition: "all 0.2s" }}>
                  Search
                </button>
              </div>
            </div>

            {/* Divider */}
            <div style={{ padding: "0 20px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(80,180,100,0.1)" }} />
              <span className="divider-label" style={{ color: "#3a6644", fontSize: "0.72rem", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>or pick a symptom</span>
              <div style={{ flex: 1, height: 1, background: "rgba(80,180,100,0.1)" }} />
            </div>

            {/* Chips */}
            <div style={{ padding: "0 20px", display: "flex", flexWrap: "wrap", gap: 9 }}>
              {SUGGESTIONS.map(s => (
                <button key={s.label} className="chip" onClick={() => { setInput(s.query); handleQuery(s.query); }}
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(80,180,100,0.2)", borderRadius: 40, padding: "8px 16px", display: "flex", alignItems: "center", gap: 7, color: "#7dc891", fontSize: "0.82rem", fontFamily: "'Georgia', serif", transition: "all 0.15s" }}>
                  <span className="chip-emoji" style={{ fontSize: 14 }}>{s.emoji}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16, animation: "fadeUp 0.3s ease" }}>
            <div style={{ fontSize: 40, animation: "spin 2.5s linear infinite" }}>🌿</div>
            <div style={{ color: "#4ec97a", fontSize: "0.9rem", fontStyle: "italic", animation: "pulse 1.8s ease infinite" }}>
              Finding what nature made for you...
            </div>
            <div style={{ color: "#2e5535", fontSize: "0.75rem", maxWidth: 280, textAlign: "center", lineHeight: 1.6 }}>
              "{lastQuery}"
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {error && !loading && (
          <div style={{ padding: "40px 20px" }}>
            <div style={{ color: "#e88a8a", padding: "18px 22px", background: "rgba(200,80,80,0.08)", borderRadius: 14, border: "1px solid rgba(200,80,80,0.15)", fontSize: "0.85rem", marginBottom: 16 }}>
              {error}
            </div>
            <button onClick={handleBack} style={{ background: "transparent", border: "1px solid rgba(80,180,100,0.3)", borderRadius: 12, padding: "10px 20px", color: "#7dc891", cursor: "pointer", fontFamily: "'Georgia', serif", fontSize: "0.85rem" }}>← Try again</button>
          </div>
        )}

        {/* ── RESULTS ── */}
        {result && !loading && (
          <div style={{ animation: "fadeUp 0.4s ease forwards" }}>

            {/* Back button */}
            <div style={{ padding: "24px 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={handleBack} className="back-btn"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(80,180,100,0.2)", borderRadius: 12, padding: "8px 16px", color: "#7dc891", cursor: "pointer", fontFamily: "'Georgia', serif", fontSize: "0.82rem", transition: "all 0.15s" }}>
                ← Back
              </button>
            </div>

            <div style={{ padding: "20px 20px 0" }}>

              {/* Acknowledgment card */}
              {result.acknowledgment && (
                <div style={{ background: "linear-gradient(135deg, rgba(34,163,90,0.1), rgba(20,80,40,0.08))", border: "1px solid rgba(34,163,90,0.25)", borderRadius: 18, padding: "22px 24px", marginBottom: 28, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 16, right: 18, fontSize: 28, opacity: 0.15 }}>🌿</div>
                  <div style={{ color: "#4a9960", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>A note for you</div>
                  <p className="ack-text" style={{ color: "#b8e8c4", fontSize: "0.93rem", lineHeight: 1.75, margin: 0, fontStyle: "italic" }}>
                    {result.acknowledgment}
                  </p>
                </div>
              )}

              {/* Foods */}
              <div style={{ marginBottom: 28 }}>
                <div className="section-label" style={{ color: "#4a9960", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 14 }}>🌱 Foods that help</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
                  {(result.foods || []).map((food, i) => (
                    <div key={i} className="food-card"
                      style={{ background: "rgba(34,163,90,0.07)", border: "1px solid rgba(34,163,90,0.18)", borderRadius: 16, padding: "16px 12px", textAlign: "center", transition: "transform 0.2s" }}>
                      <div className="food-emoji" style={{ fontSize: 26, marginBottom: 7 }}>{food.emoji}</div>
                      <div className="food-name" style={{ color: "#b8e8c4", fontSize: "0.82rem", fontWeight: 600, marginBottom: 5 }}>{food.name}</div>
                      <div className="food-benefit" style={{ color: "#4a7a56", fontSize: "0.68rem", lineHeight: 1.4 }}>{food.benefit}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recipes */}
              <div style={{ marginBottom: 28 }}>
                <div className="section-label" style={{ color: "#4a9960", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 14 }}>🍳 Quick recipes (under 10 min)</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(result.recipes || []).map((recipe, i) => (
                    <div key={i} className="recipe-card"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(34,163,90,0.18)", borderRadius: 16, overflow: "hidden", transition: "border-color 0.2s" }}>
                      <button onClick={() => setActiveRecipe(activeRecipe === i ? null : i)}
                        style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'Georgia', serif" }}>
                        <span className="recipe-name" style={{ color: "#c8e8ce", fontSize: "0.92rem" }}>{recipe.emoji} {recipe.name}</span>
                        <span style={{ color: "#4a7a56", fontSize: "0.75rem", transition: "transform 0.2s", display: "inline-block", transform: activeRecipe === i ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                      </button>
                      {activeRecipe === i && (
                        <div style={{ padding: "0 20px 18px", borderTop: "1px solid rgba(34,163,90,0.1)" }}>
                          <div style={{ marginTop: 14, marginBottom: 12 }}>
                            <div style={{ color: "#4a9960", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Ingredients</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {(recipe.ingredients || []).map((ing, j) => (
                                <span key={j} className="ing-tag" style={{ background: "rgba(34,163,90,0.1)", border: "1px solid rgba(34,163,90,0.2)", borderRadius: 20, padding: "4px 11px", color: "#8dc89e", fontSize: "0.77rem" }}>{ing}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div style={{ color: "#4a9960", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Steps</div>
                            {(recipe.steps || []).map((step, j) => (
                              <div key={j} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                                <span style={{ minWidth: 22, height: 22, borderRadius: "50%", background: "rgba(34,163,90,0.2)", color: "#4ec97a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 700, marginTop: 1, flexShrink: 0 }}>{j + 1}</span>
                                <span className="step-text" style={{ color: "#8dc89e", fontSize: "0.84rem", lineHeight: 1.55 }}>{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tip */}
              <div style={{ background: "linear-gradient(135deg, rgba(34,163,90,0.1), rgba(20,100,55,0.06))", border: "1px solid rgba(34,163,90,0.22)", borderRadius: 16, padding: "18px 22px", display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontSize: 20, marginTop: 2 }}>💡</span>
                <div>
                  <div style={{ color: "#4a9960", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>Tip for you</div>
                  <div className="tip-text" style={{ color: "#a8d8b4", fontSize: "0.88rem", lineHeight: 1.65 }}>{result.tip}</div>
                </div>
              </div>

            </div>
          </div>
        )}

        <div style={{ textAlign: "center", color: "#1e3d25", fontSize: "0.7rem", padding: "32px 0 0" }}>
          Nature's Pantry · Food-first wellness
        </div>
      </div>
    </div>
  );
}
