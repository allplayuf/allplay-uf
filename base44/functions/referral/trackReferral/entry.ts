import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { newUserId, referralCode } = await req.json();

    if (!newUserId || !referralCode) {
      return Response.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Find the referrer by referral code
    const users = await base44.asServiceRole.entities.User.list();
    const referrer = users.find(u => 
      u.referral_code === referralCode || 
      u.id?.substring(0, 8) === referralCode
    );

    if (!referrer) {
      return Response.json({ 
        success: false, 
        error: 'Invalid referral code' 
      }, { status: 404 });
    }

    // Update new user with referrer info
    await base44.asServiceRole.entities.User.update(newUserId, {
      referred_by: referrer.id
    });

    // Increment referrer's verified_referrals count
    const currentCount = referrer.verified_referrals || 0;
    await base44.asServiceRole.entities.User.update(referrer.id, {
      verified_referrals: currentCount + 1,
      referral_code: referrer.referral_code || referrer.id.substring(0, 8)
    });

    return Response.json({ 
      success: true, 
      referrerId: referrer.id,
      newCount: currentCount + 1
    });

  } catch (error) {
    console.error('Error tracking referral:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});