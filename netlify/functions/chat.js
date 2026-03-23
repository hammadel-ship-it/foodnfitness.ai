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

    // Allow up to 6000 tokens — needed for 4 pillars x 4 items x 5 fields + recipes
    const max_tokens = Math.min(Math.max(body.max_tokens || 2000, 500), 6000);

    // Race against 24s timeout (Netlify limit is 26s)
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 24000);

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
          model: body.model || "claude-sonnet-4-20250514",
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
        error: isTimeout ? "Request timed out - please try again" : e.message
      }),
    };
  }
};
