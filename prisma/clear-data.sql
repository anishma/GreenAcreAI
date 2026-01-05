-- Clear all data from the database for fresh testing
-- This script deletes data in the correct order to respect foreign key constraints

-- Delete dependent data first (in order of dependencies)
DELETE FROM webhooks;
DELETE FROM notifications;
DELETE FROM bookings;
DELETE FROM calls;
DELETE FROM leads;
DELETE FROM analytics_daily;
DELETE FROM pricing_templates;
DELETE FROM users;

-- Delete tenant data last (since everything depends on tenants)
DELETE FROM tenants;

-- Verify tables are empty
SELECT 'tenants' as table_name, COUNT(*) as count FROM tenants
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'calls', COUNT(*) FROM calls
UNION ALL
SELECT 'leads', COUNT(*) FROM leads
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'webhooks', COUNT(*) FROM webhooks
UNION ALL
SELECT 'analytics_daily', COUNT(*) FROM analytics_daily
UNION ALL
SELECT 'pricing_templates', COUNT(*) FROM pricing_templates;
