-- Test script to debug RLS issues
-- Run this in Supabase SQL Editor to check if policies are working

-- First, check if you can see your user record
SELECT id, auth_id, full_name 
FROM public.users 
WHERE auth_id = auth.uid();

-- Check what auth.uid() returns
SELECT auth.uid() as current_auth_id;

-- Test if the subquery in the policy would work
SELECT id 
FROM public.users 
WHERE auth_id = auth.uid()
LIMIT 1;

-- Try to see quiz_attempts directly (should be filtered by RLS)
SELECT 
  qa.id,
  qa.user_id,
  qa.completed_at,
  u.auth_id
FROM quiz_attempts qa
LEFT JOIN users u ON qa.user_id = u.id
ORDER BY qa.completed_at DESC
LIMIT 5;


