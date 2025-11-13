import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Swedish and English profanity list
const PROFANITY_LIST = [
  // Swedish
  'fan', 'helvete', 'jävla', 'jävel', 'skit', 'idiot', 'fitta', 'kuk', 'hora', 'bög',
  'cp', 'mongo', 'tard', 'cancer', 'aids', 'negr', 'blatte', 'svenne', 'zigenare',
  // English
  'fuck', 'shit', 'bitch', 'ass', 'asshole', 'bastard', 'damn', 'hell', 'crap',
  'dick', 'pussy', 'cock', 'whore', 'slut', 'retard', 'nazi', 'nigger', 'fag',
  // Variations and leetspeak
  'f*ck', 'sh*t', 'b!tch', 'a$$', 'fck', 'shyt', 'fuk', 'fuq', 'phuck',
  '4ss', 'd1ck', 'p*ssy', 'wh0re', 'n1gger', 'f4g'
];

// Check if text contains profanity
function containsProfanity(text) {
  if (!text) return false;
  
  const normalized = text.toLowerCase()
    .replace(/[^\w\såäö]/g, '') // Remove special chars but keep Swedish letters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();

  // Check for exact matches and partial matches
  return PROFANITY_LIST.some(word => {
    const regex = new RegExp(`\\b${word}\\b|${word}`, 'i');
    return regex.test(normalized);
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the text to check from request body
    const { text, field } = await req.json();

    if (!text) {
      return Response.json({ 
        isClean: true,
        message: 'No text provided'
      });
    }

    const hasProfanity = containsProfanity(text);

    if (hasProfanity) {
      console.log(`Profanity detected in ${field || 'text'} by user ${user.email}: "${text}"`);
    }

    return Response.json({
      isClean: !hasProfanity,
      message: hasProfanity 
        ? 'Texten innehåller olämpligt språk. Använd vänligt språk.' 
        : 'Text is clean',
      hasProfanity
    });

  } catch (error) {
    console.error('Error in profanityFilter:', error);
    // On error, allow the text (fail open for better UX)
    return Response.json({ 
      isClean: true,
      message: 'Validation error, allowing text',
      error: error.message 
    }, { status: 500 });
  }
});