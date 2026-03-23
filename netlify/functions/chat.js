exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body);

    // Hard cap at 1800 tokens — keeps response under 9s on free plan
    const max_tokens = Math.min(Math.max(body.max_tokens || 1800, 300), 1800);

    // 9s internal timeout — stays within Netlify free plan 10s limit
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);

    let response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
        },
        body: JSON.stringify({
          model: body.model || "claude-haiku-4-5-20251001",
          max_tokens: max_tokens,
          system: body.system,
          messages: body.messages,
        }),
      });
    } finally {
      clearTimeout(timer);
    }

    const text = await response.text();

    return {
      statusCode: response.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: text,
    };
  } catch (e) {
    const isTimeout = e.name === "AbortError";
    return {
      statusCode: isTimeout ? 504 : 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        error: isTimeout ? "TIMEOUT" : e.message
      }),
    };
  }
};
