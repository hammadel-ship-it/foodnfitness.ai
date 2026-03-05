import { useState } from "react";

const DATA = {
  "Low Energy": {
    emoji: "⚡",
    query: "I feel tired and low on energy",
    foods: [
      { name: "Bananas", emoji: "🍌", benefit: "Quick natural sugar + potassium for sustained energy" },
      { name: "Oats", emoji: "🌾", benefit: "Slow-release carbs that fuel you for hours" },
      { name: "Spinach", emoji: "🥬", benefit: "Iron-rich — fights fatigue at the cellular level" },
      { name: "Almonds", emoji: "🥜", benefit: "Magnesium + healthy fats for steady energy" },
      { name: "Blueberries", emoji: "🫐", benefit: "Antioxidants that protect energy-producing cells" },
    ],
    recipes: [
      {
        name: "Banana Oat Power Smoothie", emoji: "🥤",
        ingredients: ["1 banana", "½ cup oats", "1 cup almond milk", "1 tsp honey", "pinch of cinnamon"],
        steps: ["Add all ingredients to a blender.", "Blend for 60 seconds until smooth.", "Pour and drink immediately for best energy boost."],
      },
      {
        name: "Spinach & Almond Energy Bowl", emoji: "🥗",
        ingredients: ["2 handfuls spinach", "¼ cup almonds", "½ cup blueberries", "1 tbsp olive oil", "lemon juice"],
        steps: ["Toss spinach, almonds and blueberries in a bowl.", "Drizzle with olive oil and a squeeze of lemon.", "Season with salt and eat immediately."],
      },
      {
        name: "Quick Almond Oat Bites", emoji: "🟤",
        ingredients: ["1 cup oats", "½ cup almond butter", "2 tbsp honey", "pinch of salt"],
        steps: ["Mix all ingredients in a bowl until combined.", "Roll into small balls with your hands.", "Eat 2–3 for an instant energy hit."],
      },
    ],
    tip: "Eat a protein-rich breakfast within 30 minutes of waking to stabilise blood sugar and maintain energy all morning.",
  },
  "Stress & Anxiety": {
    emoji: "🌿",
    query: "I'm feeling stressed and anxious",
    foods: [
      { name: "Chamomile", emoji: "🌼", benefit: "Natural calming effect on the nervous system" },
      { name: "Dark Chocolate", emoji: "🍫", benefit: "Reduces cortisol and boosts mood hormones" },
      { name: "Avocado", emoji: "🥑", benefit: "B vitamins that support brain stress response" },
      { name: "Walnuts", emoji: "🫘", benefit: "Omega-3s that lower anxiety and inflammation" },
      { name: "Ashwagandha", emoji: "🌱", benefit: "Adaptogen herb that regulates cortisol levels" },
    ],
    recipes: [
      {
        name: "Calming Chamomile Honey Tea", emoji: "🍵",
        ingredients: ["1 chamomile tea bag", "1 cup hot water", "1 tsp raw honey", "slice of lemon"],
        steps: ["Steep chamomile in hot water for 5 minutes.", "Remove bag, stir in honey.", "Sip slowly — no screens, just breathe."],
      },
      {
        name: "Stress-Relief Avocado Toast", emoji: "🥑",
        ingredients: ["1 slice wholegrain bread", "½ ripe avocado", "pinch of sea salt", "chilli flakes", "lemon juice"],
        steps: ["Toast the bread until golden.", "Mash avocado with lemon, salt and chilli.", "Spread on toast and eat mindfully."],
      },
      {
        name: "Dark Chocolate Walnut Snack", emoji: "🍫",
        ingredients: ["2 squares dark chocolate (70%+)", "small handful walnuts"],
        steps: ["Break chocolate into pieces.", "Pair with walnuts.", "Eat slowly — let chocolate melt on your tongue."],
      },
    ],
    tip: "Try 4-7-8 breathing while eating: inhale 4 counts, hold 7, exhale 8. It activates your parasympathetic nervous system within minutes.",
  },
  "Bloating": {
    emoji: "🌱",
    query: "I have bloating and digestive issues",
    foods: [
      { name: "Ginger", emoji: "🫚", benefit: "Speeds up gastric emptying and reduces gas" },
      { name: "Fennel", emoji: "🌿", benefit: "Relaxes intestinal muscles and relieves bloating" },
      { name: "Cucumber", emoji: "🥒", benefit: "High water content flushes excess sodium" },
      { name: "Papaya", emoji: "🍈", benefit: "Contains papain enzyme that aids protein digestion" },
      { name: "Yogurt", emoji: "🥛", benefit: "Probiotics that restore healthy gut bacteria balance" },
    ],
    recipes: [
      {
        name: "Ginger Lemon Digestive Tonic", emoji: "🍋",
        ingredients: ["1 inch fresh ginger", "juice of ½ lemon", "1 cup warm water", "1 tsp honey"],
        steps: ["Grate or slice ginger into warm water.", "Squeeze in lemon juice and add honey.", "Drink 20 minutes before or after a meal."],
      },
      {
        name: "Fennel & Cucumber Salad", emoji: "🥗",
        ingredients: ["½ cucumber sliced", "1 tbsp fennel seeds", "juice of ½ lemon", "fresh mint", "olive oil"],
        steps: ["Toast fennel seeds in a dry pan for 1 minute.", "Combine with cucumber, mint, lemon and oil.", "Toss and eat as a light meal or side."],
      },
      {
        name: "Papaya Probiotic Bowl", emoji: "🍈",
        ingredients: ["½ papaya cubed", "½ cup plain yogurt", "1 tsp honey", "pinch of ginger powder"],
        steps: ["Scoop yogurt into a bowl.", "Top with papaya cubes.", "Drizzle honey and dust with ginger powder."],
      },
    ],
    tip: "Chew each bite at least 20 times — digestion starts in the mouth, and thorough chewing dramatically reduces bloating.",
  },
  "Immunity": {
    emoji: "🛡️",
    query: "I want to boost my immune system",
    foods: [
      { name: "Garlic", emoji: "🧄", benefit: "Allicin compound has powerful antimicrobial effects" },
      { name: "Citrus Fruits", emoji: "🍊", benefit: "Vitamin C stimulates white blood cell production" },
      { name: "Turmeric", emoji: "🟡", benefit: "Curcumin activates immune cells and fights infection" },
      { name: "Elderberry", emoji: "🫐", benefit: "Shown to cut cold duration by up to 4 days" },
      { name: "Green Tea", emoji: "🍵", benefit: "EGCG antioxidant enhances immune cell function" },
    ],
    recipes: [
      {
        name: "Golden Immunity Milk", emoji: "🥛",
        ingredients: ["1 cup warm milk (any kind)", "1 tsp turmeric", "½ tsp ginger", "pinch black pepper", "1 tsp honey"],
        steps: ["Warm milk in a small pot — don't boil.", "Whisk in turmeric, ginger and black pepper.", "Pour into a mug, stir in honey and drink."],
      },
      {
        name: "Immune-Boost Citrus Shot", emoji: "🍊",
        ingredients: ["juice of 2 oranges", "juice of 1 lemon", "1 clove raw garlic", "½ tsp turmeric"],
        steps: ["Juice oranges and lemon.", "Crush garlic and steep in juice for 2 minutes.", "Add turmeric, stir well and drink in one shot."],
      },
      {
        name: "Green Tea & Ginger Brew", emoji: "🍵",
        ingredients: ["1 green tea bag", "1 inch fresh ginger", "1 cup hot water", "honey to taste"],
        steps: ["Steep tea bag and ginger slices in hot water 4 mins.", "Remove bag, leave ginger in.", "Add honey and drink warm."],
      },
    ],
    tip: "Sleep is your most powerful immune tool — aim for 7–9 hours. Your body produces cytokines (immune proteins) only during deep sleep.",
  },
  "Inflammation": {
    emoji: "🔥",
    query: "I have chronic inflammation",
    foods: [
      { name: "Turmeric", emoji: "🟡", benefit: "Curcumin is one of nature's most potent anti-inflammatories" },
      { name: "Fatty Fish", emoji: "🐟", benefit: "Omega-3s directly suppress inflammatory pathways" },
      { name: "Tart Cherries", emoji: "🍒", benefit: "Anthocyanins reduce inflammation markers in blood" },
      { name: "Olive Oil", emoji: "🫒", benefit: "Oleocanthal works like ibuprofen on inflammation" },
      { name: "Broccoli", emoji: "🥦", benefit: "Sulforaphane blocks key inflammatory molecules" },
    ],
    recipes: [
      {
        name: "Anti-Inflammation Turmeric Smoothie", emoji: "🥤",
        ingredients: ["1 cup coconut milk", "1 tsp turmeric", "½ tsp ginger", "1 tsp honey", "pinch black pepper", "½ cup frozen mango"],
        steps: ["Add all ingredients to blender.", "Blend until smooth and creamy.", "Drink daily for best results."],
      },
      {
        name: "Mediterranean Broccoli Bowl", emoji: "🥗",
        ingredients: ["1 cup broccoli florets", "2 tbsp olive oil", "1 clove garlic", "lemon juice", "sea salt"],
        steps: ["Microwave broccoli 3 minutes until tender.", "Toss immediately with olive oil and garlic.", "Squeeze lemon over top and season."],
      },
      {
        name: "Cherry & Walnut Recovery Snack", emoji: "🍒",
        ingredients: ["½ cup tart cherries (fresh or frozen)", "small handful walnuts", "1 tsp honey"],
        steps: ["If frozen, thaw cherries for 5 minutes.", "Combine with walnuts in a bowl.", "Drizzle honey over top and eat."],
      },
    ],
    tip: "Cut out refined sugar for just 2 weeks — it's the single biggest dietary driver of chronic inflammation and the results are noticeable fast.",
  },
  "Poor Sleep": {
    emoji: "🌙",
    query: "I have trouble sleeping at night",
    foods: [
      { name: "Tart Cherries", emoji: "🍒", benefit: "One of few natural food sources of melatonin" },
      { name: "Kiwi", emoji: "🥝", benefit: "Studies show eating 2 kiwis before bed improves sleep quality" },
      { name: "Magnesium Foods", emoji: "🌰", benefit: "Pumpkin seeds relax muscles and calm the nervous system" },
      { name: "Chamomile", emoji: "🌼", benefit: "Apigenin binds sleep receptors in the brain" },
      { name: "Warm Milk", emoji: "🥛", benefit: "Tryptophan converts to serotonin then melatonin" },
    ],
    recipes: [
      {
        name: "Sleep Tonic Warm Milk", emoji: "🥛",
        ingredients: ["1 cup warm milk", "½ tsp cinnamon", "1 tsp honey", "tiny pinch of nutmeg"],
        steps: ["Gently warm milk — don't boil.", "Stir in cinnamon, honey and nutmeg.", "Drink 30–60 minutes before bed."],
      },
      {
        name: "Sleepy Kiwi & Cherry Bowl", emoji: "🍒",
        ingredients: ["2 kiwis peeled and sliced", "½ cup tart cherries", "1 tbsp pumpkin seeds"],
        steps: ["Slice kiwis into a small bowl.", "Add cherries and pumpkin seeds.", "Eat 1 hour before bed."],
      },
      {
        name: "Chamomile Sleep Tea", emoji: "🍵",
        ingredients: ["2 chamomile tea bags", "1 cup hot water", "1 tsp honey", "dash of warm milk"],
        steps: ["Steep 2 bags for 5 minutes for maximum strength.", "Remove bags and stir in honey.", "Add a splash of warm milk and sip slowly."],
      },
    ],
    tip: "Keep your bedroom below 18°C (65°F) — your core body temperature must drop to initiate sleep, and a cool room accelerates this process.",
  },
  "Brain Fog": {
    emoji: "🧠",
    query: "I'm experiencing brain fog and poor focus",
    foods: [
      { name: "Blueberries", emoji: "🫐", benefit: "Flavonoids improve blood flow to the brain" },
      { name: "Walnuts", emoji: "🫘", benefit: "DHA omega-3 is essential for brain cell structure" },
      { name: "Eggs", emoji: "🥚", benefit: "Choline builds the neurotransmitter acetylcholine" },
      { name: "Dark Leafy Greens", emoji: "🥬", benefit: "Folate and vitamin K protect cognitive function" },
      { name: "Green Tea", emoji: "🍵", benefit: "L-theanine + caffeine = calm, focused alertness" },
    ],
    recipes: [
      {
        name: "Brain Boost Blueberry Smoothie", emoji: "🫐",
        ingredients: ["1 cup blueberries", "1 handful spinach", "1 tbsp walnut butter", "1 cup almond milk", "1 tsp honey"],
        steps: ["Add everything to blender.", "Blend 60 seconds until smooth.", "Drink in the morning for all-day focus."],
      },
      {
        name: "Focus Eggs & Greens", emoji: "🥚",
        ingredients: ["2 eggs", "1 handful spinach", "1 clove garlic", "olive oil", "salt & pepper"],
        steps: ["Heat olive oil, sauté garlic 30 seconds.", "Add spinach, wilt for 1 minute.", "Crack in eggs, scramble everything together."],
      },
      {
        name: "Matcha Focus Latte", emoji: "🍵",
        ingredients: ["1 tsp matcha powder", "1 cup warm oat milk", "1 tsp honey"],
        steps: ["Whisk matcha with 2 tbsp hot water until smooth paste.", "Heat oat milk until steaming.", "Pour milk over matcha, stir in honey."],
      },
    ],
    tip: "Drink 500ml of water first thing in the morning — even mild dehydration (1–2%) measurably impairs focus, memory and reaction time.",
  },
  "Skin Glow": {
    emoji: "✨",
    query: "I want glowing, healthy skin",
    foods: [
      { name: "Avocado", emoji: "🥑", benefit: "Vitamin E + healthy fats keep skin supple and dewy" },
      { name: "Sweet Potato", emoji: "🍠", benefit: "Beta-carotene converts to vitamin A for cell renewal" },
      { name: "Tomatoes", emoji: "🍅", benefit: "Lycopene protects against UV damage and dullness" },
      { name: "Green Tea", emoji: "🍵", benefit: "EGCG reduces redness and improves skin elasticity" },
      { name: "Pumpkin Seeds", emoji: "🎃", benefit: "Zinc regulates oil production and speeds healing" },
    ],
    recipes: [
      {
        name: "Glow Smoothie", emoji: "✨",
        ingredients: ["½ avocado", "1 cup mango chunks", "½ cup coconut water", "juice of ½ lime", "1 tsp honey"],
        steps: ["Blend all ingredients until silky smooth.", "Add more coconut water if too thick.", "Drink fresh — antioxidants degrade quickly."],
      },
      {
        name: "Sweet Potato Skin Bowl", emoji: "🍠",
        ingredients: ["1 sweet potato", "1 tbsp olive oil", "pinch of cinnamon", "handful pumpkin seeds", "drizzle of honey"],
        steps: ["Microwave sweet potato 5–6 minutes until soft.", "Split open, drizzle with olive oil.", "Top with pumpkin seeds, cinnamon and honey."],
      },
      {
        name: "Skin-Glow Tomato Salad", emoji: "🍅",
        ingredients: ["2 large tomatoes", "fresh basil", "2 tbsp olive oil", "sea salt", "balsamic vinegar"],
        steps: ["Slice tomatoes and arrange on a plate.", "Scatter basil leaves over.", "Drizzle with olive oil and balsamic, season well."],
      },
    ],
    tip: "Aim for 8–10 glasses of water daily and add a slice of lemon — hydration is the foundation of glowing skin that no cream can replace.",
  },
};

export default function NutritionAdvisor() {
  const [selected, setSelected] = useState(null);
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [customInput, setCustomInput] = useState("");

  const data = selected ? DATA[selected] : null;

  const handleSelect = (key) => {
    setSelected(key);
    setActiveRecipe(null);
  };

  const handleBack = () => {
    setSelected(null);
    setActiveRecipe(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0b1a0d", fontFamily: "'Georgia', serif", color: "#e0ede2" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .card:active { transform: scale(0.97); }
        .chip:active { opacity: 0.7; }
      `}</style>

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse 100% 50% at 50% 0%, #152e18 0%, #0b1a0d 60%)", zIndex: 0, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "0 0 60px" }}>

        {!selected ? (
          /* HOME SCREEN */
          <div style={{ animation: "fadeUp 0.4s ease forwards" }}>

            <div style={{ textAlign: "center", padding: "40px 24px 20px" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🌿</div>
              <h1 style={{ fontSize: "1.9rem", fontWeight: 400, color: "#a8ddb5", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Nature's Pantry</h1>
              <p style={{ color: "#4a7a56", fontSize: "0.88rem", fontStyle: "italic", margin: "0 0 4px" }}>How are you feeling today?</p>
              <p style={{ color: "#3a6644", fontSize: "0.76rem", margin: 0, lineHeight: 1.6 }}>Type your concern below → we'll suggest<br/>superfoods, quick recipes &amp; a wellness tip</p>
            </div>

            <div style={{ padding: "0 16px 18px" }}>
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(80,180,100,0.35)", borderRadius: 18, padding: "6px 6px 6px 18px", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 24px rgba(34,163,90,0.1)" }}>
                <span style={{ fontSize: 18 }}>🔍</span>
                <input value={customInput} onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key !== "Enter" || !customInput.trim()) return;
                    const lower = customInput.toLowerCase();
                    const match = Object.keys(DATA).find(k =>
                      lower.includes(k.toLowerCase()) ||
                      DATA[k].query.toLowerCase().split(" ").some(w => w.length > 4 && lower.includes(w))
                    ) || "Low Energy";
                    handleSelect(match);
                  }}
                  placeholder="e.g. I feel tired, bloated, stressed..."
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#c8e8ce", fontSize: "0.95rem", fontFamily: "'Georgia', serif", padding: "14px 0", caretColor: "#4ec97a" }} />
                <button
                  onClick={() => {
                    if (!customInput.trim()) return;
                    const lower = customInput.toLowerCase();
                    const match = Object.keys(DATA).find(k =>
                      lower.includes(k.toLowerCase()) ||
                      DATA[k].query.toLowerCase().split(" ").some(w => w.length > 4 && lower.includes(w))
                    ) || "Low Energy";
                    handleSelect(match);
                  }}
                  style={{ background: "linear-gradient(135deg, #22a35a, #1a7a44)", border: "none", borderRadius: 13, padding: "12px 18px", color: "#e8f5eb", fontSize: "0.85rem", cursor: "pointer", fontFamily: "'Georgia', serif", whiteSpace: "nowrap", fontWeight: 600 }}>
                  Search
                </button>
              </div>
            </div>

            <div style={{ padding: "0 16px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(80,180,100,0.12)" }} />
              <span style={{ color: "#3a6644", fontSize: "0.7rem", letterSpacing: "0.08em" }}>or pick a symptom</span>
              <div style={{ flex: 1, height: 1, background: "rgba(80,180,100,0.12)" }} />
            </div>

            <div style={{ padding: "0 16px", display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.entries(DATA).map(([key, val]) => (
                <button key={key} onClick={() => handleSelect(key)}
                  style={{
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(80,180,100,0.2)",
                    borderRadius: 40, padding: "7px 14px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6,
                    color: "#8dc89e", fontSize: "0.82rem", fontFamily: "'Georgia', serif",
                  }}
                  onTouchStart={e => { e.currentTarget.style.background = "rgba(80,180,100,0.15)"; e.currentTarget.style.color = "#b8e8c4"; }}
                  onTouchEnd={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#8dc89e"; }}
                >
                  <span style={{ fontSize: 14 }}>{val.emoji}</span>
                  <span>{key}</span>
                </button>
              ))}
            </div>

          </div>
        ) : (
          /* RESULTS SCREEN */
          <div style={{ animation: "fadeUp 0.35s ease forwards" }}>
            {/* Header */}
            <div style={{ padding: "20px 16px 0", display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={handleBack}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(80,180,100,0.2)", borderRadius: 12, padding: "8px 14px", color: "#7dc891", cursor: "pointer", fontFamily: "'Georgia', serif", fontSize: "0.85rem" }}>
                ← Back
              </button>
              <div style={{ fontSize: "1.1rem", color: "#a8ddb5" }}>{data.emoji} {selected}</div>
            </div>

            <div style={{ padding: "24px 16px 0" }}>

              {/* Foods */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ color: "#4a9960", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>🌱 Recommended Foods</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {data.foods.map((food, i) => (
                    <div key={i} style={{ background: "rgba(34,163,90,0.07)", border: "1px solid rgba(34,163,90,0.18)", borderRadius: 14, padding: "14px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 24, marginBottom: 5 }}>{food.emoji}</div>
                      <div style={{ color: "#b8e8c4", fontSize: "0.78rem", fontWeight: 600, marginBottom: 3 }}>{food.name}</div>
                      <div style={{ color: "#4a7a56", fontSize: "0.65rem", lineHeight: 1.35 }}>{food.benefit}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recipes */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ color: "#4a9960", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>🍳 Quick Recipes</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {data.recipes.map((recipe, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(34,163,90,0.18)", borderRadius: 14, overflow: "hidden" }}>
                      <button onClick={() => setActiveRecipe(activeRecipe === i ? null : i)}
                        style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'Georgia', serif" }}>
                        <span style={{ color: "#c8e8ce", fontSize: "0.92rem" }}>{recipe.emoji} {recipe.name}</span>
                        <span style={{ color: "#4a7a56", fontSize: "0.8rem" }}>{activeRecipe === i ? "▲" : "▼"}</span>
                      </button>
                      {activeRecipe === i && (
                        <div style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(34,163,90,0.1)" }}>
                          <div style={{ marginTop: 12, marginBottom: 10 }}>
                            <div style={{ color: "#4a9960", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 7 }}>Ingredients</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                              {recipe.ingredients.map((ing, j) => (
                                <span key={j} style={{ background: "rgba(34,163,90,0.1)", border: "1px solid rgba(34,163,90,0.2)", borderRadius: 20, padding: "3px 10px", color: "#8dc89e", fontSize: "0.75rem" }}>{ing}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div style={{ color: "#4a9960", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 7 }}>Steps</div>
                            {recipe.steps.map((step, j) => (
                              <div key={j} style={{ display: "flex", gap: 9, marginBottom: 6, alignItems: "flex-start" }}>
                                <span style={{ minWidth: 20, height: 20, borderRadius: "50%", background: "rgba(34,163,90,0.2)", color: "#4ec97a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 700, marginTop: 1 }}>{j + 1}</span>
                                <span style={{ color: "#8dc89e", fontSize: "0.82rem", lineHeight: 1.5 }}>{step}</span>
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
              <div style={{ background: "linear-gradient(135deg, rgba(34,163,90,0.1), rgba(20,100,55,0.06))", border: "1px solid rgba(34,163,90,0.22)", borderRadius: 14, padding: "16px", display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
                <span style={{ fontSize: 20 }}>💡</span>
                <div>
                  <div style={{ color: "#4a9960", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Expert Tip</div>
                  <div style={{ color: "#a8d8b4", fontSize: "0.87rem", lineHeight: 1.6 }}>{data.tip}</div>
                </div>
              </div>

            </div>
          </div>
        )}

        <div style={{ textAlign: "center", color: "#1e3d25", fontSize: "0.7rem", padding: "20px 0 0" }}>
          Nature's Pantry · Food-first wellness
        </div>
      </div>
    </div>
  );
}
