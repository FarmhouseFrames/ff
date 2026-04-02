#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCHEMA_SQL="$ROOT_DIR/supabase/schema.sql"
POLICIES_SQL="$ROOT_DIR/supabase/policies.sql"

# Auto-load local env files when present.
for env_file in "$ROOT_DIR/.env" "$ROOT_DIR/.env.local"; do
  if [[ -f "$env_file" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a
  fi
done

if ! command -v psql >/dev/null 2>&1; then
  echo "Error: psql is not installed. Install PostgreSQL client tools first." >&2
  exit 1
fi

DB_URL="${SUPABASE_DB_URL:-${DATABASE_URL:-${SUPABASE_DB_POOLER_URL:-${SUPABASE_POOLER_URL:-}}}}"
if [[ -z "$DB_URL" ]]; then
  cat >&2 <<'EOF'
Error: database URL is not set.
Set one of: SUPABASE_DB_URL, DATABASE_URL, SUPABASE_DB_POOLER_URL, SUPABASE_POOLER_URL.
You can set it for a single command like:
  SUPABASE_DB_URL='postgresql://...' ./scripts/apply-supabase-sql.sh
EOF
  exit 1
fi

if [[ ! -f "$SCHEMA_SQL" || ! -f "$POLICIES_SQL" ]]; then
  echo "Error: Required SQL files are missing in supabase/." >&2
  exit 1
fi

apply_file() {
  local sql_file="$1"
  if [[ ! -f "$sql_file" ]]; then
    echo "Error: SQL file not found: $sql_file" >&2
    exit 1
  fi

  echo "Applying SQL: $sql_file"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$sql_file"
}

if [[ $# -gt 0 ]]; then
  target="$1"
  if [[ "$target" != /* ]]; then
    target="$ROOT_DIR/$target"
  fi
  apply_file "$target"
else
  apply_file "$SCHEMA_SQL"
  apply_file "$POLICIES_SQL"
fi

echo "Success: Supabase SQL updates applied."
