const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CREDITS_MAP = {
  'price_1T8hNmCJF4DF72elItDLqZIp': 10,
  'price_1T8hOyCJF4DF72elWJQpeY94': 40,
  'price_1T8hPUCJF4DF72el0FctAFJv': 9999,
};

const TIER_MAP = {
  'price_1T8hNmCJF4DF72elItDLqZIp': 'starter',
  'price_1T8hOyCJF4DF72elWJQpeY94': 'thrive',
  'price_1T8hPUCJF4DF72el0FctAFJv': 'optimise',
};

async function creditUser(email, priceId) {
  const credits = CREDITS_MAP[priceId] || 10;
  const tier = TIER_MAP[priceId] || 'starter';

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, credits')
    .eq('email', email)
    .single();

  if (!profile) { console.error('No profile for:', email); return; }

  // For renewals: reset to plan credits. For upgrades: set new tier credits.
  const newCredits = tier === 'optimise' ? 9999 : credits;
  await supabase
    .from('profiles')
    .update({ credits: newCredits, tier })
    .eq('id', profile.id);

  console.log(`Credited ${newCredits} to ${email}, tier: ${tier}`);
}

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // ── Initial purchase ──────────────────────────────────────────
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const email = session.customer_email || session.metadata?.email;

    let priceId;
    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      priceId = lineItems.data[0]?.price?.id;
    } catch(e) { console.error('Line items error:', e); }

    if (email && priceId) await creditUser(email, priceId);
  }

  // ── Monthly renewal ───────────────────────────────────────────
  if (stripeEvent.type === 'invoice.payment_succeeded') {
    const invoice = stripeEvent.data.object;
    // Only process subscription renewals, not the first invoice (handled above)
    if (invoice.billing_reason === 'subscription_cycle') {
      const email = invoice.customer_email;
      const priceId = invoice.lines?.data[0]?.price?.id;
      if (email && priceId) await creditUser(email, priceId);
    }
  }

  // ── Subscription cancelled ────────────────────────────────────
  if (stripeEvent.type === 'customer.subscription.deleted') {
    const subscription = stripeEvent.data.object;
    const customer = await stripe.customers.retrieve(subscription.customer);
    const email = customer.email;
    if (email) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
      if (profile) {
        await supabase
          .from('profiles')
          .update({ tier: 'free' })
          .eq('id', profile.id);
        console.log(`Subscription cancelled for ${email}, tier set to free`);
      }
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
