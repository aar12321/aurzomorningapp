-- =============================================
-- TEST SETUP - Run this to verify everything is working
-- =============================================

-- Test 1: Check if RLS is properly configured
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- Test 2: Check policies on users table
SELECT 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- Test 3: Check if trigger function exists
SELECT 
  routine_name, 
  routine_type, 
  security_type 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Test 4: Check if trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Test 5: Check topics table has data
SELECT COUNT(*) as topic_count FROM public.topics;

-- Test 6: Check if we can insert into users table (this should work now)
-- This is just a test - don't actually run this in production
-- INSERT INTO public.users (auth_id, full_name, email, timezone) 
-- VALUES ('test-id', 'Test User', 'test@example.com', 'America/New_York');
