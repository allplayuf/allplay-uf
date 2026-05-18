#!/bin/bash
# Deploy AllPlay edge functions to Supabase
# Run from the project root: bash scripts/deploy-edge-functions.sh
set -e

PROJECT_REF="vqfjjokqmykqawjlgevj"

echo "🔐 Logging in to Supabase (opens browser)..."
supabase login

echo "🔗 Linking project $PROJECT_REF..."
supabase link --project-ref "$PROJECT_REF"

echo "🚀 Deploying upload_file function..."
supabase functions deploy upload_file --project-ref "$PROJECT_REF"

echo "✅ Done! The upload_file function will auto-create the 'uploads' storage bucket on first use."
echo ""
echo "Test it at: https://$PROJECT_REF.supabase.co/functions/v1/upload_file"
