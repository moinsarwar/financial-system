#!/usr/bin/env bash
# Run from WSL: bash scripts/git-push-domain.sh
set -euo pipefail
cd /home/moin/financial-system

git status -sb
git diff --stat

git add \
  finOS/frontend/src/contexts/ResellerContext.tsx \
  finOS/frontend/src/vite-env.d.ts \
  finOS/frontend/src/components/layout/Header.tsx \
  finOS/frontend/src/pages/Login.tsx \
  finOS/frontend/src/pages/Applications.tsx \
  finOS/frontend/src/pages/UnifiedApplication.tsx \
  finOS/frontend/src/api/applications.ts \
  finOS/backend/app/schemas/__init__.py \
  finOS/backend/app/schemas/unified.py \
  finOS/backend/app/services/application_service.py \
  finOS/backend/app/api/routes/applications.py \
  finOS/docker-compose.dev.yml \
  finOS/.env.example \
  reseller/frontend/src/utils/resellerSiteUrl.js \
  reseller/frontend/src/components/Owner/OwnerDashboard.jsx \
  reseller/frontend/src/components/Owner/DashboardTab.jsx \
  reseller/frontend/src/components/Admin/AdminDashboard.jsx \
  reseller/frontend/src/components/Public/SignupForm.jsx \
  gateway \
  README.md

# Do not commit local .env secrets unless already tracked
if git ls-files --error-unmatch finOS/.env >/dev/null 2>&1; then
  git add finOS/.env
fi

git status -sb

git commit -m "$(cat <<'EOF'
Configure thecomparisonengine.com for finOS and reseller portal.

Route apex/partner subdomains to finOS and reseller.thecomparisonengine.com to the partner portal, with a Docker nginx gateway for server deploy.
EOF
)"

git push -u origin HEAD
git status -sb
git log -3 --oneline
