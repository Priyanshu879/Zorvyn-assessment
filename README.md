# Finance Data Processing and Access Control Backend


A production-structured REST API for financial data management, built with Node.js, Express, and MongoDB. The system implements JWT authentication, role-based access control, financial record CRUD with soft deletes, and MongoDB aggregation pipelines for dashboard analytics.

---

## Live Demo

| Resource | URL |
|----------|-----|
| Interactive API Docs (Swagger UI) | https://zorvyn-assessment-production-1210.up.railway.app/api-docs |
| Raw OpenAPI Spec (Postman import) | https://zorvyn-assessment-production-1210.up.railway.app/api-docs.json |
| Health Check | https://zorvyn-assessment-production-1210.up.railway.app/health |

**Demo credentials:**
```
ADMIN    admin@finance.com    / pass123
ANALYST  analyst@finance.com  / pass123
VIEWER   viewer@finance.com   / pass123
```

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [API Reference](#api-reference)
6. [Design Decisions](#design-decisions)
7. [Assumptions](#assumptions)
8. [Tradeoffs & Future Improvements](#tradeoffs--future-improvements)
9. [Testing](#testing)
10. [Deployment](#deployment)

---

## Features

- **JWT Authentication** — register/login flow with 7-day tokens; password hashed with bcrypt (10 rounds)
- **Role-Based Access Control** — three roles (VIEWER, ANALYST, ADMIN) enforced at the route level via middleware
- **Financial Records CRUD** — create, read, update, and soft-delete records with full filter and pagination support
- **Dashboard Analytics** — MongoDB aggregation pipelines for summary totals, category breakdowns, monthly trends, and recent activity
- **Request Validation** — Zod schemas on body, query, and params for every endpoint; coerces query-string types automatically
- **Centralised Error Handling** — single middleware resolves Zod errors, Mongoose errors, JWT errors, and operational `AppError`s into a consistent response shape
- **Interactive API Docs** — Swagger UI served at `/api-docs` with live try-it-out support
- **Test Suite** — 27 Jest tests using an in-process MongoDB (no external DB needed in CI)

---

## Tech Stack

| Technology | Version | Justification |
|---|---|---|
| **Node.js** | 18+ | Non-blocking I/O handles concurrent financial queries efficiently |
| **Express 5** | ^5.2 | Native async error propagation eliminates try/catch boilerplate in routes |
| **MongoDB + Mongoose** | ^9 | Document model suits evolving finance categories; aggregation pipeline is a first-class fit for analytics |
| **Zod** | ^4 | Schema-first validation with `z.coerce` — converts HTTP query strings (always strings) to numbers without extra transforms |
| **jsonwebtoken** | ^9 | Stateless JWT avoids session storage; scales horizontally |
| **bcryptjs** | ^3 | Pure-JS bcrypt; avoids native addon compilation across platforms |
| **express-rate-limit** | ^8 | Global IP-based rate limiting (100 req / 15 min) to protect public endpoints |
| **Jest + Supertest** | ^30 / ^7 | Integration tests against a real Express app and real Mongoose queries |
| **mongodb-memory-server** | ^11 | In-process MongoDB for tests — CI runs with zero external dependencies |
| **swagger-ui-express** | ^5 | Serves the OpenAPI spec as interactive docs directly from the app |

---

## Project Structure

```
src/
├── config/
│   ├── db.js                 # Mongoose connection (logs success/failure, exits on error)
│   └── swagger.js            # Full OpenAPI 3.0.3 specification object
├── controllers/              # HTTP layer — validate input → call service → format response
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── record.controller.js
│   └── dashboard.controller.js
├── middleware/
│   ├── auth.js               # authenticate() — verifies JWT, loads req.user
│   │                         # authorize(...roles) — enforces RBAC, returns 403 on failure
│   ├── errorHandler.js       # Resolves Zod / Mongoose / JWT / AppError → consistent JSON
│   ├── requestLogger.js      # Logs METHOD /path STATUS Xms on every response
│   └── validate.js           # validate(schema, source) factory — parses and coerces req[source]
├── models/
│   ├── user.model.js         # User: name, email, password(select:false), role, status
│   └── record.model.js       # FinancialRecord: amount, type, category, date, createdBy, deletedAt
│                             #   + compound index { type, category, date, deletedAt }
├── routes/
│   ├── auth.routes.js        # POST /register, POST /login (public)
│   ├── user.routes.js        # Full CRUD — ADMIN only
│   ├── record.routes.js      # CRUD with per-route role guards
│   └── dashboard.routes.js   # Analytics endpoints with role guards
├── services/                 # Business logic — all DB access lives here
│   ├── auth.service.js       # register(), login() — token signing
│   ├── user.service.js       # CRUD operations on User model
│   ├── record.service.js     # CRUD + soft delete + dynamic filter builder
│   └── dashboard.service.js  # Aggregation pipelines for analytics
├── utils/
│   ├── AppError.js           # class AppError(message, statusCode, details?)
│   ├── asyncHandler.js       # Wraps async route handlers, forwards errors to next()
│   └── seed.js               # Seeds 3 users + 25 financial records for demo/testing
└── validators/               # Zod schemas (one file per domain)
    ├── auth.validator.js
    ├── user.validator.js
    ├── record.validator.js
    ├── dashboard.validator.js
    └── common.validator.js   # Shared: idParamSchema (ObjectId regex)

__tests__/
├── setup.js                  # MongoMemoryServer lifecycle (beforeAll / afterEach / afterAll)
├── auth.test.js              # 8 tests — register, duplicate, validation, login, inactive, no token
├── records.test.js           # 10 tests — role guards, filters, pagination, soft delete, invalid ID
└── dashboard.test.js         # 7 tests — aggregation correctness, role guards, edge cases
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 6+ running locally (or a MongoDB Atlas connection string)
- npm 9+

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd finance-backend

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
```

Edit `.env`:
```env
MONGO_URI=mongodb://localhost:27017/finance_dashboard
JWT_SECRET=replace_with_a_long_random_secret
PORT=3000
```

```bash
# 4. Seed the database with demo users and sample records
npm run seed

# 5. Start the development server
npm run dev
```

The server starts at `http://localhost:3000`.

```bash
# Verify
curl http://localhost:3000/health
# → {"status":"ok"}
```

**Interactive docs:** open `http://localhost:3000/api-docs` in your browser.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon (auto-restart on file changes) |
| `npm start` | Start for production |
| `npm test` | Run the full Jest test suite |
| `npm run seed` | Seed the database with demo data |

---

## API Reference

Full interactive documentation is available at `/api-docs`. The table below is a quick reference.

### Authentication — public, no token required

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user → returns JWT + user |
| `POST` | `/api/auth/login` | Login → returns JWT + user |

### Users — ADMIN only

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/users` | Create user |
| `GET` | `/api/users` | List users (`?status=ACTIVE\|INACTIVE`) |
| `GET` | `/api/users/:id` | Get user by ID |
| `PATCH` | `/api/users/:id` | Update name, role, or status |
| `DELETE` | `/api/users/:id` | Permanently delete user |

### Financial Records

| Method | Endpoint | Min Role | Description |
|--------|----------|----------|-------------|
| `POST` | `/api/records` | ANALYST | Create a record |
| `GET` | `/api/records` | VIEWER | List with filters + pagination |
| `GET` | `/api/records/:id` | VIEWER | Get single record |
| `PATCH` | `/api/records/:id` | ANALYST | Update a record |
| `DELETE` | `/api/records/:id` | ADMIN | Soft-delete (sets `deletedAt`) |

**Filter params for `GET /api/records`:**

| Param | Type | Description |
|-------|------|-------------|
| `type` | `INCOME` \| `EXPENSE` | Exact match |
| `category` | string | Case-insensitive partial match |
| `startDate` / `endDate` | ISO 8601 | Date range |
| `minAmount` / `maxAmount` | number | Amount range |
| `page` | integer (default: `1`) | Pagination page |
| `limit` | integer (default: `20`) | Records per page |

### Dashboard Analytics

| Method | Endpoint | Min Role | Description |
|--------|----------|----------|-------------|
| `GET` | `/api/dashboard/summary` | VIEWER | Total income, expenses, net balance, record count |
| `GET` | `/api/dashboard/categories` | VIEWER | Per-category income/expense/net breakdown |
| `GET` | `/api/dashboard/recent` | VIEWER | Recent records, sorted by date desc (`?limit=10`) |
| `GET` | `/api/dashboard/trends` | ANALYST | Monthly income vs expense (`?months=6`) |

### Response Shape

All endpoints return a consistent envelope:

```json
// Success
{ "success": true, "data": { ... } }

// Paginated list
{ "success": true, "records": [...], "meta": { "total": 42, "page": 1, "limit": 20, "totalPages": 3 } }

// Error
{ "success": false, "error": { "message": "...", "details": { "field": "reason" } } }
```

### Example: Login

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "admin@finance.com", "password": "pass123" }
```

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "_id": "...", "name": "Admin User", "email": "admin@finance.com", "role": "ADMIN", "status": "ACTIVE" }
  }
}
```

### Example: Create Record

```http
POST /api/records
Authorization: Bearer <token>
Content-Type: application/json

{ "amount": 5000, "type": "INCOME", "category": "Salary", "date": "2025-04-01T00:00:00.000Z", "description": "Monthly salary" }
```

```json
{
  "success": true,
  "data": {
    "_id": "...", "amount": 5000, "type": "INCOME", "category": "Salary",
    "createdBy": { "name": "Admin User", "email": "admin@finance.com" },
    "deletedAt": null
  }
}
```

### Example: Dashboard Summary

```http
GET /api/dashboard/summary
Authorization: Bearer <token>
```

```json
{
  "success": true,
  "data": { "totalIncome": 36700, "totalExpenses": 17005, "netBalance": 19695, "totalRecords": 25 }
}
```

---

## Design Decisions

### Layered Architecture (Routes → Controllers → Services → Models)

Each layer has a single responsibility. Routes apply middleware. Controllers handle HTTP concerns (parsing, status codes, response shape) but contain zero business logic. Services own all DB queries and aggregation logic. This makes the codebase easy to test and extend — services can be unit-tested independently of HTTP.

### Role-Based Access Control via Middleware

`authenticate` and `authorize(...roles)` are composable middleware functions applied per-route rather than globally. This makes the permission model explicit and auditable from the route file alone — no need to trace through the controller to understand who can access what.

### Soft Deletes for Financial Records

`deletedAt: Date | null` on `FinancialRecord` rather than hard deletion. All queries include `{ deletedAt: null }` in the filter. The compound index `{ type, category, date, deletedAt }` ensures these queries stay fast. Financial data should never be permanently erased — soft deletes preserve the audit trail and allow recovery.

### MongoDB Aggregation Pipelines for Analytics

Dashboard endpoints run `$match → $group → $sort` entirely in MongoDB rather than fetching records and computing in Node.js. This keeps Node.js stateless and offloads heavy computation to the database layer, which is more efficient at scale.

### Centralised Error Handler

A single `errorHandler` middleware at the end of the middleware stack handles all error types: Zod `ZodError` → 400, Mongoose `ValidationError` / `CastError` → 400, duplicate key `11000` → 409, JWT errors → 401, and operational `AppError` → its own `statusCode`. Controllers never format error responses — they either return data or throw. This eliminates duplicated error-handling logic across controllers.

### Zod for Validation

Zod's `z.coerce` is essential here: HTTP query parameters arrive as strings (`?page=2`), but the service needs numbers. `z.coerce.number()` handles the conversion without manual transforms. Zod also replaces `req.query`/`req.body` with the parsed, type-safe output via the `validate` middleware factory, so downstream code can trust its input types.

---

## Assumptions

1. **Soft deletes only for records** — financial data should be auditable; `deletedAt` preserves history without exposing deleted records to normal queries.
2. **Three-tier RBAC** — VIEWER (read-only), ANALYST (read + create/edit records + trends), ADMIN (full access). Designed around a team product where not all users should modify data.
3. **`createdBy` derived from JWT** — record ownership comes from the authenticated token, not a client-supplied field, to prevent a user from attributing records to someone else.
4. **No pagination on users** — user lists are assumed to be small (internal team size). Records and dashboard endpoints are paginated.
5. **Single-tenant** — all users share one record pool. Multi-tenancy would require a `workspaceId` field on both models and scoped queries.

---

## Tradeoffs & Future Improvements

| Area | Current State | Improvement |
|------|--------------|-------------|
| **Token revocation** | Single JWT, 7-day expiry, no blacklist | Add a refresh token in an `httpOnly` cookie; short-lived access token (15 min) |
| **Rate limiting** | Global IP-based (100 req / 15 min) | Per-user rate limiting on write endpoints to prevent abuse from authenticated accounts |
| **Regex injection** | `category` filter uses a raw regex | Escape user input and cap string length to prevent ReDoS |
| **Aggregation pagination** | `getCategoryTotals` and `getMonthlyTrends` return all results | Add cursor-based pagination for large datasets |
| **Correlation IDs** | No request trace ID | Add `x-request-id` header for distributed tracing |
| **Input sanitisation** | Basic Zod validation | Add `xss` / `mongo-sanitize` at the boundary layer |

---

## Testing

```bash
npm test
```

Uses `mongodb-memory-server` — **no external MongoDB required**. Tests run sequentially (`--runInBand`) to avoid mongoose connection conflicts across test files.

**Test coverage:**

| Suite | Tests | What's covered |
|-------|-------|---------------|
| `auth.test.js` | 8 | Register, duplicate email, validation errors, login, wrong password, inactive user, missing token, bad token |
| `records.test.js` | 10 | ANALYST create, VIEWER blocked (403), invalid payload (400), list with filters, pagination meta, invalid ObjectId (400), non-existent ID (404), soft-delete, excluded from list |
| `dashboard.test.js` | 7 | Summary correctness, zero state, category grouping, monthly trends, VIEWER blocked from trends (403), months out of range (400), recent sort order |

```
Test Suites: 3 passed, 3 total
Tests:       27 passed, 27 total
```

---

## Deployment

### Step 1 — MongoDB Atlas (free cloud database)

1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) → create a free **M0** cluster
2. **Database Access** → add a user with password auth → save credentials
3. **Network Access** → add `0.0.0.0/0` (allow all IPs — required for cloud platforms)
4. **Connect → Drivers** → copy the connection string:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/finance_dashboard
   ```

### Step 2 — Deploy to Railway

1. Push the repo to GitHub
2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
3. Under **Variables**, set:

   | Key | Value |
   |-----|-------|
   | `MONGO_URI` | Atlas connection string |
   | `JWT_SECRET` | Long random string |
   | `PORT` | `3000` |
   | `NODE_ENV` | `production` |

4. Railway auto-deploys. Live URL: `https://zorvyn-assessment-production-1210.up.railway.app`
5. Swagger docs: `https://zorvyn-assessment-production-1210.up.railway.app/api-docs`

### Step 3 — Seed production data

```bash
# Update .env with the Atlas MONGO_URI, then:
npm run seed
```

This creates the 3 demo users and 25 sample records against the live database.

### Alternative: Render

Deploy via [render.com](https://render.com) (Build: `npm install`, Start: `npm start`). Note: the free tier hibernates after 15 min of inactivity — the first wake-up request takes ~30 seconds.
