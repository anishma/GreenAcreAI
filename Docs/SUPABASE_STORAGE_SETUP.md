# Supabase Storage Setup Guide

## Overview
This guide covers setting up the `call-recordings` storage bucket in Supabase with proper Row-Level Security (RLS) policies for tenant isolation.

---

## Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name**: `call-recordings`
   - **Public**: **Unchecked** (private bucket - we use signed URLs)
   - **File size limit**: 100 MB (or adjust based on your needs)
   - **Allowed MIME types**: `audio/mpeg, audio/mp3, audio/wav` (optional)

5. Click **Create bucket**

---

## Step 2: Configure Row-Level Security (RLS)

### Enable RLS on Storage Objects

RLS is automatically enabled for Supabase Storage. You need to create policies for the `storage.objects` table.

### Policy 1: Allow Service Role to Manage All Files

This policy allows your backend (using `SUPABASE_SERVICE_ROLE_KEY`) to upload, read, and delete recordings.

```sql
-- This is already handled by Supabase's default service_role permissions
-- No additional policy needed for service role
```

### Policy 2: Allow Tenants to Read Their Own Recordings

This policy ensures authenticated users can only access recordings belonging to their tenant.

```sql
-- Policy: "Tenant can read own call recordings"
CREATE POLICY "Tenant can read own call recordings"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'call-recordings' AND
  (storage.foldername(name))[1] IN (
    SELECT tenant_id::text
    FROM users
    WHERE auth_user_id = auth.uid()
  )
);
```

**Explanation**:
- `bucket_id = 'call-recordings'` - Only applies to our recordings bucket
- `storage.foldername(name))[1]` - Extracts the first folder from the path (`tenant_id/call_id.mp3` → `tenant_id`)
- Checks if the folder name (tenant_id) matches the user's tenant_id from the `users` table

### Policy 3: Prevent Tenants from Uploading (Optional)

Since uploads are handled server-side only, you can optionally block client uploads:

```sql
-- Policy: "Block client uploads"
CREATE POLICY "Block client uploads"
ON storage.objects
FOR INSERT
TO authenticated
USING (false);
```

### Policy 4: Prevent Tenants from Deleting (Optional)

Block client deletions (deletions happen server-side only):

```sql
-- Policy: "Block client deletions"
CREATE POLICY "Block client deletions"
ON storage.objects
FOR DELETE
TO authenticated
USING (false);
```

---

## Step 3: Enable Realtime (Optional)

If you want real-time notifications when recordings are uploaded:

1. Go to **Database** → **Replication**
2. Find `storage.objects` table
3. Enable replication for `INSERT` and `UPDATE` events

---

## Step 4: Verify Setup

### Test 1: Upload via Service Role

Run this test in your backend (e.g., in a test script):

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Upload test file
const { data, error } = await supabase.storage
  .from('call-recordings')
  .upload('test-tenant-id/test-call.mp3', 'test data', {
    contentType: 'audio/mpeg',
  })

console.log('Upload result:', { data, error })

// Generate signed URL
const { data: signedData } = await supabase.storage
  .from('call-recordings')
  .createSignedUrl('test-tenant-id/test-call.mp3', 60 * 60)

console.log('Signed URL:', signedData?.signedUrl)
```

**Expected**:
- ✅ Upload succeeds
- ✅ Signed URL generated
- ✅ URL is accessible

### Test 2: Tenant Isolation

Test that users cannot access other tenants' recordings:

```typescript
// As user from tenant A
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Try to list files from tenant B
const { data, error } = await supabase.storage
  .from('call-recordings')
  .list('tenant-b-id')

console.log('Should be empty or error:', { data, error })
```

**Expected**:
- ✅ Returns empty array or access denied error
- ❌ Should NOT return tenant B's files

---

## File Path Structure

Recordings are stored with this structure:

```
call-recordings/
├── {tenant-id-1}/
│   ├── {call-id-1}.mp3
│   ├── {call-id-2}.mp3
│   └── {call-id-3}.mp3
├── {tenant-id-2}/
│   ├── {call-id-4}.mp3
│   └── {call-id-5}.mp3
└── ...
```

This structure:
- ✅ Isolates recordings by tenant
- ✅ Makes RLS policies straightforward
- ✅ Enables easy bulk operations per tenant
- ✅ Simplifies backup and migration

---

## RLS Policy Testing SQL

You can test policies directly in the Supabase SQL editor:

```sql
-- Test as authenticated user
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO 'user-auth-id-here';

-- Try to read files
SELECT * FROM storage.objects
WHERE bucket_id = 'call-recordings'
LIMIT 10;

-- Should only return files from user's tenant

-- Reset
RESET role;
```

---

## Troubleshooting

### Issue: "new row violates row-level security policy"

**Cause**: Service role is not being used for uploads

**Solution**: Ensure you're using `SUPABASE_SERVICE_ROLE_KEY` in backend:

```typescript
// ❌ Wrong - uses anon key
const supabase = createClient(url, anonKey)

// ✅ Correct - uses service role
const supabase = createClient(url, serviceRoleKey)
```

### Issue: "Cannot read file - permission denied"

**Cause**: RLS policy is too restrictive

**Solution**: Check policy SQL:
1. Ensure `bucket_id` matches exactly
2. Verify `foldername` extraction is correct
3. Test with simplified policy first

### Issue: Signed URLs not working

**Cause**: Bucket is set to public or policy blocks access

**Solution**:
1. Ensure bucket is **private**
2. Verify policies allow SELECT for authenticated users
3. Check URL hasn't expired

### Issue: Files not organizing by tenant

**Cause**: Upload path doesn't include tenant ID

**Solution**: Always upload with path `{tenantId}/{callId}.mp3`:

```typescript
const filePath = `${tenantId}/${callId}.mp3`
await supabase.storage.from('call-recordings').upload(filePath, buffer)
```

---

## Security Best Practices

1. **Never use service role key on client side**
   - Service role bypasses ALL RLS
   - Only use in backend/server code
   - Keep `SUPABASE_SERVICE_ROLE_KEY` in `.env` (not `.env.local` committed to git)

2. **Use signed URLs for playback**
   - Don't expose permanent URLs
   - Set appropriate expiration (1 hour for playback, 1 year for archival)
   - Generate new URL each time user accesses recording

3. **Validate tenant access in backend**
   - Before generating signed URL, verify user belongs to tenant
   - Use tRPC context's `tenantId` for validation

4. **Enable audit logging**
   - Monitor storage access in Supabase logs
   - Alert on unusual access patterns

5. **Regular cleanup**
   - Set up automated cleanup for old recordings (e.g., > 1 year)
   - Implement soft delete before hard delete

---

## Advanced: Lifecycle Management

### Auto-delete old recordings

Create a Supabase Edge Function to run nightly:

```typescript
// supabase/functions/cleanup-old-recordings/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Find recordings older than 1 year
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const { data: oldCalls } = await supabase
    .from('calls')
    .select('vapi_call_id, tenant_id')
    .lt('created_at', oneYearAgo.toISOString())
    .not('recording_url', 'is', null)

  // Delete recordings
  for (const call of oldCalls || []) {
    const path = `${call.tenant_id}/${call.vapi_call_id}.mp3`
    await supabase.storage.from('call-recordings').remove([path])
  }

  return new Response(JSON.stringify({ deleted: oldCalls?.length || 0 }))
})
```

Schedule with cron:
```bash
supabase functions deploy cleanup-old-recordings
supabase functions schedule cleanup-old-recordings --cron "0 2 * * *"  # 2 AM daily
```

---

## Environment Variables Required

Ensure these are set in your `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."  # For client-side auth
SUPABASE_SERVICE_ROLE_KEY="eyJ..."      # For backend uploads/admin ops
```

---

## Testing Checklist

- [ ] Bucket created and set to **private**
- [ ] RLS policy allows tenant to read own files
- [ ] RLS policy blocks tenant from reading other tenant's files
- [ ] Service role can upload files
- [ ] Client cannot upload files directly
- [ ] Signed URLs work and respect expiration
- [ ] File path structure follows `{tenant_id}/{call_id}.mp3`
- [ ] Recordings display in call detail page
- [ ] Audio player works with signed URLs

---

## Support

If you encounter issues:
1. Check Supabase logs: Dashboard → Logs → Storage
2. Test policies in SQL editor
3. Verify environment variables are set correctly
4. Check browser console for client errors
5. Review server logs for upload errors

---

## References

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Row-Level Security Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Helper Functions](https://supabase.com/docs/reference/javascript/storage-from-upload)
