// Streaming AI garden assistant. Uses Lovable AI with tool-calling so the model
// can return structured plant suggestions and placement proposals.
//
// The assistant is restricted to the curated `plant_catalog` table — it cannot
// invent new plants. The full catalog is loaded at the start of each request
// and injected into the system prompt; `suggest_plants` then takes a list of
// catalog `slugs` and returns the matching rows verbatim.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type ChatMsg = { role: "system" | "user" | "assistant" | "tool"; content: string; tool_call_id?: string; name?: string };

const TOOLS = [
  {
    type: "function",
    function: {
      name: "suggest_plants",
      description:
        "Recommend plants from the curated CATALOG. Pass 3-6 slugs that already exist in the CATALOG list (system prompt). Returns the full plant cards with images. Always call this when the user wants ideas, asks 'what should I grow', or names a category like 'herbs' or 'vegetables'. NEVER invent slugs — only use values from the CATALOG.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Free-text query, e.g. 'leafy greens for shade' or 'tomato'",
          },
          slugs: {
            type: "array",
            description: "3-6 plant slugs from the CATALOG (e.g. 'tomato', 'basil', 'snap-pea'). Must match exactly.",
            items: { type: "string" },
            minItems: 1,
            maxItems: 6,
          },
        },
        required: ["query", "slugs"],
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
- You may ONLY recommend plants from the CATALOG below. Never invent plants, never use slugs that aren't in the CATALOG.
- When the user wants ideas or names a plant/category, ALWAYS call the \`suggest_plants\` tool with 3-6 slugs from the CATALOG. Don't list plants in plain text.
- If the catalog has nothing relevant for the user's request, say so plainly in 1 sentence — do NOT make up plants.
- When the user wants you to actually plant something, call \`propose_placement\` using the bed information from the GARDEN CONTEXT. Pick coordinates only from the listed FREE cells. Never overlap existing plants.
- Keep chat replies short (1-3 sentences). The plant cards / placement proposals do most of the talking.
- Use the user's language (English, Dutch, etc.).`;

const COORDINATE_RULES = `

COORDINATES (CRITICAL):
- The UI shows positions to users as "row R, col C" (1-indexed, row first).
- When the user writes a pair like "(2, 3)", "2,3", "row 2 col 3", or "place at 2 3", they mean row=2, col=3 (1-indexed).
- The \`propose_placement\` tool expects ZERO-indexed coordinates as separate fields x (column) and y (row).
- Conversion: user "row R, col C" (1-indexed) → x = C - 1, y = R - 1.
- Example: user says "place a tomato at (2, 3)" → that means row 2, col 3 → emit { x: 2, y: 1 }.
- Never swap x and y. Never treat the first number the user gives as a column.
- The GARDEN CONTEXT \`free\` and \`occupied\` arrays already use zero-indexed { x, y } — do NOT shift them.`;

const FULL_SYSTEM_PROMPT = SYSTEM_PROMPT + COORDINATE_RULES;

type CatalogRow = {
  slug: string;
  common_name: string;
  scientific_name: string | null;
  category: string;
  season: string[];
  harvest_season: string[];
  spacing: number;
  sun: string | null;
  water: string | null;
  description: string | null;
  image_url: string | null;
  days_to_harvest_min: number | null;
  days_to_harvest_max: number | null;
  planting_depth_cm: number | null;
  companions: string[];
  avoid: string[];
};

async function loadCatalog(
  admin: ReturnType<typeof createClient>
): Promise<CatalogRow[]> {
  const { data, error } = await admin
    .from("plant_catalog")
    .select(
      "slug, common_name, scientific_name, category, season, harvest_season, spacing, sun, water, description, image_url, days_to_harvest_min, days_to_harvest_max, planting_depth_cm, companions, avoid"
    )
    .order("common_name");
  if (error) {
    console.error("loadCatalog error", error);
    return [];
  }
  return (data ?? []) as CatalogRow[];
}

function summarizeCatalog(catalog: CatalogRow[]): string {
  // Compact one-line summary per plant so the model can pick by slug.
  return catalog
    .map(
      (p) =>
        `- ${p.slug} | ${p.common_name} (${p.category}) — sun:${p.sun ?? "?"}, water:${p.water ?? "?"}, season:${(p.season ?? []).join("/") || "?"}, spacing:${p.spacing}`
    )
    .join("\n");
}

function handleSuggestPlants(
  catalog: CatalogRow[],
  args: { query?: string; slugs?: unknown }
) {
  const wanted = Array.isArray(args.slugs)
    ? (args.slugs as unknown[]).filter((s): s is string => typeof s === "string").slice(0, 6)
    : [];
  const bySlug = new Map(catalog.map((p) => [p.slug, p]));
  const plants = wanted
    .map((slug) => bySlug.get(slug))
    .filter((p): p is CatalogRow => !!p);
  return {
    query: typeof args.query === "string" ? args.query : "",
    plants,
    rejected: wanted.filter((slug) => !bySlug.has(slug)),
  };
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

    const catalog = await loadCatalog(admin);
    const catalogBlock = catalog.length
      ? `\n\nCATALOG (the only plants you may recommend — refer to them by slug):\n${summarizeCatalog(catalog)}`
      : "\n\nCATALOG: (empty — tell the user no plants are available yet)";

    const contextMsg: ChatMsg = {
      role: "system",
      content:
        FULL_SYSTEM_PROMPT +
        catalogBlock +
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
          result = handleSuggestPlants(catalog, parsed);
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