export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Use POST" }),
      };
    }

    const { task, energy = "medium", sensory = "medium" } = JSON.parse(event.body || "{}");

    if (!task || typeof task !== "string") {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "task is required (string)" }),
      };
    }

    const BASE_URL = process.env.TELUS_BASE_URL;
    const TOKEN = process.env.TELUS_ACCESS_TOKEN;
    const MODEL = process.env.TELUS_MODEL; // don't default to a fake model

    if (!BASE_URL || !TOKEN || !MODEL) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing TELUS env vars (BASE_URL, ACCESS_TOKEN, MODEL)" }),
      };
    }

    const system = `You are an accessibility-first assistant helping neurodivergent users.
Be gentle, non-judgmental, concrete, and low-pressure.
Return ONLY valid JSON.`;

    const user = `Task: "${task}"
Energy level: ${energy} (low/medium/high)
Sensory tolerance: ${sensory} (low/medium/high)

Create 6-9 steps. Each step must be small and actionable.
Include optional rest suggestion if energy is low and/or sensory is low.

Return JSON in this exact shape:
{
  "title": string,
  "steps": [{"title": string, "detail": string}],
  "restSuggestion": {"minutes": number, "reason": string} | null
}`;

    const resp = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.4,
        max_tokens: 700,
      }),
    });

    const text = await resp.text();

    if (!resp.ok) {
      return {
        statusCode: resp.status,
        headers: { "Content-Type": "application/json" },
        body: text,
      };
    }

    const data = JSON.parse(text);
    const raw = data?.choices?.[0]?.message?.content ?? "";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Model did not return valid JSON", raw }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Server error", details: String(err) }),
    };
  }
}
