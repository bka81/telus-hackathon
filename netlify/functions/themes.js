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
    const MODEL = process.env.TELUS_MODEL;

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

    const user = `Brain dump: """${task}"""
Energy level: ${energy} (low/medium/high)
Sensory tolerance: ${sensory} (low/medium/high)

Cluster the brain dump into EXACTLY 4 categories based on underlying themes.
Each category must be calm, concrete, and human-friendly.
Avoid therapy language and avoid judgment.
Each category should have an estimated stepsCount from 3 to 10.

Return JSON in this exact shape:
{
  "headline": "Here are the main areas I heard.",
  "subhead": "Pick one to start. We’ll take it step by step.",
  "categories": [
    { "id": "string", "title": "string", "subtitle": "string", "stepsCount": number }
  ]
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
        max_tokens: 650,
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

    const cats = Array.isArray(parsed?.categories) ? parsed.categories.slice(0, 4) : [];
    if (cats.length !== 4) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Expected exactly 4 categories", parsed }),
      };
    }

    // Ensure each has required fields
    const normalized = cats.map((c, idx) => ({
      id: String(c?.id ?? `cat_${idx + 1}`),
      title: String(c?.title ?? `Category ${idx + 1}`),
      subtitle: String(c?.subtitle ?? ""),
      stepsCount: Number.isFinite(c?.stepsCount) ? c.stepsCount : 6,
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        headline: parsed?.headline ?? "Here are the main areas I heard.",
        subhead: parsed?.subhead ?? "Pick one to start. We’ll take it step by step.",
        categories: normalized,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Server error", details: String(err) }),
    };
  }
}
