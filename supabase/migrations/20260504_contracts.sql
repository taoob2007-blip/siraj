-- ============================================================================
-- SIRAJ – Contracts table (complete schema)
-- Run once in Supabase SQL Editor. Safe to re-run (idempotent).
-- ============================================================================

-- ── 1. Create contracts table ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.contracts (
  id                           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id                       UUID        REFERENCES public.rfqs(id) ON DELETE CASCADE,
  user_id                      UUID        NOT NULL,
  supplier_email               TEXT        NOT NULL,

  price                        NUMERIC(15,2),
  delivery_days                INTEGER,

  status                       TEXT        NOT NULL DEFAULT 'pending'
                                           CHECK (status IN ('pending', 'signed', 'cancelled')),
  notes                        TEXT,

  -- Buyer signature fields
  buyer_signature              TEXT,
  signed_at                    TIMESTAMPTZ,
  signer_ip                    TEXT,
  signer_user_agent            TEXT,
  signature_method             TEXT,

  -- OTP verification (one-time use before signing)
  otp_verified                 BOOLEAN     NOT NULL DEFAULT FALSE,
  verification_code            TEXT,
  verification_code_expires_at TIMESTAMPTZ,

  -- Supplier signing (via tokenised link)
  signing_token                UUID        NOT NULL DEFAULT gen_random_uuid(),
  supplier_signature           TEXT,
  supplier_signed_at           TIMESTAMPTZ,

  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Add missing columns to existing table (safe if table already exists) ───

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS buyer_signature              TEXT,
  ADD COLUMN IF NOT EXISTS signed_at                    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signer_ip                    TEXT,
  ADD COLUMN IF NOT EXISTS signer_user_agent            TEXT,
  ADD COLUMN IF NOT EXISTS signature_method             TEXT,
  ADD COLUMN IF NOT EXISTS otp_verified                 BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verification_code            TEXT,
  ADD COLUMN IF NOT EXISTS verification_code_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signing_token                UUID        NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS supplier_signature           TEXT,
  ADD COLUMN IF NOT EXISTS supplier_signed_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ── 3. Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS contracts_rfq_id_idx      ON public.contracts(rfq_id);
CREATE INDEX IF NOT EXISTS contracts_user_id_idx     ON public.contracts(user_id);
CREATE INDEX IF NOT EXISTS contracts_signing_tok_idx ON public.contracts(signing_token);

-- ── 4. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own contracts" ON public.contracts;
CREATE POLICY "Users own contracts"
  ON public.contracts
  FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 5. contract_logs table (audit trail) ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.contract_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID        NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  event       TEXT        NOT NULL,
  user_id     UUID,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contract_logs_contract_id_idx ON public.contract_logs(contract_id);

ALTER TABLE public.contract_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own contract logs" ON public.contract_logs;
CREATE POLICY "Users read own contract logs"
  ON public.contract_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts
      WHERE contracts.id      = contract_logs.contract_id
        AND contracts.user_id = auth.uid()
    )
  );
