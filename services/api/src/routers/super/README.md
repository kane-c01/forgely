# /super tRPC Router (T25 + T26)

Owner: **W7 — `my-mcp-7`**

This is the server-side surface for the Forgely super-admin console
(`apps/app/app/super/**`). It pairs 1:1 with the client pages:

| Page                          | Sub-router                 |
| ----------------------------- | -------------------------- |
| `apps/app/app/super/page.tsx` | (Overview reads from each) |
| `apps/app/app/super/users`    | `super.users.*`            |
| `apps/app/app/super/finance`  | `super.finance.*`          |
| `apps/app/app/super/audit`    | `super.audit.*`            |
| `apps/app/app/super/team`     | `super.team.*`             |

## Wiring (W3 / T06 — please do this when `services/api` is bootstrapped)

1. **Procedure** — define `superAdminProcedure` in
   `services/api/src/trpc.ts`:

   ```ts
   export const superAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
     if (ctx.session.role !== 'super_admin') {
       throw new TRPCError({ code: 'FORBIDDEN' })
     }
     return next({ ctx })
   })
   ```

2. **Context** — make sure `ctx` exposes:
   - `prisma` (Prisma Client)
   - `stripe` (Stripe SDK)
   - `email` (Resend / Postmark wrapper)
   - `queue` (BullMQ enqueuer)
   - `billing` (custom helper, see T24)
   - `session` (`{ userId, role, email, name }`)
   - `request` (`{ ipAddress, userAgent }`)

3. **Mount** — append to the root router:

   ```ts
   import { superRouter } from './super'
   export const appRouter = router({ /* … */, super: superRouter })
   ```

4. **Audit** — `recordAudit(ctx, { action, targetType, targetId, … })` is
   already called inside every mutation. No extra middleware required for
   MVP, but a `auditedProcedure` wrapper would let us catch incidental
   mutations too.

## RBAC matrix (mirror in client)

```
OWNER   → *
ADMIN   → !finance.* !team.* !platform.*
SUPPORT → users.read, users.detail.read, users.login_as.request,
          sites.read, support.ticket.read, support.ticket.reply,
          audit.read, *.read
```

`assertCan(role, action)` enforces this on every procedure. The same matrix
is duplicated client-side in `apps/app/lib/super/session.ts` so the UI hides
buttons users cannot trigger — but the server is always the source of
truth.

## Schema dependencies

- `User`, `UserCredits`, `CreditTransaction`, `AuditLog`, `Subscription` —
  defined in `prisma/schema.prisma` (T05).
- New for T25/T26: `TeamMember`, `Refund`, `LoginAsTicket`. These are
  referenced in the router but are **not yet in the schema**. W3 should add
  them when wiring T26 — fields used:

  ```prisma
  model TeamMember {
    id              String   @id @default(cuid())
    email           String   @unique
    name            String?
    role            String   // OWNER | ADMIN | SUPPORT
    invitedAt       DateTime @default(now())
    acceptedAt      DateTime?
    twoFactorEnabled Boolean @default(false)
    lastSeenAt      DateTime?
  }

  model Refund {
    id              String   @id @default(cuid())
    userId          String
    paymentIntentId String
    amountUsd       Int
    reason          String
    status          String   // queued | approved | rejected | completed
    requestedAt     DateTime @default(now())
    decidedAt       DateTime?
    decidedBy       String?
    user            User     @relation(fields: [userId], references: [id])
  }

  model LoginAsTicket {
    id              String   @id @default(cuid())
    requestedBy     String   // super-admin user id
    targetUserId    String
    reason          String
    status          String   // awaiting_user | granted | denied | expired
    createdAt       DateTime @default(now())
    expiresAt       DateTime
    decidedAt       DateTime?
  }
  ```

## Audit-log action vocabulary

`SUPER_ACTIONS` in `_audit-log.ts` is the canonical list. Keep the Audit
Log filter dropdown (`apps/app/app/super/audit/_components/AuditClient.tsx`)
in sync — the server returns the same strings.
