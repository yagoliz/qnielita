#!/usr/bin/env bash
set -euo pipefail

# Inserts random but realistic scores for all group stage matches.
# Triggers scoring recalculation automatically via database triggers.
#
# Usage:
#   ./scripts/seed-group-results.sh                        # uses .env.local
#   ./scripts/seed-group-results.sh --env .env.production   # different env

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

# Fetch group stage match IDs that don't have results yet
echo "Fetching group stage matches without results..."
MATCH_IDS=$(curl -s \
  "${SUPABASE_URL}/rest/v1/matches?stage=eq.group&select=id,result:match_results(match_id)&order=id" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  | python3 -c "
import sys, json
matches = json.load(sys.stdin)
no_result = [m['id'] for m in matches if not m['result']]
print('\n'.join(str(mid) for mid in no_result))
")

if [[ -z "$MATCH_IDS" ]]; then
  echo "All group stage matches already have results."
  exit 0
fi

COUNT=$(echo "$MATCH_IDS" | wc -l | tr -d ' ')
echo "Inserting results for $COUNT matches..."

# Weighted random score generator — favors realistic scorelines
random_score() {
  local r=$((RANDOM % 100))
  if   (( r < 30 )); then echo 1
  elif (( r < 50 )); then echo 0
  elif (( r < 70 )); then echo 2
  elif (( r < 85 )); then echo 3
  elif (( r < 95 )); then echo 4
  else echo 5
  fi
}

ERRORS=0
while IFS= read -r MATCH_ID; do
  HOME=$(random_score)
  AWAY=$(random_score)

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    "${SUPABASE_URL}/rest/v1/match_results" \
    -X POST \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "{\"match_id\": ${MATCH_ID}, \"home_score\": ${HOME}, \"away_score\": ${AWAY}}")

  if [[ "$HTTP_CODE" -eq 201 ]]; then
    printf "  Match %3d: %d - %d\n" "$MATCH_ID" "$HOME" "$AWAY"
  else
    echo "  Match ${MATCH_ID}: ERROR (HTTP ${HTTP_CODE})"
    ((ERRORS++))
  fi
done <<< "$MATCH_IDS"

if [[ "$ERRORS" -gt 0 ]]; then
  echo "Done with $ERRORS errors."
  exit 1
fi

echo "Done! All group stage results seeded."