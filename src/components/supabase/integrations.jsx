/**
 * Supabase Integrations — drop-in replacement for base44.integrations.Core.*
 *
 * Only UploadFile is implemented — used for avatar/image uploads.
 * InvokeLLM / SendEmail / GenerateImage are intentionally NOT supported.
 *
 * Upload strategy (tried in order):
 *   1. Supabase Edge Function `upload_file` → returns a permanent storage URL
 *   2. Compressed data URL fallback — image compressed to ≤200×200px JPEG and
 *      stored as a base64 data: URI directly in the database column. No external
 *      service required; works on first launch before the edge function is deployed.
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';
import { sessionStore, waitForAuth } from './client';

const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

function authHeaders(extra = {}) {
  const h = { apikey: SUPABASE_ANON_KEY, ...extra };
  if (sessionStore.accessToken) {
    h['Authorization'] = `Bearer ${sessionStore.accessToken}`;
  }
  return h;
}

async function parseOrThrow(res, fnLabel) {
  const text = await res.text().catch(() => '');
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (_) { data = { message: text }; }
  if (!res.ok) {
    const msg = data?.error || data?.message || `${fnLabel} failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

/**
 * Compress an image File/Blob to a JPEG data URL at max 400×400px.
 * Keeps aspect ratio. Output is typically 15–50 KB.
 */
function compressToDataUrl(file, maxSize = 400, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) { height = Math.round(height * maxSize / width); width = maxSize; }
        else { width = Math.round(width * maxSize / height); height = maxSize; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

/* ─────────── UploadFile ─────────── */
// Compatible signature: ({ file }) => { file_url }
export async function UploadFile({ file }) {
  await waitForAuth();
  if (!file) throw new Error('UploadFile: file is required');

  // 1. Try the Supabase edge function (permanent storage URL)
  try {
    const form = new FormData();
    form.append('file', file);

    const res = await fetch(`${FUNCTIONS_URL}/upload_file`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    });
    if (res.ok) {
      const data = await parseOrThrow(res, 'UploadFile');
      if (data.file_url) return { file_url: data.file_url };
    }
  } catch (_) {
    // Edge function not deployed — fall through to data URL
  }

  // 2. Fallback: compress and store as a data URL in the database column.
  //    No external service required. Works until the edge function is deployed.
  const dataUrl = await compressToDataUrl(file);
  return { file_url: dataUrl };
}

// Namespace shim for code that still reads `Core.*`
export const Core = { UploadFile };
export default Core;
