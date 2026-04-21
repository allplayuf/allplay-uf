/**
 * Supabase Integrations — drop-in replacement for base44.integrations.Core.*
 *
 * API-compatible so callsites only need to swap the import.
 *
 *   OLD: import { base44 } from '@/api/base44Client';
 *        await base44.integrations.Core.UploadFile({ file });
 *
 *   NEW: import { UploadFile } from '@/components/supabase/integrations';
 *        await UploadFile({ file });
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';
import { sessionStore, waitForAuth } from './client';

const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

function authHeaders(extra = {}) {
  const h = {
    apikey: SUPABASE_ANON_KEY,
    ...extra,
  };
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

/* ─────────── InvokeLLM ─────────── */
// Compatible signature: (options) => string | object
export async function InvokeLLM(options = {}) {
  await waitForAuth();
  const {
    prompt,
    response_json_schema,
    add_context_from_internet,
    file_urls,
    model,
  } = options;

  const res = await fetch(`${FUNCTIONS_URL}/invoke_llm`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      prompt,
      response_json_schema,
      add_context_from_internet: !!add_context_from_internet,
      file_urls,
      model,
    }),
  });
  const data = await parseOrThrow(res, 'InvokeLLM');
  return data.result;
}

/* ─────────── SendEmail ─────────── */
// Compatible signature: ({ to, subject, body, from_name? })
export async function SendEmail({ to, subject, body, from_name } = {}) {
  await waitForAuth();
  const res = await fetch(`${FUNCTIONS_URL}/send_email`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ to, subject, body, from_name }),
  });
  return parseOrThrow(res, 'SendEmail');
}

/* ─────────── GenerateImage (stub) ─────────── */
// Not implemented yet. Throws so misuse is loud instead of silent.
export async function GenerateImage() {
  throw new Error('GenerateImage is not implemented on the Supabase backend yet.');
}

/* ─────────── ExtractDataFromUploadedFile (stub via InvokeLLM) ─────────── */
export async function ExtractDataFromUploadedFile({ file_url, json_schema }) {
  if (!file_url || !json_schema) {
    throw new Error('ExtractDataFromUploadedFile: file_url and json_schema required');
  }
  try {
    const result = await InvokeLLM({
      prompt: 'Extract structured data from the attached file according to the JSON schema.',
      response_json_schema: json_schema,
      file_urls: [file_url],
    });
    return { status: 'success', output: result };
  } catch (e) {
    return { status: 'error', details: e.message, output: null };
  }
}

// Namespace shim for code that still reads `Core.*`
export const Core = {
  UploadFile,
  InvokeLLM,
  SendEmail,
  GenerateImage,
  ExtractDataFromUploadedFile,
};

export default Core;