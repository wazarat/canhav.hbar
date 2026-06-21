#!/usr/bin/env bash
# Sync selected keys from .env.local to Vercel (production, preview, development).
# Usage: ./scripts/sync-vercel-env.sh
# Never commit .env.local. Does not print secret values.
set -euo pipefail
cd "$(dirname "$0")/.."

KEYS=(
  DATABASE_URL
  HEDERA_OPERATOR_ID
  HEDERA_OPERATOR_KEY
  HEDERA_NETWORK
  HBAR_AUDIT_TOPIC_ID
  BONZO_VAULT_ADAPTER_MODE
  OPENAI_API_KEY
  NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY
  NEXT_PUBLIC_HASHSCAN_URL
  CRON_SECRET
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

for key in "${KEYS[@]}"; do
  val=$(grep -E "^${key}=" .env.local | head -1 | cut -d= -f2- | sed 's/^"//;s/"$//')
  if [[ -z "${val:-}" ]]; then
    echo "Skip $key (not set in .env.local)"
    continue
  fi
  printf '%s' "$val" | pnpm dlx vercel env add "$key" production preview development --force --sensitive 2>/dev/null \
    || printf '%s' "$val" | pnpm dlx vercel env add "$key" production preview development --force 2>/dev/null \
    || true
  echo "Synced $key"
done

echo "Done. Redeploy with: pnpm dlx vercel deploy --yes"
