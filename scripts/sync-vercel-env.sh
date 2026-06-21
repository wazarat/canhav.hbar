#!/usr/bin/env bash
# Sync selected keys from .env.local to Vercel (production, preview, development).
# Usage: ./scripts/sync-vercel-env.sh
# Never commit .env.local. Does not print secret values.
set -uo pipefail
cd "$(dirname "$0")/.."

KEYS=(
  DATABASE_URL
  HEDERA_OPERATOR_ID
  HEDERA_OPERATOR_KEY
  HEDERA_NETWORK
  HBAR_AUDIT_TOPIC_ID
  OPENAI_API_KEY
  NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY
  NEXT_PUBLIC_HASHSCAN_URL
  CRON_SECRET
  BONZO_VAULT_KEEPER_FEE_HBAR
)

if [[ ! -f .env.local ]]; then
  echo "Missing .env.local" >&2
  exit 1
fi

# Generate CRON_SECRET if missing locally
if ! grep -q '^CRON_SECRET=' .env.local 2>/dev/null; then
  SECRET=$(openssl rand -hex 24)
  echo "CRON_SECRET=$SECRET" >> .env.local
  echo "Added CRON_SECRET to .env.local"
fi

read_env() {
  local key="$1"
  grep -E "^${key}=" .env.local 2>/dev/null | head -1 | cut -d= -f2- | sed 's/^"//;s/"$//' || true
}

push_env() {
  local key="$1"
  local val="$2"
  shift 2
  local envs=("$@")
  if [[ -z "${val:-}" ]]; then
    echo "Skip $key (empty)"
    return 0
  fi
  if printf '%s' "$val" | pnpm dlx vercel env add "$key" "${envs[@]}" --force --sensitive 2>/dev/null; then
    echo "Synced $key → ${envs[*]}"
    return 0
  fi
  if printf '%s' "$val" | pnpm dlx vercel env add "$key" "${envs[@]}" --force 2>/dev/null; then
    echo "Synced $key → ${envs[*]}"
    return 0
  fi
  echo "Warn: failed to sync $key (continuing)" >&2
  return 0
}

for key in "${KEYS[@]}"; do
  val=$(read_env "$key")
  if [[ -z "${val:-}" ]]; then
    echo "Skip $key (not set in .env.local)"
    continue
  fi
  push_env "$key" "$val" production preview
done

# Production uses mock adapter; preview/dev follow .env.local (often chain for smoke/e2e).
local_mode=$(read_env BONZO_VAULT_ADAPTER_MODE)
preview_mode="${local_mode:-mock}"
push_env BONZO_VAULT_ADAPTER_MODE "mock" production
push_env BONZO_VAULT_ADAPTER_MODE "$preview_mode" preview

echo "Done. Redeploy with: pnpm dlx vercel deploy --prod --yes"
