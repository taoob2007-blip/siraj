-- ============================================================
-- Email Audit Log Table
-- Run once in Supabase SQL Editor (or via supabase db push)
-- ============================================================

CREATE TABLE IF NOT EXISTS email_logs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Email identity
  email_type       TEXT        NOT NULL,   -- rfq_invitation | winner_notification | loser_notification | buyer_confirmation | supplier_signing_link | otp_verification
  to_email         TEXT        NOT NULL,
  subject          TEXT        NOT NULL,
  html_body        TEXT        NOT NULL,   -- stored for cron retry replay

  -- Delivery tracking
  status           TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'sent', 'failed', 'dead')),
  attempts         INTEGER     NOT NULL DEFAULT 0,
  resend_email_id  TEXT,                   -- Resend's email ID (for provider-side tracking)
  last_error       TEXT,

  -- Contextual metadata (rfq_id, contract_id, user_id, supplier_email, etc.)
  metadata         JSONB       NOT NULL DEFAULT '{}',

  -- Timestamps
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at          TIMESTAMPTZ,
  next_retry_at    TIMESTAMPTZ           -- set when status = 'failed', cleared on success
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

-- Cron job picks up failed emails due for retry
CREATE INDEX IF NOT EXISTS email_logs_retry_idx
  ON email_logs (status, next_retry_at)
  WHERE status = 'failed';

-- Monitoring: find all failed/dead emails quickly
CREATE INDEX IF NOT EXISTS email_logs_status_idx
  ON email_logs (status, created_at DESC);

-- Lookup by RFQ or contract via metadata (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS email_logs_metadata_idx
  ON email_logs USING GIN (metadata);

-- ── RLS ───────────────────────────────────────────────────────────────────────
-- email_logs is written by the service-role key (bypasses RLS).
-- No user-facing reads — disable RLS to keep it simple.
ALTER TABLE email_logs DISABLE ROW LEVEL SECURITY;

-- ── Useful monitoring queries ─────────────────────────────────────────────────
--
-- Failed emails in the last 24 hours:
--   SELECT email_type, to_email, subject, attempts, last_error, created_at
--   FROM email_logs
--   WHERE status IN ('failed', 'dead') AND created_at > NOW() - INTERVAL '24 hours'
--   ORDER BY created_at DESC;
--
-- Delivery success rate today:
--   SELECT status, COUNT(*) FROM email_logs
--   WHERE created_at > NOW() - INTERVAL '24 hours'
--   GROUP BY status;
--
-- Emails pending retry:
--   SELECT COUNT(*) FROM email_logs
--   WHERE status = 'failed' AND next_retry_at <= NOW();
