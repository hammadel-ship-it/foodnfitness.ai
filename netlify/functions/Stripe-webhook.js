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

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const email = session.customer_email || session.metadata?.email;
    const priceId = session.metadata?.priceId;

    // Get price ID from line items if not in metadata
    let resolvedPriceId = priceId;
    if (!resolvedPriceId) {
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        resolvedPriceId = lineItems.data[0]?.price?.id;
      } catch(e) {
        console.error('Could not get line items:', e);
      }
    }

    const credits = CREDITS_MAP[resolvedPriceId] || 10;
    const tier = TIER_MAP[resolvedPriceId] || 'starter';

    if (email) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, credits')
        .eq('email', email)
        .single();

      if (profile) {
        const newCredits = tier === 'optimise' ? 9999 : (profile.credits || 0) + credits;
        await supabase
          .from('profiles')
          .update({ credits: newCredits, tier })
          .eq('id', profile.id);
        console.log(`Credited ${credits} to ${email}, tier: ${tier}`);
      } else {
        console.error('No profile found for email:', email);
      }
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
