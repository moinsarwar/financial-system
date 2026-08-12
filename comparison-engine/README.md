# Comparison Engine

**The Comparison Engine** product stack — core comparison platform and partner reseller portal.

| Folder | Live host | Role |
|--------|-----------|------|
| [finos/](./finos/) | [thecomparisonengine.com](https://thecomparisonengine.com) | Core SoR, public comparison UI, staff portal, AI Explain |
| [reseller/](./reseller/) | [reseller.thecomparisonengine.com](https://reseller.thecomparisonengine.com) | Partner signup, dashboards, commissions |

Partner subdomains (`*.thecomparisonengine.com`) serve the finos public UI with category filters from reseller verify.

## Run (local WSL Docker)

```bash
# finos — prod-style stack
cd comparison-engine/finos
docker compose -f docker-compose.prod.yml -p finos up -d --build

# reseller (joins finos_default for finos-backend-1)
cd ../reseller
docker compose up -d --build
```

## Production deploy (VPS)

After the first pull into `comparison-engine/`, copy prod `.env` files if they are still at the old paths:

```bash
cp -a finOS/.env comparison-engine/finos/.env      # if needed
cp -a reseller/.env comparison-engine/reseller/.env  # if needed
```

Then:

```bash
cd /root/financial-system/comparison-engine/finos
docker compose -f docker-compose.prod.yml -p finos up -d --build

cd /root/financial-system/comparison-engine/reseller
docker compose up -d --build
```

See each subfolder `README.md` for ports, env, and API details.
