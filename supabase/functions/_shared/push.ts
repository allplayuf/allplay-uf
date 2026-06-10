// Shared push-notification helper for AllPlay edge functions.
//
// `sendPushNotification(userIds, title, body, data)` looks up device tokens in
// public.user_devices and delivers per token format:
//   - ExponentPushToken[...]  → Expo Push API (https://exp.host/--/api/v2/push/send)
//   - raw APNs hex token      → APNs directly (the Capacitor iOS client registers
//                               native APNs tokens; uses the APNS_* secrets)
//
// Localization: title/body can be a plain string or { sv, en }. Swedish is
// the default; a device gets English only when its user_devices.locale
// starts with "en" (set by the client from the app language / phone locale).
//
// Dead tokens (Expo DeviceNotRegistered / APNs 410 / BadDeviceToken) are
// deleted from user_devices so we stop sending to them.
//
// All sends are best-effort: this module never throws — a failed push must
// never fail the DB write that triggered it.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_TOKEN_RE = /^Expo(nent)?PushToken\[[^\]]+\]$/;
const APNS_TOKEN_RE = /^[0-9a-f]{64,}$/i;
const EXPO_BATCH_SIZE = 100;

export type LocalizedText = string | { sv: string; en: string };

export interface PushResult {
  sent: number;
  total: number;
  cleaned: number;
  error?: string;
}

export function createAdminClient(): SupabaseClient | null {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// Labels for matches.level / profiles.skill_level values
export const LEVEL_LABELS_SV: Record<string, string> = {
  beginner: "Nybörjare",
  intermediate: "Medel",
  advanced: "Avancerad",
  elite: "Elit",
  pro: "Proffs",
};

export const LEVEL_LABELS_EN: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  elite: "Elite",
  pro: "Pro",
};

export function formatMatchTime(startsAt: string | Date): string {
  try {
    return new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Stockholm",
      day: "numeric",
      month: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(startsAt));
  } catch {
    return "";
  }
}

function isEnglishLocale(locale: string | null | undefined): boolean {
  return (locale ?? "").trim().toLowerCase().startsWith("en");
}

function resolveText(text: LocalizedText, isEn: boolean): string {
  if (typeof text === "string") return text;
  return (isEn ? text.en : text.sv) ?? text.sv ?? text.en ?? "";
}

// ── APNs JWT (ES256) for raw-token delivery ───────────────────────────────────

function base64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function buildApnsJwt(keyId: string, teamId: string, p8Pem: string): Promise<string> {
  const b64 = p8Pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    der.buffer as ArrayBuffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const encodeJson = (obj: unknown) =>
    base64url(new TextEncoder().encode(JSON.stringify(obj)).buffer as ArrayBuffer);

  const header = encodeJson({ alg: "ES256", kid: keyId });
  const payload = encodeJson({ iss: teamId, iat: Math.floor(Date.now() / 1000) });
  const signingInput = `${header}.${payload}`;

  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${base64url(sig)}`;
}

interface DeviceRow {
  id: string;
  user_id: string;
  expo_push_token: string;
  locale: string | null;
}

async function sendExpoBatch(
  devices: DeviceRow[],
  title: LocalizedText,
  body: LocalizedText,
  data: Record<string, unknown>,
  result: PushResult,
  staleRowIds: string[],
): Promise<void> {
  for (let i = 0; i < devices.length; i += EXPO_BATCH_SIZE) {
    const batch = devices.slice(i, i + EXPO_BATCH_SIZE);
    const messages = batch.map((d) => {
      const isEn = isEnglishLocale(d.locale);
      return {
        to: d.expo_push_token,
        sound: "default",
        title: resolveText(title, isEn),
        body: resolveText(body, isEn),
        data,
      };
    });

    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate",
        },
        body: JSON.stringify(messages),
      });
      const payload = await res.json().catch(() => null);
      const tickets = Array.isArray(payload?.data) ? payload.data : [];

      tickets.forEach((ticket: { status?: string; details?: { error?: string } }, idx: number) => {
        if (ticket?.status === "ok") {
          result.sent++;
        } else if (ticket?.details?.error === "DeviceNotRegistered") {
          staleRowIds.push(batch[idx].id);
        }
      });

      if (!res.ok) {
        console.error("[push] Expo API error:", res.status, JSON.stringify(payload));
      }
    } catch (err) {
      console.error("[push] Expo batch failed:", err);
    }
  }
}

async function sendApnsDirect(
  devices: DeviceRow[],
  title: LocalizedText,
  body: LocalizedText,
  data: Record<string, unknown>,
  result: PushResult,
  staleRowIds: string[],
): Promise<void> {
  const keyId = Deno.env.get("APNS_KEY_ID") ?? "";
  const teamId = Deno.env.get("APNS_TEAM_ID") ?? "";
  const bundleId = Deno.env.get("APNS_BUNDLE_ID") ?? "";
  const p8Pem = Deno.env.get("APNS_PRIVATE_KEY") ?? "";

  if (!keyId || !teamId || !bundleId || !p8Pem) {
    console.error("[push] APNs env vars not configured — skipping", devices.length, "raw-token devices");
    return;
  }

  let jwt: string;
  try {
    jwt = await buildApnsJwt(keyId, teamId, p8Pem);
  } catch (err) {
    console.error("[push] APNs JWT build failed:", err);
    return;
  }

  await Promise.all(devices.map(async (device) => {
    try {
      const isEn = isEnglishLocale(device.locale);
      const apnsPayload = JSON.stringify({
        aps: {
          alert: { title: resolveText(title, isEn), body: resolveText(body, isEn) },
          sound: "default",
          badge: 1,
        },
        ...data,
      });

      const res = await fetch(`https://api.push.apple.com/3/device/${device.expo_push_token}`, {
        method: "POST",
        headers: {
          "authorization": `bearer ${jwt}`,
          "apns-topic": bundleId,
          "apns-push-type": "alert",
          "apns-priority": "10",
          "content-type": "application/json",
        },
        body: apnsPayload,
      });

      if (res.status === 200) {
        result.sent++;
        return;
      }
      if (res.status === 410) {
        staleRowIds.push(device.id);
        return;
      }
      const errBody = await res.json().catch(() => ({}));
      if (res.status === 400 && errBody?.reason === "BadDeviceToken") {
        staleRowIds.push(device.id);
        return;
      }
      console.error("[push] APNs error:", res.status, JSON.stringify(errBody));
    } catch (err) {
      console.error("[push] APNs send failed:", err);
    }
  }));
}

/**
 * Send a push notification to every registered device of the given users.
 * `title`/`body` may be plain strings or { sv, en } — Swedish is the default,
 * English is used for devices whose locale starts with "en".
 * Never throws; returns delivery stats.
 */
export async function sendPushNotification(
  userIds: string[],
  title: LocalizedText,
  body: LocalizedText,
  data: Record<string, unknown> = {},
  adminClient?: SupabaseClient | null,
): Promise<PushResult> {
  const result: PushResult = { sent: 0, total: 0, cleaned: 0 };
  try {
    const ids = [...new Set((userIds ?? []).filter(Boolean))];
    if (ids.length === 0) return result;

    const admin = adminClient ?? createAdminClient();
    if (!admin) {
      result.error = "missing SUPABASE_SERVICE_ROLE_KEY";
      return result;
    }

    const { data: devices, error: devErr } = await admin
      .from("user_devices")
      .select("id, user_id, expo_push_token, locale")
      .in("user_id", ids);

    if (devErr) {
      result.error = devErr.message;
      return result;
    }

    const expoDevices: DeviceRow[] = [];
    const apnsDevices: DeviceRow[] = [];
    for (const d of (devices ?? []) as DeviceRow[]) {
      if (EXPO_TOKEN_RE.test(d.expo_push_token ?? "")) expoDevices.push(d);
      else if (APNS_TOKEN_RE.test(d.expo_push_token ?? "")) apnsDevices.push(d);
    }

    result.total = expoDevices.length + apnsDevices.length;
    if (result.total === 0) return result;

    const staleRowIds: string[] = [];
    if (expoDevices.length > 0) await sendExpoBatch(expoDevices, title, body, data, result, staleRowIds);
    if (apnsDevices.length > 0) await sendApnsDirect(apnsDevices, title, body, data, result, staleRowIds);

    if (staleRowIds.length > 0) {
      const { error: delErr } = await admin.from("user_devices").delete().in("id", staleRowIds);
      if (!delErr) result.cleaned = staleRowIds.length;
    }

    return result;
  } catch (err) {
    console.error("[push] sendPushNotification failed:", err);
    result.error = String(err);
    return result;
  }
}
