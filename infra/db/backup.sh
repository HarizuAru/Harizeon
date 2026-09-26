#!/bin/sh
# Logical backup of the database (§07.5). Restore with infra/db/restore.sh.
#
# Usage:
#   DATABASE_URL=postgresql://harizeon:...@db:5432/harizeon sh infra/db/backup.sh > harizeon-$(date +%F).sql
#
# The dump is written to stdout so it can go straight to a file, a pipe, or an
# off-site uploader — never to a predictable local path that could be stolen.
set -eu
: "${DATABASE_URL:?DATABASE_URL must be set}"

pg_dump "$DATABASE_URL" -v ON_ERROR_STOP=1 --no-owner --no-privileges
