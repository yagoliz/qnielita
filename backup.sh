#!/bin/bash

echo -n "DB password: "
read -s SUPABASE_DB_PASSWORD

mkdir -p backups && D=$(date +%Y%m%d_%H%M%S) && npx supabase db dump --linked -f backups/roles_$D.sql --role-only && npx supabase db dump --linked -f backups/schema_$D.sql && npx supabase db dump --linked -f backups/data_$D.sql --data-only && echo "Backup complete: backups/*_$D.sql"