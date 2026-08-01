-- Run this in Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → paste & run

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_status TEXT
  NOT NULL
  DEFAULT 'not_applicable'
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'not_applicable'));

-- Update existing online orders (non-COD) that have Approved status → mark as paid
UPDATE orders
SET payment_status = 'paid'
WHERE "paymentMethod" != 'Cash on Delivery'
  AND status = 'Approved'
  AND payment_status = 'not_applicable';

-- Existing COD orders already have 'not_applicable' from DEFAULT above
-- Done! Verify with:
-- SELECT id, "paymentMethod", payment_status, status FROM orders ORDER BY "createdAt" DESC LIMIT 20;
