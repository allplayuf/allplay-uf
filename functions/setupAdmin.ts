import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * One-time setup: ensures profiles.is_admin column exists and
 * sets is_admin = true for allplayuf@gmail.com.
 * 
 * Must be called by an authenticated user (admin-only in production,
 * but first run bootstraps the admin).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // We need the Supabase service role to run DDL / direct updates.
    // Use the SUPABASE_URL + SUPABASE_ANON_KEY from env,
    // but we'll call the Supabase REST API with the user's token
    // to read, and the service role for the migration.
    
    const SUPABASE_URL = Deno.env.get('https://vqfjjokqmykqawjlgevj.supabase.co') || Deno.env.get('SUPABASE_URL');
    const SUPABASE_KEY = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return Response.json({ error: 'Missing Supabase config' }, { status: 500 });
    }

    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=minimal'
    };

    // Step 1: Try to add is_admin column (idempotent via rpc or direct SQL)
    // We'll use the REST API to PATCH the user row - if column doesn't exist
    // the PATCH will fail, and we note it. Since we can't run DDL via REST,
    // we just try to update and if the column exists, great.
    
    // Step 2: Set is_admin = true for allplayuf@gmail.com
    // Find the user first
    const findRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users?email=eq.allplayuf@gmail.com&select=id,email,is_admin`,
      { method: 'GET', headers }
    );
    
    if (!findRes.ok) {
      const errText = await findRes.text();
      // If is_admin column doesn't exist, the select will fail
      // Try without is_admin
      const findRes2 = await fetch(
        `${SUPABASE_URL}/rest/v1/users?email=eq.allplayuf@gmail.com&select=id,email`,
        { method: 'GET', headers }
      );
      
      if (!findRes2.ok) {
        return Response.json({ 
          error: 'Could not find user', 
          details: errText,
          note: 'The is_admin column may need to be added manually in Supabase dashboard: ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;'
        }, { status: 500 });
      }
      
      const users2 = await findRes2.json();
      return Response.json({
        ok: false,
        message: 'is_admin column does not exist yet. Please run this SQL in Supabase SQL Editor:',
        sql: [
          "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;",
          "UPDATE public.profiles SET is_admin = true WHERE email = 'allplayuf@gmail.com';",
          "-- Also update the users view if it exists to include is_admin"
        ],
        users_found: users2.length
      });
    }
    
    const users = await findRes.json();
    
    if (!users || users.length === 0) {
      return Response.json({ 
        ok: false, 
        message: 'No user found with email allplayuf@gmail.com' 
      });
    }

    const targetUser = users[0];
    
    if (targetUser.is_admin === true) {
      return Response.json({ ok: true, message: 'User is already admin', user_id: targetUser.id });
    }

    // Update is_admin to true
    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users?id=eq.${targetUser.id}`,
      {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({ is_admin: true })
      }
    );

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      return Response.json({ 
        error: 'Failed to update is_admin', 
        details: errText,
        note: 'You may need to run SQL manually: UPDATE public.profiles SET is_admin = true WHERE email = \'allplayuf@gmail.com\';'
      }, { status: 500 });
    }

    return Response.json({ 
      ok: true, 
      message: 'Admin flag set successfully for allplayuf@gmail.com',
      user_id: targetUser.id
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});