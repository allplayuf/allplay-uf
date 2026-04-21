/**
 * Supabase Integrations — drop-in replacement for base44.integrations.Core.*
 *
 * Only UploadFile is implemented — used for avatar/image uploads.
 * InvokeLLM / SendEmail / GenerateImage are intentionally NOT supported.
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

/* ─────────── UploadFile ─────────── */
// Compatible signature: ({ file }) => { file_url }
export async function UploadFile({ file }) {
  await waitForAuth();
  if (!file) throw new Error('UploadFile: file is required');

  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${FUNCTIONS_URL}/upload_file`, {
    method: 'POST',
    headers: authHeaders(), // no Content-Type — browser sets multipart boundary
    body: form,
  });
  const data = await parseOrThrow(res, 'UploadFile');
  return { file_url: data.file_url };
}

// Namespace shim for code that still reads `Core.*`
export const Core = { UploadFile };
export default Core;