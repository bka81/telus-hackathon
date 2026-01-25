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

    const system =
      "Return ONLY valid JSON. No markdown. No code fences. No extra text. No trailing commas.";

    const iconKeys =
      "checklist,bulb,home,bed,heart,plant,mail,calendar,dumbbell,food,bags,briefcase,target,decisions,money,computers,connection,study,misc";

    const user = `Brain dump: """${task}"""
Energy: ${energy} (low/medium/high)
Sensory: ${sensory} (low/medium/high)

Make EXACTLY 4 calm categories. Each category needs:
- id: a short stable slug (letters/numbers/underscores)
- title: 2–4 words
- subtitle: <= 8 words
- stepsCount: an integer 3–10 (realistic)
- iconKey: choose ONE from: ${iconKeys}

Return exactly:
{
  "headline":"Here are the main areas I heard.",
  "subhead":"Pick one to start. We’ll take it step by step.",
  "categories":[
    {"id":"string","title":"string","subtitle":"string","stepsCount":number,"iconKey":"${iconKeys}"}
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
        temperature: 0.2,
        max_tokens: 1100,
      }),
    });

    const text = await resp.text();
    if (!resp.ok) {
      return { statusCode: resp.status, headers: { "Content-Type": "application/json" }, body: text };
    }

    const outer = safeJsonParse(text);
    const raw = outer?.choices?.[0]?.message?.content ?? "";
    const parsed = safeJsonParse(raw) || extractFirstJsonObject(raw);

    if (!parsed || !Array.isArray(parsed.categories) || parsed.categories.length !== 4) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Model did not return valid JSON", raw }),
      };
    }

    const allowed = new Set(iconKeys.split(","));

    const normalized = parsed.categories.map((c, idx) => ({
      id: String(c?.id ?? `cat_${idx + 1}`).replace(/[^a-zA-Z0-9_]/g, "_"),
      title: String(c?.title ?? `Category ${idx + 1}`),
      subtitle: String(c?.subtitle ?? ""),
      stepsCount: Number.isFinite(c?.stepsCount) ? Math.max(3, Math.min(10, c.stepsCount)) : 6,
      iconKey: allowed.has(String(c?.iconKey)) ? String(c.iconKey) : "misc",
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        headline: String(parsed.headline ?? "Here are the main areas I heard."),
        subhead: String(parsed.subhead ?? "Pick one to start. We’ll take it step by step."),
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
