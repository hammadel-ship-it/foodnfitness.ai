export default async (request, context) => {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (request.method === "OPTIONS") {
    return new Response("", { headers: CORS });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON: " + e.message }), {
      status: 400, headers: { ...CORS, "Content-Type": "application/json" }
    });
  }

  const apiKey = Netlify.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing API key" }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" }
    });
  }

  const max_tokens = Math.min(body.max_tokens || 1800, 2000);

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        model: body.model || "claude-haiku-4-5-20251001",
        max_tokens,
        system: body.system,
        messages: body.messages,
      }),
    });

    const responseBody = await upstream.text();

    return new Response(responseBody, {
      status: upstream.status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Upstream error: " + e.message }), {
      status: 502, headers: { ...CORS, "Content-Type": "application/json" }
    });
  }
};

export const config = { path: "/.netlify/functions/chat" };
