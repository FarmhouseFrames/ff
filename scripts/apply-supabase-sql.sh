#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCHEMA_SQL="$ROOT_DIR/supabase/schema.sql"
POLICIES_SQL="$ROOT_DIR/supabase/policies.sql"

if ! command -v psql >/dev/null 2>&1; then
  echo "Error: psql is not installed. Install PostgreSQL client tools first." >&2
  exit 1
fi

DB_URL="${SUPABASE_DB_URL:-${DATABASE_URL:-}}"
if [[ -z "$DB_URL" ]]; then
  echo "Error: SUPABASE_DB_URL or DATABASE_URL is not set." >&2
  exit 1
fi

if [[ ! -f "$SCHEMA_SQL" || ! -f "$POLICIES_SQL" ]]; then
  echo "Error: Required SQL files are missing in supabase/." >&2
  exit 1
fi

echo "Applying schema updates from $SCHEMA_SQL"
psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$SCHEMA_SQL"

echo "Applying policy updates from $POLICIES_SQL"
psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$POLICIES_SQL"

echo "Success: Supabase SQL updates applied."
