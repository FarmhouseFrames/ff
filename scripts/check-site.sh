#!/usr/bin/env bash
# check-site.sh — pre-push regression checks for Farmhouse Frames.
# Validates public JSON files, scans for private data leakage, and
# smoke-tests key page HTTP responses from a local server.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0
PORT=18080

red() { printf '\033[0;31m%s\033[0m\n' "$*"; }
green() { printf '\033[0;32m%s\033[0m\n' "$*"; }
bold() { printf '\033[1m%s\033[0m\n' "$*"; }

ok() { PASS=$((PASS + 1)); green "  ✓ $*"; }
fail() { FAIL=$((FAIL + 1)); red "  ✗ $*"; }

# ---------------------------------------------------------------------------
bold "1. JSON validity checks"
# ---------------------------------------------------------------------------
for f in data/products.json products/products.json data/config.json; do
  full="$ROOT_DIR/$f"
  if [[ ! -f "$full" ]]; then
    echo "  - skip (not found): $f"
    continue
  fi
  if node -e "JSON.parse(require('fs').readFileSync('$full','utf8'))" 2>/dev/null; then
    ok "$f"
  else
    fail "$f — invalid JSON"
  fi
done

# ---------------------------------------------------------------------------
bold "2. Private supplier field scan (public files + JS)"
# ---------------------------------------------------------------------------
PRIVATE_PATTERN='walmartcost|walmartlink|walmart\.com|amazon\.com|canvaschamp\.com|internal_cost|supplier_cost|supplier_url'
PUBLIC_SCOPE=(
  data/products.json
  products/products.json
  products/products.js
  js/commerce.js
  assets/js/storefront.js
  index.html catalog.html gallery.html splits.html contact.html
  pickup.html certificates.html account.html
  products/index.html products/product.html
  products/canvas.html products/puzzles.html
  products/mounted-canvas.html products/desk-canvas.html
)

for f in "${PUBLIC_SCOPE[@]}"; do
  full="$ROOT_DIR/$f"
  [[ -f "$full" ]] || continue
  matches=$(grep -inE "$PRIVATE_PATTERN" "$full" 2>/dev/null || true)
  if [[ -n "$matches" ]]; then
    fail "$f — private supplier field found"
    echo "$matches" | head -n 5 | sed 's/^/      /'
  else
    ok "$f — clean"
  fi
done

# ---------------------------------------------------------------------------
bold "3. HTTP smoke tests (local static server)"
# ---------------------------------------------------------------------------
if ! command -v python3 >/dev/null 2>&1; then
  echo "  - skip HTTP tests (python3 not available)"
else
  # Pick a free port dynamically.
  PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("",0)); print(s.getsockname()[1]); s.close()')
  python3 -m http.server "$PORT" --directory "$ROOT_DIR" >/dev/null 2>&1 &
  SERVER_PID=$!
  sleep 1

  PAGES=(
    /
    /products/index.html
    /products/product.html
    /dashboard/index.html
    /pickup.html
    /contact.html
    /gallery.html
    /data/products.json
  )

  for page in "${PAGES[@]}"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT$page" 2>/dev/null || echo 000)
    if [[ "$code" == "200" ]]; then
      ok "${page} → ${code}"
    else
      fail "${page} → ${code}"
    fi
  done

  kill "$SERVER_PID" 2>/dev/null || true
fi

# ---------------------------------------------------------------------------
bold "4. Migration file checks"
# ---------------------------------------------------------------------------
MIGRATION_DIR="$ROOT_DIR/supabase/migrations"
if [[ -d "$MIGRATION_DIR" ]]; then
  count=$(ls -1 "$MIGRATION_DIR"/*.sql 2>/dev/null | wc -l)
  if [[ "$count" -gt 0 ]]; then
    ok "$count migration file(s) found in supabase/migrations/"
  else
    fail "supabase/migrations/ exists but has no .sql files"
  fi
else
  fail "supabase/migrations/ not found — run: mkdir -p supabase/migrations"
fi

# ---------------------------------------------------------------------------
bold "Results"
# ---------------------------------------------------------------------------
echo ""
echo "  Passed: $PASS"
echo "  Failed: $FAIL"
echo ""

if [[ "$FAIL" -gt 0 ]]; then
  red "Regression check FAILED — fix the issues above before pushing."
  exit 1
else
  green "All checks passed."
fi
