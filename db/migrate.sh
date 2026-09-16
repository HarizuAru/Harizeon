#!/bin/sh
# Applies pending SQL migrations in filename order, tracking them in
# schema_migrations. Idempotent. Works locally (psql on PATH) or inside the
# `migrate` compose service (files mounted at /db).
set -eu

: "${DATABASE_URL:?DATABASE_URL must be set}"

DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
MIG_DIR="${MIG_DIR:-$DIR/migrations}"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c \
  "CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());"

for f in "$MIG_DIR"/*.sql; do
  [ -e "$f" ] || continue
  v=$(basename "$f")
  applied=$(psql "$DATABASE_URL" -tAc "SELECT 1 FROM schema_migrations WHERE version = '$v'")
  if [ "$applied" = "1" ]; then
    echo "==> $v already applied"
  else
    echo "==> applying $v"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO schema_migrations (version) VALUES ('$v')"
  fi
done

echo "migrations up to date"
