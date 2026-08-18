# Comparison Engine

**The Comparison Engine** product stack — core comparison platform and partner reseller portal.

| Folder | Live host | Role |
|--------|-----------|------|
| [finos/](./finos/) | [thecomparisonengine.com](https://thecomparisonengine.com) | Core SoR, public comparison UI, staff portal, AI Explain |
| [reseller/](./reseller/) | [reseller.thecomparisonengine.com](https://reseller.thecomparisonengine.com) | Partner signup, dashboards, commissions |

Partner subdomains (`*.thecomparisonengine.com`) serve the finos public UI with category filters from reseller verify.

## Who this targets

- **Consumers** in Pakistan / UAE / KSA who want a ranked shortlist of savings, credit cards, personal loans, and insurance — not a bank’s own product page.
- **Partner agents** who want a white-label comparison site (`{partner}.thecomparisonengine.com`) and a commission when an application is approved.

This is the **core commercial product** in the monorepo. The Pakistan verticals (GreenDrive, HomeCompare, AutoCompare, Drive2Earn) are separate apps, not part of this stack.

## What is running today

1. Public ranking engine with eligibility, Cost, and Matrix tabs.
2. Staff portal (Client / Operations / Company Admin) for applications, documents, and claims.
3. Partner signup, admin approval, product browse (proxied from finOS), and commission webhook.
4. AI Explain via host Ollama (`qwen2.5:1.5b`) with a template fallback.

Canonical catalog lives **only in finOS**. Reseller does not duplicate products.

## Smoothness

**Best in the repo as an end-to-end product.** Ranking, partner verify, staff workflows, and commission posting are real. Gaps that still show in a public launch:

- Public UI is `vanilla.html`, not the React staff stack — it works, but it does not feel like one design system.
- Product data is seeded / illustrative, not live bank or insurer feeds.
- AI Explain is a small CPU model; useful as a summary, not a regulated advice engine.

## Public adoption chance

**Medium for B2B / partner distribution. Low–medium for mass consumer brand.**

Comparison sites get adopted when (1) rates are trusted and current, (2) applying actually goes somewhere, and (3) a known brand sits in front. The **engine and partner loop are ready to demo and iterate**. Public consumer adoption waits on real product data, regulated copy, and a go-to-market brand. Partner adoption can move first if commissions actually pay.

See each subfolder README for a fuller assessment.

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
