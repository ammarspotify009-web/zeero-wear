-- ============================================================
-- ZEERO WEAR — Supabase Connection Pool & RLS Fix Script
-- ============================================================
-- HOW TO RUN:
--   1. Go to https://supabase.com/dashboard
--   2. Select your project (pgefuifzakvratosuqoy)
--   3. Click "SQL Editor" in the left sidebar
--   4. Paste this entire file and click "Run"
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- STEP 1: Check current RLS status on all tables
-- ════════════════════════════════════════════════════════════
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;


-- ════════════════════════════════════════════════════════════
-- STEP 2: Fix RLS policies on ORDERS table
-- Bad/missing policies here cause queries to hang and never
-- release their DB connection — direct cause of pool exhaustion.
-- ════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Allow anon insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow anon select orders" ON public.orders;
DROP POLICY IF EXISTS "Allow anon update orders" ON public.orders;
DROP POLICY IF EXISTS "Allow anon delete orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert" ON public.orders;
DROP POLICY IF EXISTS "Allow public select" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zeero_orders_insert"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "zeero_orders_select"
  ON public.orders FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "zeero_orders_update"
  ON public.orders FOR UPDATE
  TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "zeero_orders_delete"
  ON public.orders FOR DELETE
  TO anon, authenticated
  USING (true);


-- ════════════════════════════════════════════════════════════
-- STEP 3: Fix RLS policies on ABANDONED_CARTS table
-- ════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Allow anon insert abandoned_carts" ON public.abandoned_carts;
DROP POLICY IF EXISTS "Allow anon select abandoned_carts" ON public.abandoned_carts;
DROP POLICY IF EXISTS "Allow anon upsert abandoned_carts" ON public.abandoned_carts;
DROP POLICY IF EXISTS "Allow anon delete abandoned_carts" ON public.abandoned_carts;

ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zeero_carts_insert"
  ON public.abandoned_carts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "zeero_carts_select"
  ON public.abandoned_carts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "zeero_carts_update"
  ON public.abandoned_carts FOR UPDATE
  TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "zeero_carts_delete"
  ON public.abandoned_carts FOR DELETE
  TO anon, authenticated
  USING (true);


-- ════════════════════════════════════════════════════════════
-- STEP 4: Fix RLS on QUERIES table
-- ════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Allow anon insert queries" ON public.queries;
DROP POLICY IF EXISTS "Allow anon select queries" ON public.queries;
DROP POLICY IF EXISTS "Allow anon update queries" ON public.queries;

ALTER TABLE public.queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zeero_queries_insert"
  ON public.queries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "zeero_queries_select"
  ON public.queries FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "zeero_queries_update"
  ON public.queries FOR UPDATE
  TO anon, authenticated
  USING (true) WITH CHECK (true);


-- ════════════════════════════════════════════════════════════
-- STEP 5: Kill currently stuck/idle connections RIGHT NOW
-- Run this if pool is full at this moment
-- ════════════════════════════════════════════════════════════
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE 
  state = 'idle'
  AND query_start < NOW() - INTERVAL '5 minutes'
  AND datname = current_database();


-- ════════════════════════════════════════════════════════════
-- STEP 6: Verify connection status after cleanup
-- ════════════════════════════════════════════════════════════
SELECT 
  state,
  COUNT(*) as connection_count,
  MAX(NOW() - query_start) as oldest_query_age
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state
ORDER BY connection_count DESC;
