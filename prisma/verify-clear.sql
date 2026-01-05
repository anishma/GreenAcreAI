-- Verify all tables are empty
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
SELECT 'pricing_templates', COUNT(*) FROM pricing_templates
ORDER BY table_name;
