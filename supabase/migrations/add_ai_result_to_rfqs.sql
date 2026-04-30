-- Add ai_result column to rfqs table for persisting full AI decision output
-- Shape: { scores[], best_supplier, ranking[], reasoning, tradeoffs, risks, negotiation, scored_at }
ALTER TABLE rfqs
  ADD COLUMN IF NOT EXISTS ai_result JSONB DEFAULT NULL;

-- GIN index for faster JSONB lookups
CREATE INDEX IF NOT EXISTS idx_rfqs_ai_result ON rfqs USING GIN (ai_result);
