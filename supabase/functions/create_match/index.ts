import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createAdminClient, formatMatchTime, LEVEL_LABELS_EN, LEVEL_LABELS_SV, sendPushNotification } from "../_shared/push.ts";

function buildCorsHeaders(req: Request) {
  const acrh = req.headers.get("access-control-request-headers") ?? "";
  const requested = acrh.split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
  const required = ["authorization", "apikey", "content-type", "x-client-info"];
  const allowHeaders = Array.from(new Set([...requested, ...required])).join(", ");
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": allowHeaders,
  } as Record<string, string>;
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: jsonHeaders });
  }

  // --- AUTH ---
  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: jsonHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: jsonHeaders });
  }

  // --- BODY ---
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: jsonHeaders });
  }

  const starts_at = body.starts_at ?? body.startsAt ?? null;
  const level = body.level ?? null;
  const is_public = body.is_public ?? body.isPublic ?? true;
  const external_id = body.external_id ?? body.externalId ?? null;
  const pitch_id = body.pitch_id ?? body.pitchId ?? null;
  const title = body.title ?? null;
  const notes = body.notes ?? null;
  const format = body.format ?? null;
  const max_players_raw = body.max_players ?? body.maxPlayers ?? null;
  const is_spontaneous = body.is_spontaneous ?? body.isSpontaneous ?? false;
  const request_id = body.request_id ?? body.requestId ?? null;

  if (!starts_at || !level) {
    return new Response(JSON.stringify({ error: "Missing fields", expected: "starts_at, level, and one of: external_id OR pitch_id", got: Object.keys(body) }), { status: 400, headers: jsonHeaders });
  }

  if (!external_id && !pitch_id) {
    return new Response(JSON.stringify({ error: "Missing venue identifier", expected: "external_id or pitch_id", got: Object.keys(body) }), { status: 400, headers: jsonHeaders });
  }

  const startDate = new Date(starts_at);
  if (Number.isNaN(startDate.getTime())) {
    return new Response(JSON.stringify({ error: "Invalid starts_at" }), { status: 400, headers: jsonHeaders });
  }

  const now = Date.now();
  if (startDate.getTime() < now - 60_000) {
    return new Response(JSON.stringify({ error: "Cannot create match in the past" }), { status: 400, headers: jsonHeaders });
  }

  let max_players: number | null = null;
  if (max_players_raw !== null && max_players_raw !== undefined && max_players_raw !== "") {
    const n = Number(max_players_raw);
    if (!Number.isFinite(n) || n <= 0) {
      return new Response(JSON.stringify({ error: "Invalid max_players" }), { status: 400, headers: jsonHeaders });
    }
    max_players = Math.floor(n);
  }

  const isUuid = (v: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

  let venueQuery = supabase.from("venues").select("id, external_id, name, address, city, lat, lng");

  if (external_id) {
    venueQuery = venueQuery.eq("external_id", String(external_id));
  } else if (typeof pitch_id === "string" && isUuid(pitch_id)) {
    venueQuery = venueQuery.eq("id", pitch_id);
  } else {
    venueQuery = venueQuery.eq("external_id", String(pitch_id));
  }

  const { data: venue, error: venueErr } = await venueQuery.single();

  if (venueErr || !venue) {
    return new Response(JSON.stringify({ error: "Venue not found", external_id, pitch_id }), { status: 400, headers: jsonHeaders });
  }

  if (!venue.external_id || String(venue.external_id).trim() === "") {
    return new Response(JSON.stringify({ error: "Venue has no external_id — cannot create match" }), { status: 400, headers: jsonHeaders });
  }
  const resolvedPitchId = String(venue.external_id).trim();

  let existingMatch: any = null;
  if (request_id) {
    const { data: maybe, error: idemErr } = await supabase
      .from("matches")
      .select("id")
      // @ts-ignore
      .eq("request_id", request_id)
      .eq("created_by", user.id)
      .maybeSingle();
    if (!idemErr && maybe) existingMatch = maybe;
  }

  if (existingMatch?.id) {
    const { data: m2 } = await supabase
      .from("matches")
      .select("*, venue:venues(id, external_id, name, address, city, lat, lng)")
      .eq("id", existingMatch.id)
      .single();
    return new Response(JSON.stringify(m2), { status: 200, headers: jsonHeaders });
  }

  const insertPayload: any = {
    created_by: user.id,
    organizer_id: user.id,
    venue_id: venue.id,
    pitch_id: resolvedPitchId,
    starts_at,
    level,
    is_public,
    title,
    notes,
    format,
    max_players,
    is_spontaneous,
  };

  if (request_id) insertPayload.request_id = request_id;

  const { data: match, error: matchErr } = await supabase
    .from("matches")
    .insert(insertPayload)
    .select("*")
    .single();

  if (matchErr || !match) {
    return new Response(JSON.stringify({ error: matchErr?.message ?? "Failed to create match", details: matchErr?.details ?? null }), { status: 400, headers: jsonHeaders });
  }

  await supabase.from("match_players").upsert(
    { match_id: match.id, user_id: user.id, status: "joined", checked_in_at: null },
    { onConflict: "match_id,user_id" }
  );

  // ── MATCH_NEAR_YOU push (best-effort — must never block creation) ─────────
  // Users within ~3 km of the venue with a matching skill level, at most one
  // nearby-notification per user per hour (profiles.last_nearby_notified_at).
  try {
    if (is_public !== false && venue.lat != null && venue.lng != null) {
      const admin = createAdminClient();
      if (admin) {
        const RADIUS_KM = 3;
        const latDelta = RADIUS_KM / 111.32;
        const lngDelta = RADIUS_KM / (111.32 * Math.max(0.1, Math.cos((venue.lat * Math.PI) / 180)));

        // Bounding-box prefilter in SQL, exact haversine below
        const { data: candidates } = await admin
          .from("profiles")
          .select("id, last_latitude, last_longitude, last_nearby_notified_at")
          .eq("skill_level", level)
          .neq("id", user.id)
          .gte("last_latitude", venue.lat - latDelta)
          .lte("last_latitude", venue.lat + latDelta)
          .gte("last_longitude", venue.lng - lngDelta)
          .lte("last_longitude", venue.lng + lngDelta)
          .limit(500);

        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        const toRad = (d: number) => (d * Math.PI) / 180;
        const distanceKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
          const dLat = toRad(lat2 - lat1);
          const dLng = toRad(lng2 - lng1);
          const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
          return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        const nearbyIds = (candidates ?? [])
          .filter((p: any) =>
            p.last_latitude != null && p.last_longitude != null &&
            distanceKm(venue.lat, venue.lng, p.last_latitude, p.last_longitude) <= RADIUS_KM &&
            (!p.last_nearby_notified_at || new Date(p.last_nearby_notified_at).getTime() < oneHourAgo)
          )
          .slice(0, 200)
          .map((p: any) => p.id);

        if (nearbyIds.length > 0) {
          const when = formatMatchTime(starts_at);
          const venueLabel = venue.name ?? "Ny match";

          await sendPushNotification(
            nearbyIds,
            { sv: "⚽ Ny match nära dig", en: "⚽ New match near you" },
            {
              sv: `${venueLabel} – ${LEVEL_LABELS_SV[level] ?? level} · ${when}`,
              en: `${venue.name ?? "New match"} – ${LEVEL_LABELS_EN[level] ?? level} · ${when}`,
            },
            { type: "MATCH_NEAR_YOU", match_id: match.id, venue_id: venue.id },
            admin,
          );

          await admin
            .from("profiles")
            .update({ last_nearby_notified_at: new Date().toISOString() })
            .in("id", nearbyIds);
        }
      }
    }
  } catch (notifyErr) {
    console.error("[create_match] MATCH_NEAR_YOU push failed:", notifyErr);
  }

  return new Response(JSON.stringify({ ...match, venue }), { status: 200, headers: jsonHeaders });
});
