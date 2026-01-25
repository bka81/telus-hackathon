export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Use POST" }),
      };
    }

    const body = JSON.parse(event.body || "{}");
    const { task, energy = "medium", sensory = "medium", category } = body;

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

    // Normalize category (optional but preferred)
    const catTitle = typeof category?.title === "string" ? category.title : "";
    const catSubtitle = typeof category?.subtitle === "string" ? category.subtitle : "";
    const catId = typeof category?.id === "string" ? category.id : "";

    const system = `You are an accessibility-first assistant helping neurodivergent users.
Be gentle, non-judgmental, concrete, and low-pressure.
Return ONLY valid JSON. No markdown. No code fences.`;

    const user = `Task brain dump: """${task}"""
Energy level: ${energy} (low/medium/high)
Sensory tolerance: ${sensory} (low/medium/high)

Selected category:
- id: ${catId || "(none)"}
- title: ${catTitle || "(none)"}
- subtitle: ${catSubtitle || "(none)"}

You must create steps ONLY for the selected category above.
Do NOT include steps that belong to other categories.
Create 6-9 steps. Each step must be small and actionable.
Each step detail must be 1 short sentence (max 20 words).
Include restSuggestion only if energy is low and/or sensory is low, otherwise null.

Return JSON in this exact shape, with NO extra keys:
{"title":string,"steps":[{"title":string,"detail":string}],"restSuggestion":{"minutes":number,"reason":string}|null}`;

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
        temperature: 0.3,
        max_tokens: 1400,
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
        body: JSON.stringify({
          error: "Model did not return valid JSON",
          raw,
        }),
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
