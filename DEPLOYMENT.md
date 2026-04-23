# Deployment Guide

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Vercel Setup](#vercel-setup)
- [Database Provisioning](#database-provisioning)
  - [Option A: Neon](#option-a-neon)
  - [Option B: Supabase](#option-b-supabase)
- [Environment Variables Configuration](#environment-variables-configuration)
- [Prisma Migrations](#prisma-migrations)
- [CI/CD with GitHub Integration](#cicd-with-github-integration)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Overview

This todo-app is built with **Next.js (App Router)** and **TypeScript**, using **Prisma** as the ORM and **PostgreSQL** as the database. The recommended deployment target is **Vercel** with a managed PostgreSQL provider such as **Neon** or **Supabase**.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- A [GitHub](https://github.com/) account with the repository pushed
- A [Vercel](https://vercel.com/) account
- A PostgreSQL database provider account ([Neon](https://neon.tech/) or [Supabase](https://supabase.com/))

---

## Vercel Setup

### 1. Import the Project

1. Log in to [Vercel](https://vercel.com/dashboard).
2. Click **"Add New…" → "Project"**.
3. Select **"Import Git Repository"** and choose your GitHub repository.
4. Vercel will auto-detect the Next.js framework. Confirm the following settings:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (or the appropriate subdirectory)
   - **Build Command:** `npx prisma generate && next build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`

### 2. Configure Build Settings

In the Vercel project settings under **Settings → General**:

| Setting          | Value                                    |
| ---------------- | ---------------------------------------- |
| Framework Preset | Next.js                                  |
| Build Command    | `npx prisma generate && next build`      |
| Install Command  | `npm install`                            |
| Node.js Version  | 18.x or 20.x                            |

### 3. Set Environment Variables

Navigate to **Settings → Environment Variables** and add all required variables (see [Environment Variables Configuration](#environment-variables-configuration) below).

### 4. Deploy

Click **"Deploy"**. Vercel will build and deploy the application. Subsequent pushes to the `main` branch will trigger automatic deployments.

---

## Database Provisioning

### Option A: Neon

[Neon](https://neon.tech/) provides serverless PostgreSQL with automatic scaling and branching.

1. **Create an account** at [neon.tech](https://neon.tech/).
2. **Create a new project:**
   - Choose a project name (e.g., `todo-app-production`).
   - Select the region closest to your Vercel deployment region.
3. **Copy the connection string** from the Neon dashboard. It will look like:
   ```
   postgresql://<user>:<password>@<host>/<database>?sslmode=require
   ```
4. **Set up connection pooling** (recommended for serverless):
   - In the Neon dashboard, navigate to **Connection Details**.
   - Enable **Connection Pooling** and copy the pooled connection string.
   - Use the pooled URL as `DATABASE_URL` and the direct (non-pooled) URL as `DIRECT_URL` in your environment variables.

**Example `.env` for Neon:**

```env
DATABASE_URL="postgresql://<user>:<password>@<host>.neon.tech/<database>?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://<user>:<password>@<host>.neon.tech/<database>?sslmode=require"
```

### Option B: Supabase

[Supabase](https://supabase.com/) provides a full PostgreSQL database with additional features.

1. **Create an account** at [supabase.com](https://supabase.com/).
2. **Create a new project:**
   - Choose a project name and set a strong database password.
   - Select the region closest to your Vercel deployment region.
3. **Get the connection string:**
   - Navigate to **Settings → Database**.
   - Copy the **Connection string** (URI format).
   - Replace `[YOUR-PASSWORD]` with the password you set during project creation.
4. **Set up connection pooling:**
   - Use the **Connection Pooling** URI (port `6543`) as `DATABASE_URL`.
   - Use the **Direct Connection** URI (port `5432`) as `DIRECT_URL`.

**Example `.env` for Supabase:**

```env
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/<database>?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/<database>"
```

---

## Environment Variables Configuration

The following environment variables must be configured in both your local `.env` file and in Vercel's project settings.

| Variable                | Required | Description                                              | Example                                                        |
| ----------------------- | -------- | -------------------------------------------------------- | -------------------------------------------------------------- |
| `DATABASE_URL`          | Yes      | PostgreSQL connection string (pooled for serverless)     | `postgresql://user:pass@host/db?sslmode=require`               |
| `DIRECT_URL`            | No       | Direct (non-pooled) PostgreSQL connection for migrations | `postgresql://user:pass@host/db?sslmode=require`               |
| `JWT_SECRET`            | Yes      | Secret key for signing JWT tokens (min 32 characters)    | `your-super-secret-jwt-key-at-least-32-chars`                  |
| `JWT_EXPIRES_IN`        | No       | JWT token expiration duration                            | `7d`                                                           |
| `NEXT_PUBLIC_APP_URL`   | No       | Public-facing application URL                            | `https://todo-app.vercel.app`                                  |
| `NODE_ENV`              | No       | Node environment (auto-set by Vercel)                    | `production`                                                   |

### Setting Variables in Vercel

1. Go to your project on Vercel.
2. Navigate to **Settings → Environment Variables**.
3. Add each variable with the appropriate value.
4. Select the environments where each variable should be available:
   - **Production** — for the `main` branch deployment
   - **Preview** — for pull request preview deployments
   - **Development** — for `vercel dev` local development

### Local Development

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/todo_app?schema=public"
JWT_SECRET="local-development-secret-key-at-least-32-characters"
JWT_EXPIRES_IN="7d"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **Important:** Never commit `.env` files to version control. Ensure `.env` is listed in `.gitignore`.

---

## Prisma Migrations

### Initial Setup

Generate the Prisma client and run migrations against your database:

```bash
# Generate Prisma client
npx prisma generate

# Create and apply migrations in development
npx prisma migrate dev --name init

# Apply migrations in production (non-interactive)
npx prisma migrate deploy
```

### Creating New Migrations

When you modify `prisma/schema.prisma`:

```bash
# Create a new migration
npx prisma migrate dev --name describe_your_change

# Example: adding a priority field to tasks
npx prisma migrate dev --name add_task_priority
```

### Production Migration Workflow

Migrations should be applied as part of the deployment process. Add the following to your build command in Vercel:

```
npx prisma generate && npx prisma migrate deploy && next build
```

Alternatively, configure this in `package.json`:

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build",
    "postinstall": "prisma generate"
  }
}
```

### Useful Prisma Commands

| Command                          | Description                                      |
| -------------------------------- | ------------------------------------------------ |
| `npx prisma generate`           | Regenerate the Prisma client                     |
| `npx prisma migrate dev`        | Create and apply migrations (development)        |
| `npx prisma migrate deploy`     | Apply pending migrations (production)            |
| `npx prisma migrate reset`      | Reset the database and reapply all migrations    |
| `npx prisma db seed`            | Run the seed script                              |
| `npx prisma studio`             | Open the Prisma Studio GUI                       |
| `npx prisma db push`            | Push schema changes without creating a migration |
| `npx prisma migrate status`     | Check the status of migrations                   |

### Seeding the Database

If a seed script is configured in `prisma/seed.ts`:

```bash
npx prisma db seed
```

---

## CI/CD with GitHub Integration

### Automatic Deployments via Vercel

Vercel integrates natively with GitHub. Once connected:

- **Production deployments** are triggered on every push to the `main` branch.
- **Preview deployments** are created for every pull request, providing a unique URL for testing.

### GitHub Actions (Optional)

For additional CI checks (linting, testing, type checking) before deployment, create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest

    env:
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/todo_app_test?schema=public"
      JWT_SECRET: "ci-test-secret-key-at-least-32-characters-long"

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: todo_app_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd="pg_isready -U postgres"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Run migrations
        run: npx prisma migrate deploy

      - name: Type check
        run: npx tsc --noEmit

      - name: Lint
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
```

### Branch Protection Rules

Configure the following branch protection rules on the `main` branch in GitHub:

1. Go to **Settings → Branches → Branch protection rules**.
2. Add a rule for `main`:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging (select the CI workflow)
   - ✅ Require branches to be up to date before merging

---

## Monitoring

### Vercel Analytics

1. Navigate to your project on Vercel.
2. Go to the **Analytics** tab.
3. Enable **Web Vitals** to track Core Web Vitals (LCP, FID, CLS).
4. Enable **Speed Insights** for detailed performance metrics.

### Vercel Logs

- **Runtime Logs:** Available under the **Logs** tab in your Vercel project dashboard. Filter by function, status code, or time range.
- **Build Logs:** Available on each deployment's detail page.

### Database Monitoring

#### Neon

- Use the **Monitoring** tab in the Neon dashboard to track:
  - Active connections
  - Query performance
  - Storage usage
  - Compute usage

#### Supabase

- Use the **Database → Reports** section to monitor:
  - Active connections
  - Query performance
  - Database size
  - API request volume

### Health Check Endpoint

Consider adding a health check API route at `src/app/api/health/route.ts`:

```typescript
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  try {
    // Optionally verify database connectivity here
    return NextResponse.json(
      { status: "ok", timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { status: "error", timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
```

### Uptime Monitoring

Use an external service to ping your health check endpoint:

- [UptimeRobot](https://uptimerobot.com/) (free tier available)
- [Better Uptime](https://betteruptime.com/)
- Vercel's built-in **Cron Jobs** to run periodic checks

---

## Troubleshooting

### Build Failures

#### `Error: Prisma client not generated`

**Cause:** The Prisma client was not generated before the build.

**Solution:** Ensure your build command includes `prisma generate`:

```bash
npx prisma generate && next build
```

Or add a `postinstall` script to `package.json`:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

#### `Error: P1001 - Can't reach database server`

**Cause:** The database connection string is incorrect or the database is not accessible.

**Solution:**
1. Verify `DATABASE_URL` is correctly set in Vercel environment variables.
2. Ensure the database server is running and accessible.
3. Check that SSL mode is enabled (`?sslmode=require`) for remote databases.
4. Verify the database provider's firewall/IP allowlist settings.

#### `Error: P2002 - Unique constraint failed`

**Cause:** Attempting to insert a duplicate value into a unique field.

**Solution:** Check your application logic for duplicate entries. This is typically an application-level issue, not a deployment issue.

### Migration Failures

#### `Error: P3009 - Migration failed to apply`

**Cause:** A migration could not be applied, often due to conflicting schema changes.

**Solution:**
1. Check the migration SQL in `prisma/migrations/` for errors.
2. If in development, reset the database: `npx prisma migrate reset`.
3. If in production, manually inspect the database state and resolve conflicts.

#### `Error: Migration has already been applied`

**Cause:** The migration was previously applied but the migrations table is out of sync.

**Solution:**
1. Run `npx prisma migrate status` to check the current state.
2. Use `npx prisma migrate resolve --applied <migration_name>` to mark a migration as applied.

### Runtime Errors

#### `Error: JWT_SECRET is not defined`

**Cause:** The `JWT_SECRET` environment variable is missing.

**Solution:** Add `JWT_SECRET` to your Vercel environment variables and redeploy.

#### `Error: Too many database connections`

**Cause:** Serverless functions are opening too many connections to the database.

**Solution:**
1. Use connection pooling (PgBouncer) via your database provider.
2. For Neon, append `?pgbouncer=true` to `DATABASE_URL`.
3. For Supabase, use the pooled connection string (port `6543`).
4. Set `DIRECT_URL` in your Prisma schema for migrations:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

#### `Error: 504 Gateway Timeout`

**Cause:** A serverless function exceeded the execution time limit.

**Solution:**
1. Optimize database queries (add indexes, reduce payload size).
2. Check for N+1 query problems and use Prisma's `include` or `select` to batch queries.
3. Increase the function timeout in `vercel.json` if needed:

```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### Environment Variable Issues

#### Variables not available at runtime

**Cause:** Variables were added after the last deployment, or are scoped to the wrong environment.

**Solution:**
1. Verify the variable is set for the correct environment (Production/Preview/Development).
2. Redeploy the application after adding or changing environment variables.
3. For client-side variables, ensure they are prefixed with `NEXT_PUBLIC_`.

#### Variables not available during build

**Cause:** Some variables are only available at runtime, not during the build step.

**Solution:** Ensure all variables needed during build are set in Vercel's environment variables settings and are available for the build environment.

### Common Vercel Deployment Issues

#### `Error: No Next.js version detected`

**Solution:** Ensure `next` is listed as a dependency in `package.json` (not just devDependencies).

#### Preview deployments not working

**Solution:**
1. Verify the GitHub integration is properly connected in Vercel.
2. Check that the repository has the Vercel GitHub App installed.
3. Ensure environment variables are enabled for the **Preview** environment.

---

## Quick Reference

### Deployment Checklist

- [ ] PostgreSQL database provisioned and connection string obtained
- [ ] `DATABASE_URL` set in Vercel environment variables
- [ ] `DIRECT_URL` set in Vercel environment variables (if using connection pooling)
- [ ] `JWT_SECRET` set in Vercel environment variables (min 32 characters)
- [ ] Build command configured: `npx prisma generate && npx prisma migrate deploy && next build`
- [ ] GitHub repository connected to Vercel
- [ ] Branch protection rules configured
- [ ] Initial deployment successful
- [ ] Health check endpoint verified
- [ ] Monitoring and alerting configured