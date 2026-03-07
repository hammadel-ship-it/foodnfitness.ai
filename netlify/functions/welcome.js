exports.handler = async (event) => {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { name, email } = JSON.parse(event.body || "{}");
    if (!name || !email) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing name or email" }) };

    const firstName = name.split(" ")[0];

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Welcome to Nature's Pantry</title>
</head>
<body style="margin:0;padding:0;background:#0b1a0d;font-family:Georgia,serif;color:#e0ede2;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b1a0d;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:linear-gradient(160deg,#111e13,#0d1a0f);border:1px solid rgba(34,163,90,.25);border-radius:20px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,rgba(34,163,90,.18),rgba(15,55,28,.25));padding:36px 40px 28px;text-align:center;border-bottom:1px solid rgba(34,163,90,.12);">
            <div style="font-size:42px;margin-bottom:12px;">🌿</div>
            <h1 style="margin:0;font-size:1.7rem;font-weight:400;color:#a8ddb5;letter-spacing:-.01em;">Nature's Pantry</h1>
            <p style="margin:8px 0 0;color:#3a6644;font-size:.9rem;font-style:italic;">Food-first wellness, personalised for you</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="font-size:1.05rem;color:#b8e8c4;line-height:1.8;margin:0 0 20px;">
              Welcome, ${firstName} 🌱
            </p>
            <p style="font-size:.95rem;color:#6aaa80;line-height:1.8;margin:0 0 24px;">
              You've just joined a community that believes food is the most powerful medicine on earth. We draw from Ayurveda, Traditional Chinese Medicine, Mediterranean traditions, African herbalism and modern nutritional science — all in one place.
            </p>

            <!-- Credits box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(34,163,90,.07);border:1px solid rgba(34,163,90,.2);border-radius:14px;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 12px;color:#4a9960;font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;">Your account</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="text-align:center;padding:0 8px;">
                        <div style="font-size:1.6rem;font-weight:600;color:#4ec97a;">3</div>
                        <div style="font-size:.72rem;color:#2e5535;text-transform:uppercase;letter-spacing:.07em;margin-top:2px;">Free credits</div>
                      </td>
                      <td style="width:1px;background:rgba(34,163,90,.2);"></td>
                      <td style="text-align:center;padding:0 8px;">
                        <div style="font-size:1.6rem;font-weight:600;color:#4ec97a;">1</div>
                        <div style="font-size:.72rem;color:#2e5535;text-transform:uppercase;letter-spacing:.07em;margin-top:2px;">Credit per search</div>
                      </td>
                      <td style="width:1px;background:rgba(34,163,90,.2);"></td>
                      <td style="text-align:center;padding:0 8px;">
                        <div style="font-size:1.6rem;font-weight:600;color:#4ec97a;">∞</div>
                        <div style="font-size:.72rem;color:#2e5535;text-transform:uppercase;letter-spacing:.07em;margin-top:2px;">Nature's wisdom</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- What you can do -->
            <p style="margin:0 0 14px;color:#4a9960;font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;">What you can explore</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              ${[
                ["🌱", "Personalised food recommendations", "Based on exactly how you're feeling"],
                ["🍳", "Quick natural recipes", "Under 10 minutes, whole ingredients only"],
                ["💡", "Wellness tips", "Hyper-specific to your situation"],
                ["🗓️", "7-day preventive food plans", "Tailored to your concern"],
              ].map(([icon, title, desc]) => `
              <tr>
                <td style="padding:7px 0;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width:36px;font-size:18px;vertical-align:top;padding-top:2px;">${icon}</td>
                      <td>
                        <div style="color:#a8ddb5;font-size:.9rem;margin-bottom:2px;">${title}</div>
                        <div style="color:#3a6644;font-size:.8rem;">${desc}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`).join("")}
            </table>

            <!-- Tip -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,200,70,.04);border:1px solid rgba(255,200,70,.15);border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0 0 6px;color:#a09040;font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;">💡 Pro tip</p>
                  <p style="margin:0;color:#8a7a40;font-size:.88rem;line-height:1.7;">Head to your profile and set your <strong style="color:#a09040;">biological sex</strong> and any <strong style="color:#a09040;">food allergies</strong> — this makes every recommendation significantly more accurate for your body.</p>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="https://naturespantry.netlify.app" style="display:inline-block;background:linear-gradient(135deg,#22a35a,#1a7a44);border-radius:14px;padding:15px 40px;color:#e8f5eb;font-size:1rem;font-family:Georgia,serif;font-weight:600;text-decoration:none;letter-spacing:.02em;">
                    Start exploring →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(34,163,90,.08);text-align:center;">
            <p style="margin:0;color:#1e3d25;font-size:.75rem;line-height:1.7;">
              Nature's Pantry · Food-first wellness<br/>
              <span style="color:#142018;">Not medical advice. Always consult a healthcare professional.</span>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Nature's Pantry <welcome@naturespantry.app>",
        to: [email],
        subject: `Welcome to Nature's Pantry, ${firstName} 🌿`,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: data }) };
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, id: data.id }) };

  } catch (e) {
    console.error("Welcome function error:", e);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
