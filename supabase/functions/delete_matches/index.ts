import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createAdminClient, sendPushNotification } from "../_shared/push.ts";

function buildCorsHeaders(req: Request) {
  const acrh = req.headers.get("access-control-request-headers") ?? "";
  const requested = acrh.split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
  const required = ["authorization", "apikey", "content-type", "x-client-info"];
  const allowHeaders = Array.from(new Set([...requested, ...required])).join(", ");
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": allowHeaders,
    "Access-Control-Max-Age": "86400",
  } as Record<string, string>;
}

function json(cors: Record<string, string>, status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);

  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: cors });

  const method = req.method.toUpperCase();
  if (method !== "POST" && method !== "DELETE") {
    return json(cors, 405, { error: "Method not allowed", got: method });
  }

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!url || !anonKey) return json(cors, 500, { error: "Missing env" });

  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return json(cors, 401, { error: "Not authenticated" });
  }

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return json(cors, 401, { error: "Invalid/expired token" });
  }

  let body: any = null;
  try {
    if (req.headers.get("content-length") === "0" || req.body == null) {
      body = {};
    } else {
      body = await req.json();
    }
  } catch {
    return json(cors, 400, { error: "Invalid JSON body" });
  }

  const matchId =
    body.match_id ??
    body.matchId ??
    body.id ??
    new URL(req.url).searchParams.get("match_id");

  if (!matchId) {
    return json(cors, 400, { error: "Missing match_id" });
  }

  const { data: match, error: matchErr } = await supabase
    .from("matches")
    .select("id, organizer_id, created_by")
    .eq("id", matchId)
    .maybeSingle();

  if (matchErr) {
    return json(cors, 403, { error: "Forbidden or match not accessible", details: matchErr.message });
  }

  if (!match) {
    return json(cors, 404, { error: "Match not found" });
  }

  const organizerId = match.organizer_id ?? match.created_by ?? null;
  if (organizerId !== user.id) {
    return json(cors, 403, { error: "Forbidden: only organizer can delete this match" });
  }

  // Read-only capture for the MATCH_CANCELLED push below — the player rows
  // are gone after the deletes, so we must snapshot recipients first.
  let cancelNotify: { playerIds: string[]; venueName: string } | null = null;
  try {
    const admin = createAdminClient();
    if (admin) {
      const [playersRes, matchInfoRes] = await Promise.all([
        admin
          .from("match_players")
          .select("user_id")
          .eq("match_id", matchId)
          .in("status", ["joined", "checked_in"]),
        admin.from("matches").select("title, venue:venues(name)").eq("id", matchId).maybeSingle(),
      ]);
      const playerIds = (playersRes.data ?? [])
        .map((p: any) => p.user_id)
        .filter((id: string) => id && id !== user.id);
      const info: any = matchInfoRes.data;
      const venueName = info?.venue?.name ?? info?.title ?? "din match";
      if (playerIds.length > 0) cancelNotify = { playerIds, venueName };
    }
  } catch (captureErr) {
    console.error("[delete_matches] cancel-notify capture failed:", captureErr);
  }

  const deletes = await Promise.all([
    supabase.from("match_players").delete().eq("match_id", matchId),
    supabase.from("cup_matches").delete().eq("match_id", matchId),
    supabase.from("match_results").delete().eq("match_id", matchId),
    supabase.from("match_ratings").delete().eq("match_id", matchId),
  ]);

  const childErr = deletes.find((r) => r.error)?.error;
  if (childErr) {
    return json(cors, 400, { error: "Failed to delete match relations", details: childErr.message });
  }

  const { error: delErr } = await supabase.from("matches").delete().eq("id", matchId);

  if (delErr) {
    return json(cors, 400, { error: "Failed to delete match", details: delErr.message });
  }

  // ── MATCH_CANCELLED push (best-effort — the delete already succeeded) ─────
  if (cancelNotify) {
    try {
      await sendPushNotification(
        cancelNotify.playerIds,
        { sv: "❌ Match inställd", en: "❌ Match cancelled" },
        {
          sv: `Matchen på ${cancelNotify.venueName} har ställts in`,
          en: `The match at ${cancelNotify.venueName} has been cancelled`,
        },
        { type: "MATCH_CANCELLED", match_id: matchId },
      );
    } catch (notifyErr) {
      console.error("[delete_matches] MATCH_CANCELLED push failed:", notifyErr);
    }
  }

  return json(cors, 200, { ok: true, match_id: matchId });
});
