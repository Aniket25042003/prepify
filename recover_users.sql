-- User Recovery and Diagnosis Script
-- This script will help us understand what happened and potentially recover user data

-- 1. Check the current state of all tables
SELECT 'Current Database State' as section;

SELECT 'auth.users count' as table_name, COUNT(*) as record_count FROM auth.users
UNION ALL
SELECT 'user_profiles count' as table_name, COUNT(*) as record_count FROM user_profiles
UNION ALL
SELECT 'interview_sessions count' as table_name, COUNT(*) as record_count FROM interview_sessions
UNION ALL
SELECT 'coding_sessions count' as table_name, COUNT(*) as record_count FROM coding_sessions;

-- 2. Check if there are any user_profiles that might have user data
SELECT 'User Profiles Data' as section;
SELECT 
  id,
  email,
  full_name,
  created_at,
  updated_at
FROM user_profiles
ORDER BY created_at;

-- 3. Check interview_sessions for user_id references
SELECT 'Interview Sessions User IDs' as section;
SELECT DISTINCT user_id, COUNT(*) as session_count
FROM interview_sessions
GROUP BY user_id
ORDER BY session_count DESC;

-- 4. Check coding_sessions for user_id references
SELECT 'Coding Sessions User IDs' as section;
SELECT DISTINCT user_id, COUNT(*) as session_count
FROM coding_sessions
GROUP BY user_id
ORDER BY session_count DESC;

-- 5. Look for any remaining user data in the system
SELECT 'Potential User Recovery Data' as section;

-- Check if we can reconstruct users from profiles
SELECT 
  'From user_profiles' as source,
  id as potential_user_id,
  email,
  full_name,
  created_at
FROM user_profiles
WHERE id IS NOT NULL
ORDER BY created_at;

-- Check if we can find user data from sessions
SELECT 
  'From interview_sessions' as source,
  user_id as potential_user_id,
  COUNT(*) as session_count,
  MIN(created_at) as earliest_session,
  MAX(created_at) as latest_session
FROM interview_sessions
GROUP BY user_id
ORDER BY session_count DESC;

-- Check if we can find user data from coding sessions
SELECT 
  'From coding_sessions' as source,
  user_id as potential_user_id,
  COUNT(*) as session_count,
  MIN(created_at) as earliest_session,
  MAX(created_at) as latest_session
FROM coding_sessions
GROUP BY user_id
ORDER BY session_count DESC;

-- 6. Check if there are any backup or audit tables
SELECT 'Checking for backup/audit tables' as section;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%backup%' 
   OR table_name LIKE '%audit%' 
   OR table_name LIKE '%log%'
   OR table_name LIKE '%history%';

-- 7. Check if we can find any user data in the auth schema
SELECT 'Auth Schema Check' as section;
SELECT 
  'auth.users' as table_name,
  COUNT(*) as record_count
FROM auth.users;

-- 8. If we have user_profiles but no auth.users, we need to recreate users
-- This is a critical recovery step
SELECT 'Recovery Plan' as section;

-- Show what users we can potentially recreate
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.created_at,
  (SELECT COUNT(*) FROM interview_sessions int_sessions WHERE int_sessions.user_id = up.id) as interview_count,
  (SELECT COUNT(*) FROM coding_sessions cod_sessions WHERE cod_sessions.user_id = up.id) as coding_count
FROM user_profiles up
ORDER BY up.created_at;

-- 9. Emergency Recovery: If we have user_profiles but no auth.users
-- We need to manually recreate the auth.users records
-- This is a manual process that requires Supabase admin access

SELECT 'EMERGENCY RECOVERY NEEDED' as warning;
SELECT 
  'If auth.users is empty but user_profiles exist, you need to:' as instruction,
  '1. Contact Supabase support immediately' as step1,
  '2. Provide them with the user_profiles data' as step2,
  '3. They can help restore the auth.users table' as step3,
  '4. This is a critical data loss situation' as step4;

-- 10. Show all remaining data for manual recovery
SELECT 'All Remaining Data for Manual Recovery' as section;

SELECT 'user_profiles' as table_name, row_to_json(up.*) as data
FROM user_profiles up
UNION ALL
SELECT 'interview_sessions' as table_name, row_to_json(int_sessions.*) as data
FROM interview_sessions int_sessions
UNION ALL
SELECT 'coding_sessions' as table_name, row_to_json(cod_sessions.*) as data
FROM coding_sessions cod_sessions; 