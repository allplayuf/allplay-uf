import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createAdminClient, sendPushNotification } from "../_shared/push.ts";

function buildCorsHeaders(req: Request) {
  const acrh = req.headers.get("access-control-request-headers") ?? "";
  const requested = acrh.split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
  const required = ["authorization", "apikey", "content-type", "x-client-info"];
  const allowHeaders = Array.from(new Set([...requested, ...required])).join(", ");
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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
  if (req.method !== "POST") return json(cors, 405, { error: "Method not allowed" });

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
  if (userErr || !user) return json(cors, 401, { error: "Invalid/expired token" });

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return json(cors, 400, { error: "Invalid JSON body" });
  }

  const matchId = body.match_id ?? body.matchId ?? body.id ?? null;
  if (!matchId) return json(cors, 400, { error: "Missing match_id" });

  const { data: match, error: matchErr } = await supabase
    .from("matches")
    .select("id, max_players, is_spontaneous")
    .eq("id", matchId)
    .single();

  if (matchErr || !match) return json(cors, 404, { error: "Match not found" });

  // Read-only pre-check for the notification block below: re-joins (e.g. a
  // retried request) must not re-notify the organizer or friends.
  let wasAlreadyJoined = false;
  {
    const { data: existingRow } = await supabase
      .from("match_players")
      .select("status")
      .eq("match_id", matchId)
      .eq("user_id", user.id)
      .maybeSingle();
    wasAlreadyJoined = existingRow?.status === "joined" || existingRow?.status === "checked_in";
  }

  if (!match.is_spontaneous && match.max_players != null) {
    const { count, error: countErr } = await supabase
      .from("match_players")
      .select("*", { count: "exact", head: true })
      .eq("match_id", matchId)
      .in("status", ["joined", "checked_in"]);

    if (countErr) return json(cors, 400, { error: "Failed to check capacity", details: countErr.message });
    if ((count ?? 0) >= Number(match.max_players)) {
      return json(cors, 400, { error: "Match is full" });
    }
  }

  const { error: upsertErr } = await supabase
    .from("match_players")
    .upsert(
      { match_id: matchId, user_id: user.id, status: "joined", checked_in_at: null },
      { onConflict: "match_id,user_id" }
    );

  if (upsertErr) return json(cors, 400, { error: "Failed to join match", details: upsertErr.message });

  // ── Push notifications (best-effort — must never block the join) ──────────
  if (!wasAlreadyJoined) {
    try {
      const admin = createAdminClient();
      if (admin) {
        const [matchRes, joinerRes, playersRes] = await Promise.all([
          admin
            .from("matches")
            .select("id, title, organizer_id, created_by, max_players, venue:venues(name)")
            .eq("id", matchId)
            .single(),
          admin.from("profiles").select("display_name, full_name").eq("id", user.id).single(),
          admin
            .from("match_players")
            .select("user_id")
            .eq("match_id", matchId)
            .in("status", ["joined", "checked_in"]),
        ]);

        const m: any = matchRes.data;
        const venueName = m?.venue?.name ?? m?.title ?? "din match";
        const joinerName = joinerRes.data?.display_name || joinerRes.data?.full_name || "En spelare";
        const activeIds: string[] = (playersRes.data ?? []).map((p: any) => p.user_id);
        const organizerId: string | null = m?.organizer_id ?? m?.created_by ?? null;

        const pushes: Promise<unknown>[] = [];

        // PLAYER_JOINED → organizer
        if (organizerId && organizerId !== user.id) {
          pushes.push(sendPushNotification(
            [organizerId],
            { sv: "📣 Ny spelare!", en: "📣 New player!" },
            {
              sv: `${joinerName} gick med i din match på ${venueName}`,
              en: `${joinerName} joined your match at ${venueName}`,
            },
            { type: "PLAYER_JOINED", match_id: matchId },
            admin,
          ));

          // MATCH_FULL → organizer, exactly when capacity is reached
          if (m?.max_players != null && activeIds.length === Number(m.max_players)) {
            pushes.push(sendPushNotification(
              [organizerId],
              { sv: "✅ Matchen är full!", en: "✅ Your match is full!" },
              {
                sv: `Din match på ${venueName} är full!`,
                en: `Your match at ${venueName} is full!`,
              },
              { type: "MATCH_FULL", match_id: matchId },
              admin,
            ));
          }
        }

        // FRIEND_JOINED_MATCH → accepted friends already in the match
        // (organizer excluded — they already get PLAYER_JOINED)
        const others = activeIds.filter((id) => id !== user.id && id !== organizerId);
        if (others.length > 0) {
          const { data: friendships } = await admin
            .from("friendships")
            .select("requester_id, addressee_id")
            .eq("status", "accepted")
            .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

          const friendIds = new Set(
            (friendships ?? []).map((f: any) => (f.requester_id === user.id ? f.addressee_id : f.requester_id)),
          );
          const friendsInMatch = others.filter((id) => friendIds.has(id));

          if (friendsInMatch.length > 0) {
            pushes.push(sendPushNotification(
              friendsInMatch,
              { sv: "👥 En vän gick med", en: "👥 A friend joined" },
              {
                sv: `${joinerName} gick med i samma match som du`,
                en: `${joinerName} joined the same match as you`,
              },
              { type: "FRIEND_JOINED_MATCH", match_id: matchId },
              admin,
            ));
          }
        }

        await Promise.all(pushes);
      }
    } catch (notifyErr) {
      console.error("[join_match] push notifications failed:", notifyErr);
    }
  }

  const { count: newCount, error: newCountErr } = await supabase
    .from("match_players")
    .select("*", { count: "exact", head: true })
    .eq("match_id", matchId)
    .in("status", ["joined", "checked_in"]);

  if (newCountErr) {
    return json(cors, 200, { ok: true, match_id: matchId, user_id: user.id, active_players: null });
  }

  return json(cors, 200, { ok: true, match_id: matchId, user_id: user.id, active_players: newCount ?? null });
});
