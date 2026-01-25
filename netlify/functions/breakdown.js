function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function extractFirstJsonObject(text) {
  if (typeof text !== "string") return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return safeJsonParse(text.slice(start, end + 1));
}

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
    const { task, energy = "medium", sensory = "medium", category, stepsCount } = body;

    if (!task || typeof task !== "string" || !category?.title || !category?.id) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing task or category (id/title required)." }),
      };
    }

    // Clamp step count (and prefer the one passed from themes)
    const n = Math.max(3, Math.min(10, Number(stepsCount) || 4));

    // Use same provider config as themes.js for consistency
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

    const system =
      "Return ONLY valid JSON. No markdown. No code fences. No extra text. No trailing commas.";

    const user = `Task: """${task}"""
Energy: ${energy} (low/medium/high)
Sensory: ${sensory} (low/medium/high)

Selected category (ONLY generate steps for this):
- id: ${category.id}
- title: ${category.title}
- subtitle: ${category.subtitle || ""}
- iconKey: ${category.iconKey || ""}

Return JSON in EXACTLY this schema:
{
  "title": "string (short title for THIS category plan only)",
  "restSuggestion": "string or null",
  "steps": [
    { "title": "string", "detail": "string" }
  ]
}

Rules you must follow:
- steps MUST be exactly ${n} items
- every step MUST be ONLY about "${category.title}"
- do NOT include other categories, other titles, or any extra arrays/keys
- step titles should be short, concrete actions
`;

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
        temperature: 0.2,
        max_tokens: 900,
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

    const outer = safeJsonParse(text);
    const raw = outer?.choices?.[0]?.message?.content ?? "";

    const parsed = safeJsonParse(raw) || extractFirstJsonObject(raw);
    if (!parsed || typeof parsed !== "object") {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Model did not return valid JSON", raw }),
      };
    }

    const steps = Array.isArray(parsed.steps) ? parsed.steps : [];
    if (steps.length !== n) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: `Steps count mismatch. Expected ${n}, got ${steps.length}.`,
          raw: parsed,
        }),
      };
    }

    // Normalize output
    const normalized = {
      title: String(parsed.title || category.title),
      restSuggestion: parsed.restSuggestion == null ? null : String(parsed.restSuggestion),
      steps: steps.map((s, i) => ({
        title: String(s?.title ?? `Step ${i + 1}`),
        detail: String(s?.detail ?? ""),
      })),
    };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalized),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Internal error", message: String(e?.message || e) }),
    };
  }
}
