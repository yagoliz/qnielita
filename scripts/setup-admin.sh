#!/usr/bin/env bash
set -euo pipefail

# Creates an admin user via the Supabase Auth Admin API, then flags them as admin.
# Works with both local and remote Supabase instances.
#
# Usage:
#   ./scripts/setup-admin.sh                          # uses .env.local (local dev)
#   ./scripts/setup-admin.sh --env .env.production    # uses a different env file

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

read -rp "Username: " ADMIN_USERNAME
read -rsp "Password: " ADMIN_PASSWORD
echo
read -rp "Display name: " DISPLAY_NAME

ADMIN_EMAIL="${ADMIN_USERNAME}@qnielita.local"

# Create user via Auth Admin API
echo "Creating user..."
RESPONSE=$(curl -s -w "\n%{http_code}" \
  "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${ADMIN_EMAIL}\",
    \"password\": \"${ADMIN_PASSWORD}\",
    \"email_confirm\": true,
    \"user_metadata\": { \"display_name\": \"${DISPLAY_NAME}\", \"username\": \"${ADMIN_USERNAME}\" }
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [[ "$HTTP_CODE" -ne 200 ]]; then
  echo "Error creating user (HTTP $HTTP_CODE):"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  exit 1
fi

USER_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "User created: $USER_ID"

# Flag as admin via REST API
echo "Setting admin flag..."
PATCH_RESPONSE=$(curl -s -w "\n%{http_code}" \
  "${SUPABASE_URL}/rest/v1/profiles?id=eq.${USER_ID}" \
  -X PATCH \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{"is_admin": true}')

PATCH_CODE=$(echo "$PATCH_RESPONSE" | tail -1)

if [[ "$PATCH_CODE" -ne 204 ]]; then
  echo "Error setting admin flag (HTTP $PATCH_CODE):"
  echo "$PATCH_RESPONSE" | sed '$d'
  exit 1
fi

echo "Done! ${ADMIN_USERNAME} is now an admin."