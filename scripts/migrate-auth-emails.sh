#!/usr/bin/env bash
set -euo pipefail

# One-off script to migrate existing Supabase Auth users' emails
# from real emails to the {username}@qnielita.local format.
#
# Usage:
#   ./scripts/migrate-auth-emails.sh                        # uses .env.local
#   ./scripts/migrate-auth-emails.sh --env .env.production  # uses a different env file

ENV_FILE=".env.local"

while [[ $# -gt 0 ]]; do
  case $1 in
    --env) ENV_FILE="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: $ENV_FILE not found"
  exit 1
fi

eval "$(grep -E '^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SECRET_KEY)=' "$ENV_FILE")"

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:?Missing NEXT_PUBLIC_SUPABASE_URL in $ENV_FILE}"
SERVICE_KEY="${SUPABASE_SECRET_KEY:?Missing SUPABASE_SECRET_KEY in $ENV_FILE}"

# Fetch all profiles with their usernames
echo "Fetching profiles..."
PROFILES=$(curl -s \
  "${SUPABASE_URL}/rest/v1/profiles?select=id,username,display_name" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}")

COUNT=$(echo "$PROFILES" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
echo "Found ${COUNT} user(s)."

echo "$PROFILES" | python3 -c "
import sys, json
for p in json.load(sys.stdin):
    print(f\"  {p['username']} ({p['display_name']}) -> {p['username']}@qnielita.local\")
"

echo ""
read -rp "Update all auth emails to {username}@qnielita.local? [y/N] " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

echo "$PROFILES" | python3 -c "
import sys, json
for p in json.load(sys.stdin):
    print(p['id'] + ' ' + p['username'])
" | while read -r USER_ID USERNAME; do
  NEW_EMAIL="${USERNAME}@qnielita.local"
  echo "Updating ${USERNAME} (${USER_ID}) -> ${NEW_EMAIL}"

  RESPONSE=$(curl -s -w "\n%{http_code}" \
    "${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}" \
    -X PUT \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"${NEW_EMAIL}\", \"email_confirm\": true}")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  if [[ "$HTTP_CODE" -ne 200 ]]; then
    BODY=$(echo "$RESPONSE" | sed '$d')
    echo "  Error (HTTP $HTTP_CODE): $BODY"
  else
    echo "  Done."
  fi
done

echo ""
echo "Migration complete. Users can now log in with their username."