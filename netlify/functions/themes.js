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

    const system = "Return ONLY valid JSON. No markdown. No code fences. No extra commentary.";

    const user = `Brain dump: """${task}"""
Energy: ${energy} (low/medium/high)
Sensory: ${sensory} (low/medium/high)

Make EXACTLY 4 categories. Use each id exactly once:
focus_now, decisions, money_finance, digital_admin

Return exactly this shape:
{"headline":"Here are the main areas I heard.","subhead":"Pick one to start. We’ll take it step by step.","categories":[{"id":"focus_now|decisions|money_finance|digital_admin","title":"string","subtitle":"string","stepsCount":number}]}`;

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
        max_tokens: 1000,
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

    if (!parsed || !Array.isArray(parsed.categories) || parsed.categories.length !== 4) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Model did not return valid JSON", raw }),
      };
    }

    // Normalize and enforce stable order
    const order = ["focus_now", "decisions", "money_finance", "digital_admin"];
    const byId = new Map(parsed.categories.map((c) => [String(c.id), c]));
    const categories = order.map((id) => {
      const c = byId.get(id);
      return {
        id,
        title: String(c?.title ?? id.replace("_", " ")),
        subtitle: String(c?.subtitle ?? ""),
        stepsCount: Number.isFinite(c?.stepsCount) ? c.stepsCount : 6,
      };
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        headline: String(parsed.headline ?? "Here are the main areas I heard."),
        subhead: String(parsed.subhead ?? "Pick one to start. We’ll take it step by step."),
        categories,
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
