-- Add Przelewy24 payment columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS p24_session_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS p24_order_id INTEGER;

-- Index for looking up orders by P24 session ID (used in callback)
CREATE INDEX IF NOT EXISTS idx_orders_p24_session_id ON orders(p24_session_id) WHERE p24_session_id IS NOT NULL;

-- Allow users to update their own orders (needed for p24_session_id save from register route)
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE USING (auth.uid() = customer_id);
