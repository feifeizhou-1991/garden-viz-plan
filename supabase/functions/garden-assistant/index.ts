// Streaming AI garden assistant. Uses Lovable AI with tool-calling so the model
// can return structured plant suggestions and placement proposals.
// Tools are executed server-side: the function looks up the plant_catalog,
// calls generate-plant-icon for unknown plants, and inserts new rows.
// The user's frontend renders the tool outputs as chat-attached widgets.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type ChatMsg = { role: "system" | "user" | "assistant" | "tool"; content: string; tool_call_id?: string; name?: string };

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

const TOOLS = [
  {
    type: "function",
    function: {
      name: "suggest_plants",
      description:
        "Search the plant catalog for plants matching a query. Returns up to 6 plant cards with images. Always call this when the user is looking for plant ideas, asks 'what should I grow', or names a category like 'herbs' or 'vegetables'. Only return real, plantable garden plants — no people, songs, or unrelated items.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Free-text query, e.g. 'leafy greens for shade' or 'tomato'",
          },
          plants: {
            type: "array",
            description:
              "List of 3-6 specific plants to suggest. The server will look these up or create them.",
            items: {
              type: "object",
              properties: {
                common_name: { type: "string", description: "e.g. Tomato, Basil, Sunflower" },
                scientific_name: { type: "string" },
                category: {
                  type: "string",
                  enum: ["vegetable", "herb", "fruit", "flower", "tree", "other"],
                },
                season: {
                  type: "array",
                  items: { type: "string", enum: ["Spring", "Summer", "Fall", "Winter"] },
                },
                spacing: { type: "integer", minimum: 1, maximum: 4, description: "Cells the plant occupies, 1-4." },
                description: { type: "string", description: "1-2 sentence growing tip." },
                days_to_harvest_min: { type: "integer", description: "Typical minimum days from planting to first harvest." },
                days_to_harvest_max: { type: "integer", description: "Typical maximum days from planting to first harvest." },
                harvest_season: {
                  type: "array",
                  items: { type: "string", enum: ["Spring", "Summer", "Fall", "Winter"] },
                  description: "Seasons in which this plant is typically harvested.",
                },
                sun: { type: "string", enum: ["Full sun", "Partial shade", "Shade"] },
                water: { type: "string", enum: ["Low", "Medium", "High"] },
                planting_depth_cm: { type: "number", description: "Recommended planting depth in cm." },
                companions: { type: "array", items: { type: "string" }, description: "Common companion plants." },
                avoid: { type: "array", items: { type: "string" }, description: "Plants to avoid planting nearby." },
              },
              required: ["common_name", "category", "season", "spacing"],
            },
          },
        },
        required: ["query", "plants"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_placement",
      description:
        "Propose placing specific plants in a specific bed. Do NOT actually place them — the user must confirm in the UI. Use the bed dimensions and the list of free cells provided in the system prompt to pick coordinates.",
      parameters: {
        type: "object",
        properties: {
          bed_id: { type: "string", description: "The bed.id from the garden context." },
          rationale: { type: "string", description: "One short sentence explaining why these placements." },
          placements: {
            type: "array",
            items: {
              type: "object",
              properties: {
                plant_slug: { type: "string", description: "Slug of a plant previously returned by suggest_plants." },
                common_name: { type: "string" },
                x: { type: "integer" },
                y: { type: "integer" },
              },
              required: ["plant_slug", "common_name", "x", "y"],
            },
          },
        },
        required: ["bed_id", "placements"],
      },
    },
  },
] as const;

const SYSTEM_PROMPT = `You are a friendly, expert community-garden assistant. You help users plan a real vegetable/herb/fruit/flower garden by suggesting plants and proposing where to place them.

RULES:
- Only ever discuss real, plantable garden plants. Refuse politely if asked about non-garden topics.
- When the user wants ideas or names a plant/category, ALWAYS call the \`suggest_plants\` tool with 3-6 specific real plants. Don't list plants in plain text.
- When the user wants you to actually plant something, call \`propose_placement\` using the bed information from the GARDEN CONTEXT below. Pick coordinates only from the listed FREE cells. Never overlap existing plants.
- Keep chat replies short (1-3 sentences). The plant cards / placement proposals do most of the talking.
- Use the user's language (English, Dutch, etc.).
- Never invent fake plants. If you're not sure something is a real garden plant, don't include it.`;

// When suggesting plants, ALWAYS include realistic growing details:
// days_to_harvest_min/max, harvest_season, sun, water, planting_depth_cm,
// companions (2-4), avoid (0-2). Use temperate-climate norms when uncertain.

async function handleSuggestPlants(
  admin: ReturnType<typeof createClient>,
  supabaseUrl: string,
  args: { query: string; plants: Array<{
    common_name: string;
    scientific_name?: string;
    category: string;
    season: string[];
    spacing: number;
    description?: string;
    days_to_harvest_min?: number;
    days_to_harvest_max?: number;
    harvest_season?: string[];
    sun?: string;
    water?: string;
    planting_depth_cm?: number;
    companions?: string[];
    avoid?: string[];
  }> }
) {
  const results: Array<{
    slug: string;
    common_name: string;
    scientific_name: string | null;
    category: string;
    season: string[];
    spacing: number;
    description: string | null;
    image_url: string | null;
  }> = [];

  for (const p of args.plants.slice(0, 6)) {
    const slug = slugify(p.common_name);
    if (!slug) continue;

    // Try existing
    const { data: existing } = await admin
      .from("plant_catalog")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (existing && existing.image_url) {
      results.push(existing as any);
      continue;
    }

    // Generate icon (or reuse cached file)
    let imageUrl: string | null = null;
    try {
      const iconRes = await fetch(`${supabaseUrl}/functions/v1/generate-plant-icon`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ name: p.common_name }),
      });
      if (iconRes.ok) {
        const j = await iconRes.json();
        imageUrl = j.image_url ?? null;
      } else {
        console.error("icon gen failed", await iconRes.text());
      }
    } catch (e) {
      console.error("icon fetch error", e);
    }

    const row = {
      slug,
      common_name: p.common_name,
      scientific_name: p.scientific_name ?? null,
      category: p.category,
      season: p.season ?? [],
      spacing: Math.min(Math.max(p.spacing ?? 1, 1), 4),
      description: p.description ?? null,
      image_url: imageUrl,
      days_to_harvest_min: p.days_to_harvest_min ?? null,
      days_to_harvest_max: p.days_to_harvest_max ?? null,
      harvest_season: p.harvest_season ?? [],
      sun: p.sun ?? null,
      water: p.water ?? null,
      planting_depth_cm: p.planting_depth_cm ?? null,
      companions: p.companions ?? [],
      avoid: p.avoid ?? [],
    };

    const { data: upserted } = await admin
      .from("plant_catalog")
      .upsert(row, { onConflict: "slug" })
      .select("*")
      .maybeSingle();

    results.push((upserted ?? row) as any);
  }

  return { plants: results };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, garden_context } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const contextMsg: ChatMsg = {
      role: "system",
      content:
        SYSTEM_PROMPT +
        (garden_context
          ? `\n\nGARDEN CONTEXT:\n${JSON.stringify(garden_context).slice(0, 4000)}`
          : ""),
    };

    // Up to 3 tool-calling rounds, then final streamed reply
    let convo: ChatMsg[] = [contextMsg, ...messages];
    const toolOutputs: Record<string, unknown> = {};

    for (let round = 0; round < 3; round++) {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: convo,
          tools: TOOLS,
          stream: false,
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit, try again in a moment." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (res.status === 402) {
          return new Response(JSON.stringify({ error: "Out of AI credits. Add funds in Settings → Workspace → Usage." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      const choice = data.choices?.[0];
      const message = choice?.message;
      const toolCalls = message?.tool_calls as
        | Array<{ id: string; function: { name: string; arguments: string } }>
        | undefined;

      if (!toolCalls || toolCalls.length === 0) {
        // Final assistant reply — return text + accumulated widget outputs
        return new Response(
          JSON.stringify({
            reply: message?.content ?? "",
            widgets: toolOutputs,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      // Execute each tool call
      convo.push({
        role: "assistant",
        content: message?.content ?? "",
        // @ts-ignore extra fields
        tool_calls: toolCalls,
      } as any);

      for (const tc of toolCalls) {
        let parsed: any = {};
        try { parsed = JSON.parse(tc.function.arguments || "{}"); } catch { parsed = {}; }

        let result: unknown = { ok: true };
        if (tc.function.name === "suggest_plants") {
          result = await handleSuggestPlants(admin, SUPABASE_URL, parsed);
          toolOutputs[`suggest_plants:${tc.id}`] = result;
        } else if (tc.function.name === "propose_placement") {
          // Server-side validation: ensure no overlap with occupied cells
          const beds = (garden_context?.beds ?? []) as Array<{
            id: string;
            width: number;
            height: number;
            occupied: Array<{ x: number; y: number }>;
          }>;
          const bed = beds.find((b) => b.id === parsed.bed_id);
          const placements = Array.isArray(parsed.placements) ? parsed.placements : [];
          const validated = bed
            ? placements.filter((p: any) =>
                Number.isInteger(p.x) &&
                Number.isInteger(p.y) &&
                p.x >= 0 && p.x < bed.width &&
                p.y >= 0 && p.y < bed.height &&
                !bed.occupied.some((o) => o.x === p.x && o.y === p.y)
              )
            : [];
          result = {
            bed_id: parsed.bed_id,
            rationale: parsed.rationale ?? "",
            placements: validated,
            rejected: placements.length - validated.length,
          };
          toolOutputs[`propose_placement:${tc.id}`] = result;
        }

        convo.push({
          role: "tool",
          tool_call_id: tc.id,
          name: tc.function.name,
          content: JSON.stringify(result),
        });
      }
    }

    return new Response(
      JSON.stringify({
        reply: "I tried a few things but couldn't finish — could you rephrase?",
        widgets: toolOutputs,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e) {
    console.error("garden-assistant error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});