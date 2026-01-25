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
    const { task, energy = "medium", sensory = "medium", stepsCount } = body;

    if (!task || typeof task !== "string") {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "task is required (string)" }),
      };
    }

    const desired = Number.isFinite(stepsCount) ? Math.max(3, Math.min(10, stepsCount)) : 7;

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
Return ONLY valid JSON. No markdown. No code fences.`;

    const user = `Task: "${task}"
Energy level: ${energy} (low/medium/high)
Sensory tolerance: ${sensory} (low/medium/high)

Create EXACTLY ${desired} steps.
Each step must be small and actionable.
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
      return { statusCode: resp.status, headers: { "Content-Type": "application/json" }, body: text };
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

    // Hard normalize count if model drifted
    const steps = Array.isArray(parsed?.steps) ? parsed.steps.slice(0, desired) : [];
    while (steps.length < desired) {
      steps.push({ title: `Step ${steps.length + 1}`, detail: "Take one small action." });
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: parsed?.title ?? "Steps",
        steps,
        restSuggestion: parsed?.restSuggestion ?? null,
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
