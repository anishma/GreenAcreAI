# Supabase Setup Guide

## Task 0.3.1: Complete Supabase Project Configuration

Your Supabase project URL: `https://dausexigvmmppiijbzyb.supabase.co`

---

## Step 1: Get Your API Keys

1. Go to your project: https://app.supabase.com/project/dausexigvmmppiijbzyb/settings/api
2. Copy the following keys:
   - **Publishable API Key** (starts with `sb_publishable_...`) - **RECOMMENDED for client-side**
   - **Secret Key** (starts with `sb_secret_...`) - **RECOMMENDED for server-side**
   - **Anon Key** (JWT format, starts with `eyJ...`) - Legacy fallback for publishable key
   - **Service Role Key** (JWT format, starts with `eyJ...`) - Legacy fallback for secret key

### Key Differences:
- **Publishable Key** (`sb_publishable_...`): Modern, independently rotatable, preferred for client-side. Replaces anon key.
- **Secret Key** (`sb_secret_...`): Modern, independently rotatable, preferred for server-side. Has browser protection and replaces service_role key.
- **Anon Key** (JWT): Legacy, still works but being phased out. Use publishable key instead.
- **Service Role Key** (JWT): Legacy, still works but being phased out. Use secret key instead.

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
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx  # From Step 1 (RECOMMENDED)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx                     # From Step 1 (legacy fallback)
SUPABASE_SECRET_KEY=sb_secret_xxxxx                        # From Step 1 (RECOMMENDED for server)
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx                         # From Step 1 (legacy fallback)
SUPABASE_DB_PASSWORD=YourPasswordHere                      # From Step 2

# Update the DATABASE_URL with your password:
DATABASE_URL=postgresql://postgres:YourPasswordHere@db.dausexigvmmppiijbzyb.supabase.co:5432/postgres
```

---

## Step 7: Verify Setup

Once you've filled in the `.env.local` file, we'll verify the connection in the next task.

---

## Checklist

- [x] Copied Publishable API Key (sb_publishable_...) to `.env.local` - RECOMMENDED
- [x] Copied Secret Key (sb_secret_...) to `.env.local` - RECOMMENDED
- [x] Copied Anon Key (eyJ...) to `.env.local` - Legacy fallback
- [x] Copied Service Role Key (eyJ...) to `.env.local` - Legacy fallback
- [x] Set/Reset database password
- [x] Updated DATABASE_URL with password
- [x] Enabled uuid-ossp extension
- [x] Enabled pgcrypto extension
- [x] Enabled Email auth provider
- [x] Created `call-recordings` storage bucket (private)
- [x] Google OAuth enabled (waiting for Task 0.3.7 - Google Cloud Console setup)

---

## What's Next?

After completing this checklist, let me know and I'll:
1. Mark Task 0.3.1 as complete
2. Commit the configuration files
3. Move on to Task 0.3.2 (Vercel Project Setup)
