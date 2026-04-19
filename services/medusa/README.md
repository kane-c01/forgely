# @forgely/medusa — Medusa v2 Commerce Backend

> Multi-tenant Medusa v2 backend for Forgely — 5 custom modules, 5 payment providers, 4 shipping presets.

## Architecture

```
services/medusa/
├── medusa-config.ts          # Medusa v2 config (defineConfig)
├── src/
│   ├── modules/
│   │   ├── forgely-tenant/   # Tenant management + billing sync
│   │   ├── forgely-asset/    # Brand asset management (R2)
│   │   ├── forgely-theme/    # Theme DSL storage + versioning
│   │   ├── forgely-gen/      # Generation task tracking (12-step pipeline)
│   │   └── forgely-ai/       # AI conversation history + token accounting
│   ├── providers/
│   │   ├── payment-stripe/       # Stripe PaymentIntents
│   │   ├── payment-paypal/       # PayPal Orders V2
│   │   ├── payment-wechat-pay/   # WeChat Pay Native (V3)
│   │   ├── payment-alipay/       # Alipay RSA2
│   │   ├── payment-nowpayments/  # NOWPayments (crypto BTC/ETH/USDT)
│   │   └── fulfillment-manual/   # Manual fulfillment (MVP)
│   ├── api/
│   │   ├── middlewares.ts        # Multi-tenant sales_channel injection
│   │   └── store/tenant/         # Tenant context route
│   ├── subscribers/
│   │   └── tenant-created.ts     # Auto-create sales channel on tenant provision
│   └── scripts/
│       └── seed.ts               # Regions + shipping templates (MASTER.md §6.6)
```

## Multi-tenant Strategy (MASTER.md §6.2)

- **MVP**: Shared Medusa instance, all tenants isolated by `sales_channel_id`
- Every Forgely User = 1 Sales Channel
- All store API calls require `x-forgely-sales-channel` header
- Middleware auto-injects `sales_channel_id` filter on every query

## Quick Start

```bash
# 1. Copy env
cp .env.example .env

# 2. Install deps
pnpm install

# 3. Setup database
pnpm db:setup

# 4. Seed regions + shipping
pnpm seed

# 5. Start on :9000
pnpm dev
```

## Payment Providers

| Provider    | Status              | Notes                                     |
| ----------- | ------------------- | ----------------------------------------- |
| Stripe      | ✅ Production-ready | PaymentIntents + webhooks                 |
| PayPal      | ✅ Sandbox-ready    | Orders V2 + capture                       |
| WeChat Pay  | 🚧 Scaffold         | V3 Native pay, needs RSA cert in prod     |
| Alipay      | 🚧 Scaffold         | RSA2 page pay, needs real app credentials |
| NOWPayments | 🚧 Scaffold         | BTC/ETH/USDT, IPN webhook verification    |

## Shipping Presets (§6.6)

1. **US domestic** — USPS/UPS flat rate $5.99 / Express $14.99
2. **US → EU** — International $24.99
3. **CN → US** — ePacket/YunExpress $19.99 (Persona A)
4. **EU domestic** — DPD/DHL $7.99 / Express $19.99
