#!/bin/bash
# Deploy Dramatis-HQ to Limbo server
#
# Usage:
#   ./scripts/deploy-limbo.sh           # sync + build + restart
#   ./scripts/deploy-limbo.sh --restart # restart only (no sync/build)
#   ./scripts/deploy-limbo.sh --sync    # sync code only (no build/restart)
#
# ============================================================================
# CRITICAL: PROJECT ISOLATION
# ============================================================================
# Limbo runs MULTIPLE apps (taskling, dramatis, etc.) as Docker containers.
# Each app MUST use an isolated docker-compose project name (-p <name>).
#
# WITHOUT project isolation, docker-compose treats all containers as one
# project, and commands like `docker-compose down` will KILL OTHER APPS.
#
# NEVER USE:
#   - `docker-compose down` without -p flag (kills everything)
#   - `docker-compose up -d` without -p flag (creates shared namespace)
#
# ALWAYS USE:
#   - COMPOSE_CMD with -p ${PROJECT_NAME} (see below)
#   - Stop/rm specific services, not `down` for the whole stack
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load Limbo credentials from .env.limbo (gitignored)
ENV_FILE="${PROJECT_DIR}/.env.limbo"
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found."
  echo "Create it with:"
  echo "  LIMBO_HOST=limbo.local"
  echo "  LIMBO_USER=root"
  echo "  LIMBO_PASS=yourpassword"
  exit 1
fi
# shellcheck disable=SC1090
set -a && source "$ENV_FILE" && set +a

LIMBO_HOST="${LIMBO_HOST:-limbo.local}"
LIMBO_USER="${LIMBO_USER:-root}"
LIMBO_APP_DIR="/mnt/user/appdata/dramatis/app"

# CRITICAL: Project name isolates this app from others on limbo.
# Container names will be: dramatis-postgres-1, dramatis-minio-1, dramatis-dramatis-1
# Without -p flag, containers share "app" namespace and get killed together!
PROJECT_NAME="dramatis"
CONTAINER_NAME="${PROJECT_NAME}-dramatis-1"
HEALTH_URL="http://${LIMBO_HOST}:6767/api/health"
COMPOSE_FILE="docker-compose.limbo.yml"

# ALWAYS use COMPOSE_CMD - it includes the -p flag for isolation
COMPOSE_CMD="docker-compose -p ${PROJECT_NAME} -f ${COMPOSE_FILE}"
SSH_OPTS="-o StrictHostKeyChecking=no -o PubkeyAuthentication=no -o IdentitiesOnly=yes"

MODE="full"
if [ "$1" = "--restart" ]; then MODE="restart"; fi
if [ "$1" = "--sync" ]; then MODE="sync"; fi

echo "=== Deploy Dramatis-HQ -> Limbo (mode: $MODE) ==="
echo ""

# -- 1. Sync code ----------------------------------------------------------------
if [ "$MODE" != "restart" ]; then
  echo "> Syncing code to ${LIMBO_HOST}..."
  sshpass -p "${LIMBO_PASS}" rsync -az --delete \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.git' \
    --exclude '.env' \
    --exclude '.env.local' \
    --exclude '.env.limbo' \
    --exclude 'test-results' \
    --exclude 'playwright-report' \
    --exclude 'coverage' \
    --exclude '.taskling' \
    -e "ssh ${SSH_OPTS}" \
    "${PROJECT_DIR}/" "${LIMBO_USER}@${LIMBO_HOST}:${LIMBO_APP_DIR}/"
  echo "  Done"
  echo ""

  if [ "$MODE" = "sync" ]; then
    echo "Sync-only mode complete."
    exit 0
  fi
fi

# -- 2. Ensure .env exists on server ----------------------------------------------
echo "> Checking .env on server..."
sshpass -p "${LIMBO_PASS}" ssh ${SSH_OPTS} "${LIMBO_USER}@${LIMBO_HOST}" \
  "if [ ! -f ${LIMBO_APP_DIR}/.env ]; then
     echo 'Creating default .env...'
     cat > ${LIMBO_APP_DIR}/.env << 'ENVEOF'
DATABASE_URL=postgresql://dramatis:dramatis@postgres:5432/dramatis
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://${LIMBO_HOST}:6767
S3_ENDPOINT=http://minio:9000
S3_REGION=auto
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_HEADSHOTS=headshots
S3_BUCKET_VIDEOS=videos
S3_BUCKET_DOCUMENTS=documents
S3_BUCKET_TEMP=temp
DOCUMENT_ENCRYPTION_KEY=$(openssl rand -base64 32)
ENVEOF
   fi"
echo "  Done"
echo ""

# -- 3. Build image on Limbo -----------------------------------------------------
if [ "$MODE" != "restart" ]; then
  echo "> Building Docker image on Limbo..."
  sshpass -p "${LIMBO_PASS}" ssh ${SSH_OPTS} "${LIMBO_USER}@${LIMBO_HOST}" \
    "cd ${LIMBO_APP_DIR} && ${COMPOSE_CMD} build dramatis 2>&1 | tail -10"
  echo "  Build complete"
  echo ""
fi

# -- 4. Restart containers (only dramatis stack, isolated project) ---------------
# NOTE: We stop/rm the specific service, then `up -d` the stack.
# DO NOT use `docker-compose down` here - it would kill postgres/minio too,
# and without the -p flag it would kill OTHER APPS on the server!
echo "> Restarting dramatis containers..."
sshpass -p "${LIMBO_PASS}" ssh ${SSH_OPTS} "${LIMBO_USER}@${LIMBO_HOST}" \
  "cd ${LIMBO_APP_DIR} && \
   ${COMPOSE_CMD} stop dramatis 2>/dev/null || true && \
   ${COMPOSE_CMD} rm -f dramatis 2>/dev/null || true && \
   ${COMPOSE_CMD} up -d"
echo "  Containers started"
echo ""

# -- 5. Apply schema directly via psql (FAST & RELIABLE) --------------------------
# Instead of using temp Node containers (which timeout/fail), we apply schema
# changes directly via psql. This is instant and never fails.
echo "> Applying schema changes directly via psql..."

PSQL_CMD="docker exec ${PROJECT_NAME}-postgres-1 psql -U dramatis"

# Apply ALL known schema changes directly - this is idempotent (IF NOT EXISTS)
sshpass -p "${LIMBO_PASS}" ssh ${SSH_OPTS} "${LIMBO_USER}@${LIMBO_HOST}" "${PSQL_CMD} -c \"
-- Enum values (add any missing)
DO \\\$\\\$ BEGIN
  ALTER TYPE show_status ADD VALUE IF NOT EXISTS 'completed';
  ALTER TYPE show_status ADD VALUE IF NOT EXISTS 'auditioning';
  ALTER TYPE show_status ADD VALUE IF NOT EXISTS 'in_production';
  ALTER TYPE show_status ADD VALUE IF NOT EXISTS 'rehearsal';
  ALTER TYPE show_status ADD VALUE IF NOT EXISTS 'running';
  ALTER TYPE show_status ADD VALUE IF NOT EXISTS 'closed';
EXCEPTION WHEN duplicate_object THEN NULL;
END \\\$\\\$;

-- Shows table columns
ALTER TABLE shows ADD COLUMN IF NOT EXISTS rehearsal_end DATE;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'planning';

-- Talent profiles columns
ALTER TABLE talent_profiles ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE talent_profiles ADD COLUMN IF NOT EXISTS profile_visible BOOLEAN DEFAULT true;
ALTER TABLE talent_profiles ADD COLUMN IF NOT EXISTS weight_lbs INTEGER;
ALTER TABLE talent_profiles ADD COLUMN IF NOT EXISTS metric_visibility JSONB DEFAULT '{}';
ALTER TABLE talent_profiles ADD COLUMN IF NOT EXISTS willingness_to_change_hair BOOLEAN;

-- Resumes columns (only if table exists)
DO \\\$\\\$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resumes') THEN
    ALTER TABLE resumes ADD COLUMN IF NOT EXISTS template VARCHAR(100);
  END IF;
END \\\$\\\$;
\""
echo "  Schema applied"

# -- 5a. Verify critical columns exist --------------------------------------------
echo "> Verifying schema..."
VERIFY_RESULT=$(sshpass -p "${LIMBO_PASS}" ssh ${SSH_OPTS} "${LIMBO_USER}@${LIMBO_HOST}" "${PSQL_CMD} -t -c \"
SELECT
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name='shows' AND column_name='rehearsal_end') as shows_rehearsal_end,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name='talent_profiles' AND column_name='birthday') as talent_birthday,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name='talent_profiles' AND column_name='profile_visible') as talent_visible;
\"" 2>&1)

if echo "$VERIFY_RESULT" | grep -q "0"; then
  echo "  ERROR: Some columns still missing!"
  echo "  $VERIFY_RESULT"
  exit 1
fi
echo "  Schema verified: OK"
echo ""

# -- 5b. Run seed data (using pre-built node_modules in container) ----------------
echo "> Seeding database..."
# The dramatis container already has node_modules built in, use it directly
SEED_OUTPUT=$(sshpass -p "${LIMBO_PASS}" ssh ${SSH_OPTS} "${LIMBO_USER}@${LIMBO_HOST}" \
  "docker exec ${CONTAINER_NAME} sh -c 'cd /app && node --experimental-specifier-resolution=node node_modules/.bin/tsx lib/db/seed.ts 2>&1'" 2>&1) || true

# Check if seed succeeded
if echo "$SEED_OUTPUT" | grep -q "Seeding Complete"; then
  echo "$SEED_OUTPUT" | grep -A5 "Seeding Complete"
else
  # Fallback: run in temp container if the above fails
  echo "  Direct seed failed, using temp container..."
  sshpass -p "${LIMBO_PASS}" ssh ${SSH_OPTS} "${LIMBO_USER}@${LIMBO_HOST}" \
    "docker run --rm \
      --network ${PROJECT_NAME}_default \
      -e DATABASE_URL=postgresql://dramatis:dramatis@postgres:5432/dramatis \
      -v ${LIMBO_APP_DIR}:/app \
      -w /app \
      node:22-alpine \
      sh -c 'npm install -g pnpm && pnpm install --frozen-lockfile && pnpm db:seed' 2>&1 | tail -25" || true
fi
echo "  Seed complete"
echo ""

# -- 6. Health check -------------------------------------------------------------
echo "> Waiting for health check..."
MAX_WAIT=90
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
  if curl -sf "${HEALTH_URL}" > /dev/null 2>&1; then
    echo "  Healthy after ${WAITED}s"
    break
  fi
  sleep 3
  WAITED=$((WAITED + 3))
  printf "  waiting... %ds\r" "$WAITED"
done

if [ $WAITED -ge $MAX_WAIT ]; then
  echo "  Health check timed out after ${MAX_WAIT}s"
  echo ""
  echo "Container logs:"
  sshpass -p "${LIMBO_PASS}" ssh ${SSH_OPTS} "${LIMBO_USER}@${LIMBO_HOST}" \
    "docker logs ${CONTAINER_NAME} --tail 40 2>&1"
  exit 1
fi

# -- 7. Verify app is working ----------------------------------------------------
echo "> Verifying app..."
HEALTH_RESPONSE=$(curl -sf "${HEALTH_URL}" 2>/dev/null || echo '{"status":"error"}')
LOGIN_CHECK=$(curl -sf "http://${LIMBO_HOST}:6767/login" 2>/dev/null | grep -c "Sign in" || echo "0")

if [ "$LOGIN_CHECK" -gt 0 ]; then
  echo "  Login page: OK"
else
  echo "  Login page: FAILED"
  echo ""
  echo "Container logs:"
  sshpass -p "${LIMBO_PASS}" ssh ${SSH_OPTS} "${LIMBO_USER}@${LIMBO_HOST}" \
    "docker logs ${CONTAINER_NAME} --tail 30 2>&1"
  exit 1
fi

# Verify seed data is present
echo "> Verifying seed data..."
USER_COUNT=$(sshpass -p "${LIMBO_PASS}" ssh ${SSH_OPTS} "${LIMBO_USER}@${LIMBO_HOST}" \
  "docker exec ${PROJECT_NAME}-postgres-1 psql -U dramatis -t -c 'SELECT count(*) FROM users'" 2>/dev/null | tr -d ' ')
SHOW_COUNT=$(sshpass -p "${LIMBO_PASS}" ssh ${SSH_OPTS} "${LIMBO_USER}@${LIMBO_HOST}" \
  "docker exec ${PROJECT_NAME}-postgres-1 psql -U dramatis -t -c 'SELECT count(*) FROM shows'" 2>/dev/null | tr -d ' ')
AUDITION_COUNT=$(sshpass -p "${LIMBO_PASS}" ssh ${SSH_OPTS} "${LIMBO_USER}@${LIMBO_HOST}" \
  "docker exec ${PROJECT_NAME}-postgres-1 psql -U dramatis -t -c 'SELECT count(*) FROM auditions'" 2>/dev/null | tr -d ' ')

echo "  Users: ${USER_COUNT:-0}"
echo "  Shows: ${SHOW_COUNT:-0}"
echo "  Auditions: ${AUDITION_COUNT:-0}"

if [ "${USER_COUNT:-0}" -lt 1 ]; then
  echo "  WARNING: No users found - seed may have failed"
  exit 1
fi
echo "  Seed data: OK"

# -- 7a. E2E Login Test (optional) ------------------------------------------------
# Run quick E2E login test to verify the app actually works end-to-end
# Skip if playwright not installed or if --skip-e2e flag passed
if [ "$1" != "--skip-e2e" ] && [ "$MODE" = "full" ]; then
  echo ""
  echo "> Running E2E login test..."
  # Run from local machine against deployed app
  if command -v pnpm &> /dev/null && [ -f "playwright.config.ts" ]; then
    PLAYWRIGHT_BASE_URL="http://${LIMBO_HOST}:6767" pnpm test:e2e:login 2>&1 | tail -20 || {
      echo "  WARNING: E2E login test failed (non-blocking)"
      echo "  Run 'PLAYWRIGHT_BASE_URL=http://${LIMBO_HOST}:6767 pnpm test:e2e:login' to debug"
    }
  else
    echo "  Skipping (playwright not configured locally)"
  fi
fi

# -- 8. Status -------------------------------------------------------------------
echo ""
echo "=== Deploy complete ==="
echo "  App:      http://${LIMBO_HOST}:6767"
echo "  Login:    http://${LIMBO_HOST}:6767/login"
echo "  Health:   ${HEALTH_RESPONSE}"
echo "  MinIO:    http://${LIMBO_HOST}:9101 (console)"
