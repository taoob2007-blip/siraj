-- Ensure user_id column exists on categories
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop any existing policy to avoid conflicts
DROP POLICY IF EXISTS "Users own categories" ON categories;

-- Users can only read, insert, update, and delete their own categories
CREATE POLICY "Users own categories"
ON categories
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
