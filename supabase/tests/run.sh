#!/usr/bin/env sh
# Runs the migration and the policy walkthrough in a throwaway Postgres container (podman or docker).
set -e
cd "$(dirname "$0")"
run=$(command -v podman || command -v docker)
$run rm -f sizzle-pg-test >/dev/null 2>&1 || true
$run run -d --name sizzle-pg-test -e POSTGRES_PASSWORD=test postgres:17-alpine >/dev/null
trap '$run rm -f sizzle-pg-test >/dev/null' EXIT
until $run exec sizzle-pg-test pg_isready -q -U postgres; do sleep 1; done
sleep 2
psql() { $run exec -i sizzle-pg-test psql -q -U postgres "$@"; }
psql -v ON_ERROR_STOP=1 < stubs.sql
psql -v ON_ERROR_STOP=1 < ../migrations/0001_user_recipes.sql
psql < policies.sql 2>&1
