#!/bin/sh
set -e

if [ -n "${DATABASE_URL:-}" ]; then
  echo "Running prisma migrate deploy..."
  npx prisma migrate deploy
else
  echo "DATABASE_URL is not set; skipping prisma migrate deploy" >&2
fi

exec "$@"
