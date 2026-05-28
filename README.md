# Qnielita

A simple "porra" website for our bets for the World Cup 2026.

## Setup

### Local

When starting from scratch, first reset the database:

```bash
npx supabase db reset
```

Then add the players:

```bash
cd supabase && psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f seed_players.sql
```

You must also set an admin user:

```bash
./scripts/setup-admin.sh --env .env.local
```

### Remote (Production)

Steps are very similar, with a few quirks.

```bash
npx supabase db reset
```

Then add the players:

```bash
cd supabase && psql "postgresql://postgres.<project-id>.pooler.supabase.com:6543/postgres" -f seed_players.sql
```

It will prompt for the database password. Another option is to set the `PGPASSWORD` variable. You must also set an admin user:

```bash
./scripts/setup-admin.sh --env .env.local.production
```

## Generating the player seed

You can generate the player seed with the following command:

```bash
FOOTBALL_DATA_API_KEY=xxx npx tsx scripts/seed-players.ts
```