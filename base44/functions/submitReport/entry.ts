import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      reported_user_id, 
      reported_item_type, 
      reported_item_id, 
      category, 
      description 
    } = await req.json();

    if (!reported_item_type || !category) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Rate limit: max 10 reports per day per user
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const recentReports = await base44.asServiceRole.entities.Report.filter({
      reporter_id: user.id
    });
    
    const todayReports = recentReports.filter(r => 
      new Date(r.created_date) >= today
    );

    if (todayReports.length >= 10) {
      return Response.json({ 
        error: 'Du har nått maxgränsen för rapporter idag. Försök igen imorgon.' 
      }, { status: 429 });
    }

    // Create the report
    const report = await base44.asServiceRole.entities.Report.create({
      reporter_id: user.id,
      reported_user_id: reported_user_id || null,
      reported_item_type,
      reported_item_id: reported_item_id || null,
      category,
      description: description || '',
      status: 'pending'
    });

    console.log('AUDIT LOG:', {
      action: 'REPORT_SUBMITTED',
      reporter_id: user.id,
      report_id: report.id,
      category,
      reported_item_type,
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      message: 'Rapport skickad',
      report_id: report.id
    });

  } catch (error) {
    console.error('Error in submitReport:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});