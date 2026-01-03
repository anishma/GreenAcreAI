-- =====================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- =====================================================
--
-- Purpose: Enforce tenant isolation at the database level
-- All queries automatically filter by tenant_id based on authenticated user
-- This prevents data leaks between tenants even if application logic has bugs
--
-- How it works:
-- 1. Enable RLS on all tenant-scoped tables
-- 2. Create policies that check auth.uid() (Supabase auth user ID)
-- 3. Lookup tenant_id from users table for authenticated user
-- 4. Filter all queries to only show data for that tenant
-- =====================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Policy: Tenants table - users can only see their own tenant
CREATE POLICY tenant_isolation_policy ON tenants
  FOR ALL
  USING (id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

-- Policy: Users table - users can only see users in their tenant
CREATE POLICY users_tenant_isolation ON users
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

-- Policy: Calls table - users can only see calls for their tenant
CREATE POLICY calls_tenant_isolation ON calls
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

-- Policy: Leads table - users can only see leads for their tenant
CREATE POLICY leads_tenant_isolation ON leads
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

-- Policy: Bookings table - users can only see bookings for their tenant
CREATE POLICY bookings_tenant_isolation ON bookings
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

-- Policy: Notifications table - users can only see notifications for their tenant
CREATE POLICY notifications_tenant_isolation ON notifications
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

-- Policy: Analytics table - users can only see analytics for their tenant
CREATE POLICY analytics_tenant_isolation ON analytics_daily
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

-- =====================================================
-- NOTES
-- =====================================================
--
-- Testing RLS:
-- 1. Create test users with different tenant_ids
-- 2. Set auth.uid() in test session: SET LOCAL "request.jwt.claims" = '{"sub":"<user-id>"}'
-- 3. Query tables and verify only tenant-specific data is returned
--
-- Bypassing RLS (service role only):
-- - Supabase service role key bypasses RLS (use carefully in backend)
-- - Regular anon/authenticated keys respect RLS policies
--
-- Performance:
-- - Policies use a subquery to lookup tenant_id
-- - This is cached per statement, not per row (efficient)
-- - Indexes on auth_user_id and tenant_id ensure fast lookups
-- =====================================================
