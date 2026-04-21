/**
 * invoke_llm edge function
 *
 * Replaces base44.integrations.Core.InvokeLLM.
 *
 * Accepts: { prompt, response_json_schema?, add_context_from_internet?, file_urls?, model? }
 * Returns: string (if no schema) OR parsed JSON object (if schema given).
 *
 * Uses OpenAI by default. Requires OPENAI_API_KEY secret.
 */

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    if (!OPENAI_API_KEY) return json({ error: 'OPENAI_API_KEY not configured' }, 500);

    // Auth
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) return json({ error: 'Unauthorized' }, 401);
    const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: userRes, error: userErr } = await userClient.auth.getUser(jwt);
    if (userErr || !userRes?.user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const {
      prompt,
      response_json_schema,
      file_urls,
      model,
    } = body;

    if (!prompt || typeof prompt !== 'string') {
      return json({ error: 'prompt (string) required' }, 400);
    }

    // Build content parts (supports images)
    const userContent = [{ type: 'text', text: prompt }];
    if (Array.isArray(file_urls)) {
      for (const url of file_urls) {
        if (typeof url === 'string' && url) {
          userContent.push({ type: 'image_url', image_url: { url } });
        }
      }
    }

    const openaiBody = {
      model: model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: userContent }],
    };

    if (response_json_schema) {
      openaiBody.response_format = {
        type: 'json_schema',
        json_schema: {
          name: 'structured_output',
          strict: false,
          schema: response_json_schema,
        },
      };
    }

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openaiBody),
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.error('[invoke_llm] OpenAI error:', data);
      return json({ error: data?.error?.message || 'LLM call failed' }, resp.status);
    }

    const content = data?.choices?.[0]?.message?.content ?? '';
    if (response_json_schema) {
      try {
        return json({ result: JSON.parse(content) });
      } catch (_) {
        return json({ result: content });
      }
    }
    return json({ result: content });
  } catch (err) {
    console.error('[invoke_llm] fatal:', err);
    return json({ error: err.message || 'Internal error' }, 500);
  }
});