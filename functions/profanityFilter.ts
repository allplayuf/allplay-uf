import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Swedish profanity list (basic)
const PROFANITY_WORDS = [
  'fitta', 'kuk', 'hora', 'bög', 'flata', 'neger', 'jävel', 'fan', 
  'helvete', 'skit', 'knull', 'fuck', 'shit', 'bitch', 'asshole',
  'dick', 'cock', 'pussy', 'whore', 'slut', 'nigger', 'faggot'
];

// Patterns for personal info that shouldn't be in bios/names
const PERSONAL_INFO_PATTERNS = [
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // Phone numbers
  /\b\d{6}[-.\s]?\d{4}\b/, // Swedish personnummer
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
  /\b(?:gatan?|vägen?|allén?|stigen?)\s*\d+\b/i, // Swedish addresses
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, field } = await req.json();

    if (!text) {
      return Response.json({ hasProfanity: false, hasPersonalInfo: false });
    }

    const lowerText = text.toLowerCase();
    
    // Check for profanity
    let hasProfanity = false;
    let flaggedWords = [];
    
    for (const word of PROFANITY_WORDS) {
      if (lowerText.includes(word)) {
        hasProfanity = true;
        flaggedWords.push(word);
      }
    }

    // Check for personal info
    let hasPersonalInfo = false;
    let personalInfoTypes = [];
    
    for (const pattern of PERSONAL_INFO_PATTERNS) {
      if (pattern.test(text)) {
        hasPersonalInfo = true;
        if (pattern.source.includes('\\d{3}')) personalInfoTypes.push('phone');
        if (pattern.source.includes('@')) personalInfoTypes.push('email');
        if (pattern.source.includes('gatan')) personalInfoTypes.push('address');
        if (pattern.source.includes('\\d{6}')) personalInfoTypes.push('personnummer');
      }
    }

    // Log flagged content for moderation review
    if (hasProfanity || hasPersonalInfo) {
      console.log('CONTENT_FLAG:', {
        user_id: user.id,
        field: field,
        hasProfanity,
        hasPersonalInfo,
        flaggedWords: flaggedWords.length > 0 ? flaggedWords : undefined,
        personalInfoTypes: personalInfoTypes.length > 0 ? personalInfoTypes : undefined,
        timestamp: new Date().toISOString()
      });
    }

    return Response.json({
      hasProfanity,
      hasPersonalInfo,
      flaggedWords: hasProfanity ? flaggedWords : [],
      personalInfoTypes: hasPersonalInfo ? personalInfoTypes : [],
      message: hasProfanity 
        ? 'Texten innehåller olämpligt språk' 
        : hasPersonalInfo 
          ? 'Texten innehåller personlig information som inte bör delas'
          : null
    });

  } catch (error) {
    console.error('Error in profanityFilter:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});