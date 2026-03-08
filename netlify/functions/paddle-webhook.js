const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // server-side key — never expose this in frontend
);

const CREDITS_MAP = {
  "pri_01kk5jxb04fcqhwgbj1t67wex2": 10,   // Starter
  "pri_01kk5jzhbwje0qmgjwk76xkq9w": 40,   // Thrive
  "pri_01kk5k0qn95abpkvd2nvww5he2": 9999, // Optimise
};

// Verify Paddle webhook signature
function verifySignature(rawBody, signature, secret) {
  try {
    const [tsPart, h1Part] = signature.split(";");
    const ts = tsPart.replace("ts=", "");
    const h1 = h1Part.replace("h1=", "");
    const signed = ts + ":" + rawBody;
    const expected = crypto.createHmac("sha256", secret).update(signed).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(h1, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const signature = event.headers["paddle-signature"];
  const secret    = process.env.PADDLE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return { statusCode: 400, body: "Missing signature or secret" };
  }

  if (!verifySignature(event.body, signature, secret)) {
    console.error("Paddle webhook: invalid signature");
    return { statusCode: 401, body: "Invalid signature" };
  }

  let payload;
  try { payload = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: "Invalid JSON" }; }

  const eventType = payload?.event_type;

  // Only process completed transactions
  if (eventType !== "transaction.completed") {
    return { statusCode: 200, body: "Ignored event: " + eventType };
  }

  const transaction = payload.data;
  const customerEmail = transaction?.customer?.email;
  const priceId       = transaction?.items?.[0]?.price?.id;
  const customData    = transaction?.custom_data || {};

  if (!customerEmail || !priceId) {
    console.error("Paddle webhook: missing email or priceId", { customerEmail, priceId });
    return { statusCode: 400, body: "Missing email or priceId" };
  }

  const creditsToAdd = CREDITS_MAP[priceId];
  if (!creditsToAdd) {
    console.error("Paddle webhook: unknown priceId", priceId);
    return { statusCode: 400, body: "Unknown priceId: " + priceId };
  }

  const tierName = priceId === "pri_01kk5jxb04fcqhwgbj1t67wex2" ? "Starter"
                 : priceId === "pri_01kk5jzhbwje0qmgjwk76xkq9w"   ? "Thrive"
                 : "Optimise";

  // Look up user by email in profiles table
  const { data: profile, error: fetchErr } = await supabase
    .from("profiles")
    .select("id, credits")
    .eq("email", customerEmail)
    .single();

  if (fetchErr || !profile) {
    console.error("Paddle webhook: user not found", customerEmail, fetchErr);
    return { statusCode: 404, body: "User not found: " + customerEmail };
  }

  const newCredits = (profile.credits ?? 0) + (creditsToAdd === 9999 ? 9999 : creditsToAdd);

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({
      credits:     newCredits,
      tier:        tierName,
      updated_at:  new Date().toISOString(),
    })
    .eq("id", profile.id);

  if (updateErr) {
    console.error("Paddle webhook: failed to update credits", updateErr);
    return { statusCode: 500, body: "Failed to update credits" };
  }

  console.log(`Paddle webhook: credited ${creditsToAdd} to ${customerEmail} (${tierName}). New total: ${newCredits}`);
  return { statusCode: 200, body: "OK" };
};
