/**
 * upload_file edge function
 *
 * Replaces base44.integrations.Core.UploadFile.
 *
 * Accepts multipart/form-data OR JSON {fileBase64, fileName, contentType}.
 * Uploads to Supabase Storage bucket "uploads" and returns { file_url }.
 *
 * Requires: authenticated user.
 * Bucket "uploads" must exist and be PUBLIC (or configure signed URLs yourself).
 */

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const BUCKET = 'uploads';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

function sanitizeName(name) {
  return (name || 'file')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_')
    .slice(-80);
}

function guessExt(contentType, fallback = 'bin') {
  if (!contentType) return fallback;
  const map = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'application/pdf': 'pdf',
  };
  return map[contentType] || fallback;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    // Authenticate caller
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) return json({ error: 'Unauthorized' }, 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser(jwt);
    if (userErr || !userRes?.user) return json({ error: 'Unauthorized' }, 401);
    const userId = userRes.user.id;

    // Read file from body — supports multipart or JSON base64
    let fileBytes = null;
    let fileName = 'file';
    let contentType = 'application/octet-stream';

    const reqContentType = req.headers.get('content-type') || '';
    if (reqContentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file');
      if (!(file instanceof File)) return json({ error: 'No file provided' }, 400);
      fileBytes = new Uint8Array(await file.arrayBuffer());
      fileName = file.name || 'file';
      contentType = file.type || 'application/octet-stream';
    } else {
      const body = await req.json().catch(() => ({}));
      const { fileBase64, fileName: fn, contentType: ct } = body;
      if (!fileBase64) return json({ error: 'fileBase64 required' }, 400);
      fileName = fn || 'file';
      contentType = ct || 'application/octet-stream';
      const binary = atob(fileBase64.split(',').pop()); // strip data: prefix if present
      fileBytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) fileBytes[i] = binary.charCodeAt(i);
    }

    // Size limit: 10 MB
    if (fileBytes.byteLength > 10 * 1024 * 1024) {
      return json({ error: 'File too large (max 10 MB)' }, 413);
    }

    // Build unique path
    const ext = fileName.includes('.')
      ? fileName.split('.').pop().toLowerCase()
      : guessExt(contentType);
    const safeStem = sanitizeName(fileName.replace(/\.[^.]+$/, ''));
    const key = `${userId}/${Date.now()}_${crypto.randomUUID().slice(0, 8)}_${safeStem}.${ext}`;

    // Upload via service role
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error: upErr } = await admin.storage.from(BUCKET).upload(key, fileBytes, {
      contentType,
      upsert: false,
    });
    if (upErr) {
      console.error('[upload_file] upload error:', upErr);
      return json({ error: `Upload failed: ${upErr.message}` }, 500);
    }

    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(key);
    return json({ file_url: pub.publicUrl, key });
  } catch (err) {
    console.error('[upload_file] fatal:', err);
    return json({ error: err.message || 'Internal error' }, 500);
  }
});