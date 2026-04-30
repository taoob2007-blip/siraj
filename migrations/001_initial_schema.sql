-- ============================================================================
-- SIRAJ – FINAL DATABASE SCHEMA (PRODUCTION READY)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. RFQs
-- ============================================================================

CREATE TABLE public.rfqs (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID NOT NULL,
title TEXT NOT NULL,
description TEXT,

status TEXT DEFAULT 'active', -- active, closed, archived

created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
deleted_at TIMESTAMP WITH TIME ZONE,

CONSTRAINT rfqs_title_not_empty CHECK (length(trim(title)) > 0)
);

CREATE INDEX idx_rfqs_user_id ON public.rfqs(user_id);
CREATE INDEX idx_rfqs_status ON public.rfqs(status);
CREATE INDEX idx_rfqs_created_at ON public.rfqs(created_at DESC);

-- ============================================================================
-- 2. Suppliers
-- ============================================================================

CREATE TABLE public.suppliers (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID NOT NULL,

name TEXT NOT NULL,
email TEXT NOT NULL,

created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

CONSTRAINT suppliers_name_not_empty CHECK (length(trim(name)) > 0),
CONSTRAINT suppliers_email_not_empty CHECK (length(trim(email)) > 0),
CONSTRAINT suppliers_unique_email_per_user UNIQUE (user_id, email)
);

CREATE INDEX idx_suppliers_user_id ON public.suppliers(user_id);
CREATE INDEX idx_suppliers_email ON public.suppliers(email);

-- ============================================================================
-- 3. RFQ Invites (CORE)
-- ============================================================================

CREATE TABLE public.rfq_invites (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,

supplier_email TEXT NOT NULL, -- fallback if supplier not registered

token UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,

responded BOOLEAN DEFAULT FALSE,
responded_at TIMESTAMP WITH TIME ZONE,

created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

CONSTRAINT rfq_invites_email_not_empty CHECK (length(trim(supplier_email)) > 0),
CONSTRAINT rfq_invites_unique_per_rfq UNIQUE (rfq_id, supplier_email)
);

CREATE INDEX idx_rfq_invites_rfq_id ON public.rfq_invites(rfq_id);
CREATE INDEX idx_rfq_invites_token ON public.rfq_invites(token);
CREATE INDEX idx_rfq_invites_supplier_id ON public.rfq_invites(supplier_id);

-- ============================================================================
-- 4. Responses (CONNECTED TO INVITE)
-- ============================================================================

CREATE TABLE public.responses (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

invite_id UUID NOT NULL REFERENCES public.rfq_invites(id) ON DELETE CASCADE,
rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,

supplier_email TEXT NOT NULL,

answers JSONB NOT NULL DEFAULT '{}',

price NUMERIC(15,2),
delivery_days INTEGER,

created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

CONSTRAINT responses_price_positive CHECK (price IS NULL OR price > 0),
CONSTRAINT responses_delivery_days_positive CHECK (delivery_days IS NULL OR delivery_days > 0),

CONSTRAINT responses_unique_invite UNIQUE (invite_id)
);

CREATE INDEX idx_responses_rfq_id ON public.responses(rfq_id);
CREATE INDEX idx_responses_invite_id ON public.responses(invite_id);

-- ============================================================================
-- 🔐 RLS (SECURE & OPTIMIZED)
-- ============================================================================

ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- RFQs
CREATE POLICY rfqs_user_policy ON public.rfqs
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Suppliers
CREATE POLICY suppliers_user_policy ON public.suppliers
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Invites (via RFQ ownership)
CREATE POLICY invites_user_policy ON public.rfq_invites
FOR ALL USING (
EXISTS (
SELECT 1 FROM public.rfqs
WHERE rfqs.id = rfq_invites.rfq_id
AND rfqs.user_id = auth.uid()
)
)
WITH CHECK (
EXISTS (
SELECT 1 FROM public.rfqs
WHERE rfqs.id = rfq_invites.rfq_id
AND rfqs.user_id = auth.uid()
)
);

-- Responses (via RFQ ownership)
CREATE POLICY responses_user_policy ON public.responses
FOR ALL USING (
EXISTS (
SELECT 1 FROM public.rfqs
WHERE rfqs.id = responses.rfq_id
AND rfqs.user_id = auth.uid()
)
)
WITH CHECK (
EXISTS (
SELECT 1 FROM public.rfqs
WHERE rfqs.id = responses.rfq_id
AND rfqs.user_id = auth.uid()
)
);
