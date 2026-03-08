const Stripe = require('stripe');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const { priceId, email, tier } = JSON.parse(event.body);

    const session = await stripe.checkout.sessions.create({
      mode: priceId === 'price_1T8hNmCJF4DF72elItDLqZIp' ? 'payment' : 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      currency: 'gbp',
      metadata: { email, tier },
      success_url: 'https://foodnfitness.ai?payment=success',
      cancel_url: 'https://foodnfitness.ai?payment=cancelled',
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error('Stripe error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
