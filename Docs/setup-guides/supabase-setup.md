# Supabase Setup Guide

## Task 0.3.1: Complete Supabase Project Configuration

Your Supabase project URL: `https://dausexigvmmppiijbzyb.supabase.co`

---

## Step 1: Get Your API Keys

1. Go to your project: https://app.supabase.com/project/dausexigvmmppiijbzyb/settings/api
2. Copy the following keys:
   - **Publishable API Key** (starts with `sb_publishable_...`) - **RECOMMENDED**
   - **Anon Key** (JWT format, starts with `eyJ...`) - Legacy fallback
   - **Service Role Key** (JWT format, starts with `eyJ...`) - Server-side only, PRIVATE

### Key Differences:
- **Publishable Key** (`sb_publishable_...`): Modern, independently rotatable, preferred for client-side
- **Anon Key** (JWT): Legacy, still works but being phased out
- **Service Role Key**: Bypasses Row-Level Security, server-side only, NEVER expose to client

---

## Step 2: Database Password

### Option A: Reset Password (Recommended)
1. Go to: https://app.supabase.com/project/dausexigvmmppiijbzyb/settings/database
2. Scroll to **"Database Password"**
3. Click **"Reset database password"**
4. Enter a strong password (save it in your password manager)
5. Click **"Update password"**

### Option B: Via SQL
1. Go to SQL Editor: https://app.supabase.com/project/dausexigvmmppiijbzyb/sql/new
2. Run:
```sql
ALTER USER postgres WITH PASSWORD 'YourNewSecurePassword123!';
```

---

## Step 3: Enable PostgreSQL Extensions

1. Go to SQL Editor: https://app.supabase.com/project/dausexigvmmppiijbzyb/sql/new
2. Run this SQL:

```sql
-- Enable UUID generation functions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

3. Click **"Run"**
4. Verify success (should see "Success. No rows returned")

---

## Step 4: Configure Authentication Providers

1. Go to Authentication > Providers: https://app.supabase.com/project/dausexigvmmppiijbzyb/auth/providers
2. **Enable Email Provider:**
   - Toggle **"Email"** to ON
   - Enable **"Confirm email"** for production security
3. **Enable Google OAuth (Optional for MVP):**
   - Toggle **"Google"** to ON
   - You'll configure OAuth credentials in Task 0.3.7 (Google Cloud Console)
   - Leave blank for now

---

## Step 5: Create Storage Bucket for Call Recordings

1. Go to Storage: https://app.supabase.com/project/dausexigvmmppiijbzyb/storage/buckets
2. Click **"New bucket"**
3. Enter details:
   - **Name**: `call-recordings`
   - **Public bucket**: ❌ **NO** (keep private)
   - **File size limit**: 50 MB (default is fine)
   - **Allowed MIME types**: Leave empty for now (will configure later)
4. Click **"Create bucket"**

---

## Step 6: Update .env.local File

Open `/Users/anishmamavuram/PersonalProjects/GreenAcreAI/.env.local` and fill in:

```bash
# Already filled in:
NEXT_PUBLIC_SUPABASE_URL=https://dausexigvmmppiijbzyb.supabase.co

# Fill in these values:
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx  # From Step 1
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx                     # From Step 1 (fallback)
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx                         # From Step 1 (PRIVATE)
SUPABASE_DB_PASSWORD=YourPasswordHere                      # From Step 2

# Update the DATABASE_URL with your password:
DATABASE_URL=postgresql://postgres:YourPasswordHere@db.dausexigvmmppiijbzyb.supabase.co:5432/postgres
```

---

## Step 7: Verify Setup

Once you've filled in the `.env.local` file, we'll verify the connection in the next task.

---

## Checklist

- [ ] Copied Publishable API Key to `.env.local`
- [ ] Copied Anon Key to `.env.local`
- [ ] Copied Service Role Key to `.env.local`
- [ ] Set/Reset database password
- [ ] Updated DATABASE_URL with password
- [ ] Enabled uuid-ossp extension
- [ ] Enabled pgcrypto extension
- [ ] Enabled Email auth provider
- [ ] Created `call-recordings` storage bucket (private)

---

## What's Next?

After completing this checklist, let me know and I'll:
1. Mark Task 0.3.1 as complete
2. Commit the configuration files
3. Move on to Task 0.3.2 (Vercel Project Setup)
