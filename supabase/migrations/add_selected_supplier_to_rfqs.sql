-- Add selected_supplier column to track buyer's accepted decision
ALTER TABLE rfqs
  ADD COLUMN IF NOT EXISTS selected_supplier TEXT DEFAULT NULL;
