// Generates a realistic stock-photo-style square icon for a plant,
// uploads it to the public `plant-icons` bucket, and returns its URL.
// Idempotent per slug — won't regenerate if the file already exists.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name } = await req.json();
    if (!name || typeof name !== "string") {
      return new Response(JSON.stringify({ error: "name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const slug = slugify(name);
    if (!slug) {
      return new Response(JSON.stringify({ error: "invalid name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const path = `${slug}.png`;
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/plant-icons/${path}`;

    // Skip generation if it already exists
    const head = await fetch(publicUrl, { method: "HEAD" });
    if (head.ok) {
      return new Response(JSON.stringify({ slug, image_url: publicUrl, cached: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate via Lovable AI image model
    const prompt = `A single realistic top-down stock photo of a fresh ${name} on a plain solid white background. Studio lighting, sharp focus, vibrant natural colors, square framing, no text, no watermark, no shadows, no other objects.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI image error", aiRes.status, t);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit on image generation. Try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Out of AI credits. Add funds in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI image error ${aiRes.status}`);
    }

    const data = await aiRes.json();
    const dataUrl: string | undefined =
      data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl?.startsWith("data:image/")) {
      throw new Error("AI did not return an image");
    }
    const b64 = dataUrl.split(",")[1] ?? "";
    const bytes = decodeBase64(b64);

    const { error: upErr } = await admin.storage
      .from("plant-icons")
      .upload(path, bytes, { contentType: "image/png", upsert: true });
    if (upErr) throw upErr;

    return new Response(JSON.stringify({ slug, image_url: publicUrl, cached: false }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-plant-icon error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});