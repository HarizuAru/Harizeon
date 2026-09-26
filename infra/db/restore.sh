#!/bin/sh
# Restore a logical backup into a FRESH database (§07.5 release gate:
# "backup restoration succeeds").
#
# Usage:
#   DATABASE_URL=postgresql://harizeon:...@localhost:5432/harizeon \
#   sh infra/db/restore.sh < harizeon-2026-09-26.sql
#
# Safety: refuses to run unless the target database is EMPTY, so a restore can
# never silently overwrite live data. Point DATABASE_URL at a new database,
# re-apply migrations role grants are included in the dump.
set -eu
: "${DATABASE_URL:?DATABASE_URL must be set}"

if ! psql "$DATABASE_URL" -t -c "SELECT 1 FROM pg_tables WHERE schemaname='public'" | grep -q 1; then
  echo "target database has no public tables: safe to restore"
else
  echo "refusing: the target database already contains tables. Restore into a fresh database." >&2
  exit 1
fi

psql "$DATABASE_URL" -v ON_ERROR_STOP=1
echo "restore complete. Then provision the app role: infra/db/create-app-role.sh"
