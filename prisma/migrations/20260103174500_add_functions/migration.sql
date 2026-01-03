-- =====================================================
-- DATABASE FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Update updated_at timestamp on row updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON calls
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- BUSINESS LOGIC FUNCTIONS
-- =====================================================

-- Function: Get pricing quote for a given lot size
CREATE OR REPLACE FUNCTION get_quote_for_lot_size(
  p_tenant_id UUID,
  p_lot_size_sqft INTEGER,
  p_frequency VARCHAR(20) DEFAULT 'weekly' -- 'weekly' or 'biweekly'
)
RETURNS TABLE (
  weekly_price DECIMAL(10,2),
  biweekly_price DECIMAL(10,2),
  service_inclusions TEXT[],
  pricing_type VARCHAR(20),
  tier_min_sqft INTEGER,
  tier_max_sqft INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (tier->>'weekly_price')::DECIMAL(10,2) AS weekly_price,
    (tier->>'biweekly_price')::DECIMAL(10,2) AS biweekly_price,
    ARRAY(SELECT jsonb_array_elements_text(tier->'service_inclusions')) AS service_inclusions,
    COALESCE(tier->>'pricing_type', 'estimate')::VARCHAR(20) AS pricing_type,
    (tier->>'min_sqft')::INTEGER AS tier_min_sqft,
    (tier->>'max_sqft')::INTEGER AS tier_max_sqft
  FROM tenants,
       jsonb_array_elements(pricing_tiers) AS tier
  WHERE tenants.id = p_tenant_id
    AND (tier->>'min_sqft')::INTEGER <= p_lot_size_sqft
    AND (COALESCE(tier->>'max_sqft', '999999999'))::INTEGER >= p_lot_size_sqft
  ORDER BY (tier->>'min_sqft')::INTEGER DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function: Get generic price range for tenant (without specific address)
CREATE OR REPLACE FUNCTION get_generic_price_range(
  p_tenant_id UUID,
  p_frequency VARCHAR(20) DEFAULT 'weekly'
)
RETURNS TABLE (
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  disclaimer TEXT
) AS $$
DECLARE
  v_disclaimer TEXT;
  v_allows_generic BOOLEAN;
BEGIN
  SELECT allows_generic_quotes, generic_quote_disclaimer
  INTO v_allows_generic, v_disclaimer
  FROM tenants
  WHERE id = p_tenant_id;

  IF NOT v_allows_generic THEN
    RETURN QUERY SELECT NULL::DECIMAL(10,2), NULL::DECIMAL(10,2), 'Address required for quote'::TEXT;
    RETURN;
  END IF;

  IF p_frequency = 'weekly' THEN
    RETURN QUERY
    SELECT
      MIN((tier->>'weekly_price')::DECIMAL(10,2)) AS min_price,
      MAX((tier->>'weekly_price')::DECIMAL(10,2)) AS max_price,
      v_disclaimer
    FROM tenants,
         jsonb_array_elements(pricing_tiers) AS tier
    WHERE tenants.id = p_tenant_id
      AND tier->>'weekly_price' IS NOT NULL;
  ELSE
    RETURN QUERY
    SELECT
      MIN((tier->>'biweekly_price')::DECIMAL(10,2)) AS min_price,
      MAX((tier->>'biweekly_price')::DECIMAL(10,2)) AS max_price,
      v_disclaimer
    FROM tenants,
         jsonb_array_elements(pricing_tiers) AS tier
    WHERE tenants.id = p_tenant_id
      AND tier->>'biweekly_price' IS NOT NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if address is in service area
CREATE OR REPLACE FUNCTION is_in_service_area(
  p_tenant_id UUID,
  p_zip VARCHAR(10)
)
RETURNS BOOLEAN AS $$
DECLARE
  service_areas JSONB;
BEGIN
  SELECT tenants.service_areas INTO service_areas
  FROM tenants
  WHERE id = p_tenant_id;

  RETURN service_areas @> to_jsonb(p_zip);
END;
$$ LANGUAGE plpgsql;

-- Function: Check if timestamp falls within business hours (for appointment scheduling)
-- NOTE: This does NOT limit when AI answers calls - AI is available 24/7
-- This function is used to determine available appointment times only
CREATE OR REPLACE FUNCTION is_within_business_hours(
  p_tenant_id UUID,
  p_timestamp TIMESTAMPTZ DEFAULT NOW()
)
RETURNS BOOLEAN AS $$
DECLARE
  v_business_hours JSONB;
  v_timezone VARCHAR(50);
  v_day_of_week TEXT;
  v_current_time TIME;
  v_day_hours JSONB;
BEGIN
  SELECT business_hours, timezone
  INTO v_business_hours, v_timezone
  FROM tenants
  WHERE id = p_tenant_id;

  -- Convert timestamp to tenant's timezone and get day of week
  v_day_of_week := LOWER(TO_CHAR(p_timestamp AT TIME ZONE v_timezone, 'Day'));
  v_current_time := (p_timestamp AT TIME ZONE v_timezone)::TIME;

  -- Get hours for this day of week (trim spaces from day name)
  v_day_hours := v_business_hours->TRIM(v_day_of_week);

  -- If no hours configured for this day, not available for appointments
  IF v_day_hours IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if time slot is within service hours
  RETURN v_current_time >= (v_day_hours->>'start')::TIME
    AND v_current_time <= (v_day_hours->>'end')::TIME;
END;
$$ LANGUAGE plpgsql;

-- Function: Update lead status when booking is made
CREATE OR REPLACE FUNCTION update_lead_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lead_id IS NOT NULL THEN
    UPDATE leads
    SET status = 'booked',
        updated_at = NOW()
    WHERE id = NEW.lead_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Automatically update lead status when booking is created
CREATE TRIGGER booking_updates_lead AFTER INSERT ON bookings
FOR EACH ROW EXECUTE FUNCTION update_lead_on_booking();

-- =====================================================
-- DATABASE VIEWS
-- =====================================================

-- View: Call summary with lead/booking info
CREATE VIEW call_summary AS
SELECT
  c.id,
  c.tenant_id,
  c.created_at,
  c.caller_phone_number,
  c.duration_seconds,
  c.outcome,
  c.quote_amount,
  l.id AS lead_id,
  l.name AS lead_name,
  l.address AS lead_address,
  b.id AS booking_id,
  b.scheduled_at AS booking_time,
  b.status AS booking_status
FROM calls c
LEFT JOIN leads l ON c.id = l.call_id
LEFT JOIN bookings b ON c.id = b.call_id;
