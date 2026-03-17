import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const SUPABASE_URL = 'https://vqfjjokqmykqawjlgevj.supabase.co';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

const ALLPLAY_VENUE_NAMES = [
  'Hammarby IP',
  'Östra Real Skolplan',
  'Norra Real Skolplan',
  'Gärdet IP',
  'Reimersholme IP',
  'Zinkensdamms IP',
  'Tanto IP',
  'Vasaparken',
  'Årsta IP',
  'Kristinebergs IP',
  'Östermalms IP',
  'Stadshagens IP',
  'Bellevue Bollplan',
  'Sofiaskolans Bollplan',
  'Johannes Bollplan',
  'Humlegårdens Bollplan',
  'Liljeholmsbadet Bollplan',
  'Björns Trädgård Bollplan',
  'Hagaparkens Bollplan',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Step 1: First reset ALL venues to is_allplay = false
    const resetRes = await fetch(
      `${SUPABASE_URL}/rest/v1/venues?is_allplay=eq.true`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({ is_allplay: false }),
      }
    );
    const resetData = await resetRes.json().catch(() => []);
    console.log(`Reset ${resetData.length} venues to is_allplay=false`);

    // Step 2: Fetch all venues to find matching names
    const listRes = await fetch(
      `${SUPABASE_URL}/rest/v1/venues?select=id,name,is_allplay&order=name.asc`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    
    if (!listRes.ok) {
      return Response.json({ error: 'Failed to fetch venues', status: listRes.status }, { status: 500 });
    }
    
    const allVenues = await listRes.json();
    console.log(`Total venues in DB: ${allVenues.length}`);

    // Step 3: Match venue names (case-insensitive, trimmed)
    const normalizedTargets = ALLPLAY_VENUE_NAMES.map(n => n.trim().toLowerCase());
    
    const matched = [];
    const notFound = [];
    
    for (const targetName of ALLPLAY_VENUE_NAMES) {
      const normalizedTarget = targetName.trim().toLowerCase();
      const found = allVenues.find(v => v.name.trim().toLowerCase() === normalizedTarget);
      if (found) {
        matched.push({ id: found.id, name: found.name });
      } else {
        // Try partial match
        const partial = allVenues.find(v => 
          v.name.trim().toLowerCase().includes(normalizedTarget) ||
          normalizedTarget.includes(v.name.trim().toLowerCase())
        );
        if (partial) {
          matched.push({ id: partial.id, name: partial.name, originalSearch: targetName });
        } else {
          notFound.push(targetName);
        }
      }
    }

    console.log(`Matched: ${matched.length}, Not found: ${notFound.length}`);
    console.log('Not found names:', notFound);
    console.log('Matched:', matched.map(m => m.name));

    // Step 4: Update matched venues to is_allplay = true (one by one for reliability)
    const updated = [];
    const errors = [];
    
    for (const venue of matched) {
      const updateRes = await fetch(
        `${SUPABASE_URL}/rest/v1/venues?id=eq.${venue.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({ is_allplay: true }),
        }
      );
      
      if (updateRes.ok) {
        updated.push(venue.name);
      } else {
        const errText = await updateRes.text().catch(() => '');
        errors.push({ name: venue.name, error: errText });
      }
    }

    return Response.json({
      success: true,
      total_venues: allVenues.length,
      matched: matched.length,
      updated: updated.length,
      updated_names: updated,
      not_found: notFound,
      errors,
    });
    
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});