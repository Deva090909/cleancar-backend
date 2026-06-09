# CleanCar 360° ERP — Backend

**NestJS 10 · PostgreSQL · Prisma 6 · BullMQ · Zod · JWT**

## Quick start

```bash
# 1. Copy env
cp .env.example .env
# Edit DATABASE_URL, JWT_SECRET, REDIS_URL

# 2. Install
npm install

# 3. Database
npx prisma migrate dev --name init
npx prisma generate
npx ts-node prisma/seed.ts

# 4. Run
npm run start:dev
```

Swagger UI: http://localhost:3000/api/docs

## API Reference

| Module | Base path | Key endpoints |
|--------|-----------|---------------|
| Auth | `/api/v1/auth` | POST /login, /refresh, /logout, /forgot-password, /reset-password |
| Employees | `/api/v1/employees` | CRUD, /set-password, /unlock, /by-role/:role |
| Customers | `/api/v1/customers` | CRUD, /stats |
| Leads | `/api/v1/leads` | CRUD, /pipeline, /mine, /:id/status, /:id/calls, /:id/assign |
| Subscriptions | `/api/v1/subscriptions` | CRUD, /mrr, /renewals-due, /:id/pause, /:id/resume |
| Jobs | `/api/v1/jobs` | CRUD, /washer/today, /:id/assign, /:id/status, /:id/complete |
| Attendance | `/api/v1/attendance` | /punch-in, /punch-out, /mark, /me/:month, /city, /summary |
| Payroll | `/api/v1/payroll` | CRUD, /compute, /approve, /mark-paid, /salary-structure |
| Finance | `/api/v1/finance` | /dashboard, /mrr, /revenues, /payables, /ledger, /invoices, /budget |
| Incentives | `/api/v1/incentives` | CRUD, /me, /employee/:id, /process-due, /:id/cancel |
| Inventory | `/api/v1/inventory` | CRUD, /low-stock, /:id/issue, /:id/receive |
| GST | `/api/v1/gst` | /transactions, /gstr1, /gstr3b |
| Complaints | `/api/v1/complaints` | CRUD, /stats, /:id/status, /:id/assign |
| Plans | `/api/v1/plans` | /tiers, /matrix, /addons |
| Notifications | `/api/v1/notifications` | /mine, /send, /broadcast, /:id/read, /mark-all-read |

## Frontend integration

Change `APIService.ts` in the frontend to point to this backend:

```typescript
const BASE_URL = process.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

// Login example
const { accessToken, refreshToken } = await fetch(`${BASE_URL}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ loginMobile: "9100000001", password: "Demo@1234" }),
}).then(r => r.json());

// Authenticated request
const employees = await fetch(`${BASE_URL}/employees`, {
  headers: { "Authorization": `Bearer ${accessToken}`, "x-city-id": "CITY-SURAT" },
}).then(r => r.json());
```

## Architecture

```
src/
  auth/            JWT auth, bcrypt, account lockout, refresh token rotation
  employees/       CRUD + set-password + unlock
  customers/       Customer management
  leads/           Lead pipeline + call history
  subscriptions/   Lifecycle: create, pause, resume, cancel + auto-MRR
  jobs/            Washer execution + QA verification
  attendance/      GPS punch-in/out + mark + monthly summary
  payroll/         Computation + statutory (PF/ESIC/PT) + workflow
  finance/         Revenue, MRR, payables, ledger, invoices, budget
  incentives/      V6 pool-based tranches + role payouts + auto-process
  inventory/       Stock items + issue/receive transactions
  gst/             GSTR-1, GSTR-3B report generation
  complaints/      Complaint lifecycle + assignment + resolution
  plans/           Plan tier management (syncs with frontend buy-page)
  notifications/   In-app + SMS/Email/WhatsApp via BullMQ
  workers/         BullMQ processors: notification, payroll, incentive, periodic
  common/          Guards, decorators, pipes, filters, interceptors
prisma/
  schema.prisma    26 normalized models
  seed.ts          Cities, plan tiers, demo employees
```
