-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "business_name" VARCHAR(255) NOT NULL,
    "owner_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "service_areas" JSONB NOT NULL DEFAULT '[]',
    "pricing_tiers" JSONB NOT NULL DEFAULT '[]',
    "allows_generic_quotes" BOOLEAN NOT NULL DEFAULT true,
    "generic_quote_disclaimer" TEXT DEFAULT 'Prices vary by property size. Address needed for exact quote.',
    "google_calendar_refresh_token" TEXT,
    "google_calendar_access_token" TEXT,
    "google_calendar_token_expires_at" TIMESTAMPTZ,
    "calendar_id" VARCHAR(255),
    "phone_number" VARCHAR(20),
    "phone_number_sid" VARCHAR(255),
    "vapi_agent_id" VARCHAR(255),
    "vapi_phone_number_id" VARCHAR(255),
    "stripe_customer_id" VARCHAR(255),
    "stripe_subscription_id" VARCHAR(255),
    "subscription_status" VARCHAR(50) NOT NULL DEFAULT 'trialing',
    "subscription_plan" VARCHAR(50) NOT NULL DEFAULT 'starter',
    "trial_ends_at" TIMESTAMPTZ,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'America/New_York',
    "business_hours" JSONB NOT NULL DEFAULT '{"monday": {"start": "09:00", "end": "17:00"}}',
    "notification_preferences" JSONB NOT NULL DEFAULT '{"sms_new_lead": true, "sms_new_booking": true}',
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_step" VARCHAR(50) NOT NULL DEFAULT 'signup',
    "test_call_completed" BOOLEAN NOT NULL DEFAULT false,
    "test_call_completed_at" TIMESTAMPTZ,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "tenant_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'owner',
    "auth_user_id" UUID,
    "full_name" VARCHAR(255),
    "avatar_url" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "last_login_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calls" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "tenant_id" UUID NOT NULL,
    "vapi_call_id" VARCHAR(255),
    "phone_number_called" VARCHAR(20),
    "caller_phone_number" VARCHAR(20),
    "started_at" TIMESTAMPTZ,
    "ended_at" TIMESTAMPTZ,
    "duration_seconds" INTEGER,
    "status" VARCHAR(50),
    "end_reason" VARCHAR(100),
    "transcript" JSONB,
    "transcript_text" TEXT,
    "summary" TEXT,
    "outcome" VARCHAR(50),
    "quote_amount" DECIMAL(10,2),
    "booking_made" BOOLEAN NOT NULL DEFAULT false,
    "lead_captured" BOOLEAN NOT NULL DEFAULT false,
    "recording_url" TEXT,
    "recording_duration" INTEGER,
    "cost_total" DECIMAL(10,4),
    "cost_breakdown" JSONB,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "tenant_id" UUID NOT NULL,
    "call_id" UUID,
    "phone_number" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "name" VARCHAR(255),
    "address" TEXT,
    "city" VARCHAR(100),
    "state" VARCHAR(2),
    "zip" VARCHAR(10),
    "lot_size_sqft" INTEGER,
    "parcel_id" VARCHAR(100),
    "quote_amount" DECIMAL(10,2),
    "quote_frequency" VARCHAR(50),
    "service_type" VARCHAR(100) NOT NULL DEFAULT 'lawn_mowing',
    "status" VARCHAR(50) NOT NULL DEFAULT 'new',
    "source" VARCHAR(50) NOT NULL DEFAULT 'phone_call',
    "follow_up_needed" BOOLEAN NOT NULL DEFAULT false,
    "follow_up_at" TIMESTAMPTZ,
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "tenant_id" UUID NOT NULL,
    "call_id" UUID,
    "lead_id" UUID,
    "scheduled_at" TIMESTAMPTZ NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "service_type" VARCHAR(100) NOT NULL DEFAULT 'lawn_mowing',
    "estimated_price" DECIMAL(10,2),
    "customer_name" VARCHAR(255),
    "customer_phone" VARCHAR(20),
    "customer_email" VARCHAR(255),
    "property_address" TEXT,
    "property_city" VARCHAR(100),
    "property_state" VARCHAR(2),
    "property_zip" VARCHAR(10),
    "google_calendar_event_id" VARCHAR(255),
    "status" VARCHAR(50) NOT NULL DEFAULT 'confirmed',
    "cancellation_reason" TEXT,
    "confirmation_sent" BOOLEAN NOT NULL DEFAULT false,
    "reminder_sent" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "notes" TEXT,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" UUID NOT NULL,
    "call_id" UUID,
    "booking_id" UUID,
    "type" VARCHAR(50) NOT NULL,
    "template" VARCHAR(100),
    "recipient" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(255),
    "body" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "provider" VARCHAR(50),
    "provider_message_id" VARCHAR(255),
    "error_message" TEXT,
    "sent_at" TIMESTAMPTZ,
    "delivered_at" TIMESTAMPTZ,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" VARCHAR(50) NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "headers" JSONB,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMPTZ,
    "error_message" TEXT,
    "tenant_id" UUID,
    "call_id" UUID,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_daily" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "date" DATE NOT NULL,
    "tenant_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_calls" INTEGER NOT NULL DEFAULT 0,
    "successful_calls" INTEGER NOT NULL DEFAULT 0,
    "failed_calls" INTEGER NOT NULL DEFAULT 0,
    "avg_call_duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "quotes_given" INTEGER NOT NULL DEFAULT 0,
    "bookings_made" INTEGER NOT NULL DEFAULT 0,
    "leads_captured" INTEGER NOT NULL DEFAULT 0,
    "quote_to_booking_rate" DECIMAL(5,2),
    "total_cost" DECIMAL(10,2),
    "avg_cost_per_call" DECIMAL(10,4),

    CONSTRAINT "analytics_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_templates" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "tiers" JSONB NOT NULL,

    CONSTRAINT "pricing_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_email_key" ON "tenants"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_phone_number_key" ON "tenants"("phone_number");

-- CreateIndex
CREATE INDEX "tenants_email_idx" ON "tenants"("email");

-- CreateIndex
CREATE INDEX "idx_tenants_phone_number" ON "tenants"("phone_number");

-- CreateIndex
CREATE INDEX "idx_tenants_stripe_customer_id" ON "tenants"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "tenants_status_idx" ON "tenants"("status");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_user_id_key" ON "users"("auth_user_id");

-- CreateIndex
CREATE INDEX "idx_users_tenant_id" ON "users"("tenant_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_auth_user_id" ON "users"("auth_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "calls_vapi_call_id_key" ON "calls"("vapi_call_id");

-- CreateIndex
CREATE INDEX "idx_calls_tenant_id" ON "calls"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_calls_created_at" ON "calls"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_calls_vapi_call_id" ON "calls"("vapi_call_id");

-- CreateIndex
CREATE INDEX "idx_calls_caller_phone_number" ON "calls"("caller_phone_number");

-- CreateIndex
CREATE INDEX "idx_calls_outcome" ON "calls"("outcome");

-- CreateIndex
CREATE INDEX "idx_calls_tenant_created" ON "calls"("tenant_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_leads_tenant_id" ON "leads"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_leads_call_id" ON "leads"("call_id");

-- CreateIndex
CREATE INDEX "idx_leads_phone_number" ON "leads"("phone_number");

-- CreateIndex
CREATE INDEX "idx_leads_status" ON "leads"("status");

-- CreateIndex
CREATE INDEX "idx_leads_created_at" ON "leads"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_leads_tenant_status" ON "leads"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "idx_bookings_tenant_id" ON "bookings"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_bookings_call_id" ON "bookings"("call_id");

-- CreateIndex
CREATE INDEX "idx_bookings_lead_id" ON "bookings"("lead_id");

-- CreateIndex
CREATE INDEX "idx_bookings_scheduled_at" ON "bookings"("scheduled_at");

-- CreateIndex
CREATE INDEX "idx_bookings_status" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "idx_bookings_tenant_scheduled" ON "bookings"("tenant_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "idx_notifications_tenant_id" ON "notifications"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_notifications_created_at" ON "notifications"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_notifications_status" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "idx_webhooks_source" ON "webhooks"("source");

-- CreateIndex
CREATE INDEX "idx_webhooks_event_type" ON "webhooks"("event_type");

-- CreateIndex
CREATE INDEX "idx_webhooks_created_at" ON "webhooks"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_webhooks_processed" ON "webhooks"("processed");

-- CreateIndex
CREATE INDEX "idx_analytics_daily_tenant_date" ON "analytics_daily"("tenant_id", "date" DESC);

-- CreateIndex
CREATE INDEX "idx_analytics_daily_date" ON "analytics_daily"("date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "analytics_daily_date_tenant_id_key" ON "analytics_daily"("date", "tenant_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_daily" ADD CONSTRAINT "analytics_daily_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
