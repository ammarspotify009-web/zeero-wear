-- Run this in Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → paste & run

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_status TEXT
  NOT NULL
  DEFAULT 'not_applicable'
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'not_applicable'));

-- Set our confirmed test order to 'paid' manually
UPDATE orders
SET payment_status = 'paid'
WHERE id = 'ZW-MSAWC5OX';

-- Done! Verify with:
-- SELECT id, "paymentMethod", payment_status, status FROM orders ORDER BY "createdAt" DESC LIMIT 20;

-- Existing COD orders already have 'not_applicable' from DEFAULT above
-- Done! Verify with:
-- SELECT id, "paymentMethod", payment_status, status FROM orders ORDER BY "createdAt" DESC LIMIT 20;
