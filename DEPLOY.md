# Deploying SplitPay to Vercel + Arc Testnet

This guide walks through a full production-style deploy of SplitPay using
**Vercel** for the web app + API and **Arc Testnet** for the smart contract.
You'll end up with:

- A live URL on Vercel
- A verified `SplitPay` contract on Arc Testnet
- A managed Postgres for the metadata indexer
- A path to flip to Arc Mainnet later by changing env vars only

> Heads up: Arc Mainnet is not live yet (Circle has it on the roadmap for
> 2026). Until then, "production" in this guide means **Arc Testnet with real
> wallets**. No real money is at risk — testnet USDC is free from
> <https://faucet.circle.com>.

---

## 1. Prerequisites

- A Vercel account (<https://vercel.com>)
- A wallet with some Arc-testnet USDC for deploying the contract — get USDC
  from <https://faucet.circle.com>
- A managed Postgres. Recommended free options:
  - **Neon** (<https://neon.tech>) — works great with Vercel
  - **Vercel Postgres** — one-click from the Vercel dashboard
- (Optional) A WalletConnect Cloud project for mobile wallet connections:
  <https://cloud.walletconnect.com>

---

## 2. Deploy the smart contract

```bash
cd contracts/hardhat
cp .env.example .env
# Open .env and set DEPLOYER_PRIVATE_KEY=<your testnet private key>

pnpm install
pnpm compile
pnpm test                      # sanity-check against a mock USDC
pnpm deploy:arc-testnet
```

You'll see something like:

```
SplitPay deployed at: 0xAbC...123
```

Save that address.

### Verify the contract on Sourcify

```bash
pnpm verify:sourcify --network arcTestnet
```

That uploads the source + metadata to Sourcify; the contract will then show
as verified in any Sourcify-aware explorer (and a public link at
<https://repo.sourcify.dev/contracts/full_match/5042002/{ADDRESS}/>).

> Note: Arcscan does not yet expose a public Etherscan-compatible verification
> API. Sourcify is the right path on Arc today.

---

## 3. Provision a Postgres database

Pick one:

**Neon (recommended):**
1. Create a project at <https://neon.tech>.
2. Copy the **pooled** connection string (looks like
   `postgresql://...neon.tech/...?sslmode=require&pgbouncer=true`).

**Vercel Postgres:**
1. In your Vercel project → Storage → Create Database → Postgres.
2. The `DATABASE_URL` is auto-injected as a project env var.

Push the schema once:

```bash
DATABASE_URL=<your-connection-string> \
  pnpm --filter @workspace/db run push
```

---

## 4. Push the repo to Vercel (two projects)

The frontend (Vite SPA) and the API (Express server) are deployed as **two
separate Vercel projects** from the same repo. This avoids the Vercel
serverless TypeScript checker tripping over the workspace's strict
`tsconfig` and Express 5 types.

You can use the dashboard or the CLI for each. Push the repo to your Git host
first, then import it twice — once with Root Directory at the repo root
(frontend) and once with Root Directory at `artifacts/api-server` (API).

### 4a. Frontend project (Vite SPA)

1. Vercel → **Add New Project** → import the repo.
2. **Root Directory:** `.` (repo root — leave default).
3. Settings are read from the root `vercel.json`. You should not need to
   override anything, but for reference:
   - **Framework Preset:** Other
   - **Install Command:** `pnpm install --frozen-lockfile=false`
   - **Build Command:** `pnpm --filter @workspace/api-spec run codegen && BASE_PATH=/ pnpm --filter @workspace/splitpay run build`
   - **Output Directory:** `artifacts/splitpay/dist/public`
4. Add the **frontend env vars** from the table below.
5. Deploy. You'll get a URL like `https://splitpay.vercel.app`.

### 4b. API project (Express server)

1. Vercel → **Add New Project** → import the **same** repo.
2. **Root Directory:** `artifacts/api-server`.
3. Settings are read from `artifacts/api-server/vercel.json`. The build runs
   `pnpm install` from the monorepo root and bundles the Express app into a
   single serverless function exposed at `/api/*`.
4. Add the **API env vars** from the table below.
5. Deploy. You'll get a URL like `https://splitpay-api.vercel.app`.

### 4c. Wire the frontend to the API

After the API project is live:

1. Copy its production URL (e.g. `https://splitpay-api.vercel.app`).
2. In the **frontend** Vercel project → Settings → Environment Variables, set
   `VITE_API_URL` to that URL.
3. Redeploy the frontend (Vite vars are baked at build time).

**CLI shortcut for either project:**

```bash
npm i -g vercel
vercel link            # run inside the repo root for the frontend
                       # or inside artifacts/api-server for the API
vercel env add ...     # see tables below
vercel --prod
```

---

## 5. Set Vercel environment variables

### Frontend project

| Variable | Value | Notes |
| --- | --- | --- |
| `VITE_API_URL` | `https://splitpay-api.vercel.app` | URL of the API project from step 4b |
| `VITE_WALLETCONNECT_PROJECT_ID` | `<project-id>` | Optional, for mobile wallets |

`VITE_*` vars are baked into the frontend bundle at build time, so changing
them requires a redeploy.

### API project

| Variable | Value | Notes |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://...` | From step 3 |
| `FRONTEND_URL` | `https://splitpay.vercel.app` | URL of the frontend project — used for CORS |
| `ARC_CHAIN_ID` | `5042002` | Arc Testnet chain id |
| `ARC_CHAIN_NAME` | `Arc Testnet` | |
| `ARC_RPC_URL` | `https://rpc.testnet.arc.network` | Or an Alchemy/dRPC URL |
| `ARC_EXPLORER_URL` | `https://testnet.arcscan.app` | |
| `USDC_ADDRESS` | `0x3600000000000000000000000000000000000000` | Arc system USDC |
| `SPLITPAY_CONTRACT_ADDRESS` | `0x575f1AA76CAdC580723Ba98e6B79BA5463aA7886` | Latest deploy on Arc Testnet (step 2 if redeploying) |
| `NODE_ENV` | `production` | |

The non-prefixed vars are read at runtime by the API and exposed to the
frontend via `GET /api/config`, so changing them only needs an API redeploy.

---

## 6. Deploy

Trigger a deploy (push to your default branch, or `vercel --prod`).
Once it finishes:

1. Open the Vercel URL.
2. Click **Connect Wallet** — your wallet should prompt to add **Arc Testnet**
   if it doesn't have it already.
3. Top up your wallet with USDC from <https://faucet.circle.com>.
4. Create a split, share the link, and have a friend pay their share.

Verify the on-chain side: each `payShare` transaction should appear on the
deployed `SplitPay` contract at <https://testnet.arcscan.app>.

---

## 7. Switching to Arc Mainnet later

When Arc Mainnet launches:

1. Redeploy the contract: `pnpm deploy:arc-mainnet` (after setting the mainnet
   RPC + chain id in `contracts/hardhat/.env`).
2. Verify it: `pnpm verify:sourcify --network arcMainnet`.
3. Update these Vercel env vars and redeploy:
   - `ARC_CHAIN_ID` → mainnet chain id
   - `ARC_CHAIN_NAME` → `Arc`
   - `ARC_RPC_URL` → mainnet RPC
   - `ARC_EXPLORER_URL` → `https://arcscan.app` (or whatever Circle publishes)
   - `SPLITPAY_CONTRACT_ADDRESS` → new mainnet address
   - `USDC_ADDRESS` → keep `0x36...000` (the system address is the same)

That's it — no code changes needed.

---

## Troubleshooting

- **API returns 500 with `DATABASE_URL` errors** — make sure you used the
  pooled connection string (with `pgbouncer=true` on Neon). Vercel functions
  open many short-lived connections.
- **Frontend shows the wrong chain** — `ARC_CHAIN_ID` mismatch. The frontend
  fetches `/api/config` once at load; hard-refresh after changing it.
- **`payShare` reverts with "wrong amount"** — for `EQUAL` splits the contract
  enforces the exact share returned by `getShareAmount`. The frontend already
  reads this; if you're calling the contract directly, fetch it first.
- **Wallet won't add the network** — chain id `5042002`, RPC
  `https://rpc.testnet.arc.network`, currency `USDC` (6 decimals). Some
  wallets cache rejected networks; remove and re-add.
