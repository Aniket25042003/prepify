-- Fix User Relationships and Data Consistency
-- Run this script in your Supabase SQL Editor

-- 1. First, let's diagnose the issue by checking the current state
SELECT 'Current User Count' as info, COUNT(*) as count FROM auth.users;

SELECT 'User Profiles Count' as info, COUNT(*) as count FROM user_profiles;

SELECT 'Interview Sessions Count' as info, COUNT(*) as count FROM interview_sessions;

SELECT 'Coding Sessions Count' as info, COUNT(*) as count FROM coding_sessions;

-- 2. Check for orphaned records (records that don't have valid user references)
SELECT 'Orphaned User Profiles' as info, COUNT(*) as count 
FROM user_profiles up 
WHERE NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = up.id);

SELECT 'Orphaned Interview Sessions' as info, COUNT(*) as count 
FROM interview_sessions int_sessions 
WHERE NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = int_sessions.user_id);

SELECT 'Orphaned Coding Sessions' as info, COUNT(*) as count 
FROM coding_sessions cod_sessions 
WHERE NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = cod_sessions.user_id);

-- 3. Check if there are any user_id mismatches
SELECT 'User ID Mismatches' as info, 
       COUNT(*) as count
FROM (
  SELECT DISTINCT user_id 
  FROM interview_sessions 
  WHERE user_id NOT IN (SELECT id FROM user_profiles)
  UNION
  SELECT DISTINCT user_id 
  FROM coding_sessions 
  WHERE user_id NOT IN (SELECT id FROM user_profiles)
) mismatches;

-- 4. Clean up orphaned records
DELETE FROM interview_sessions 
WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM coding_sessions 
WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM user_profiles 
WHERE id NOT IN (SELECT id FROM auth.users);

-- 5. Ensure all users have profiles (create missing ones)
INSERT INTO user_profiles (id, email, full_name, email_verified, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.email, ''),
  COALESCE(
    au.raw_user_meta_data->>'full_name', 
    au.raw_user_meta_data->>'name',
    au.raw_user_meta_data->>'display_name',
    SPLIT_PART(COALESCE(au.email, ''), '@', 1)
  ),
  COALESCE(au.email_confirmed_at IS NOT NULL, false),
  au.created_at,
  au.updated_at
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = au.id);

-- 6. Verify the fix
SELECT 'After Fix - User Count' as info, COUNT(*) as count FROM auth.users;

SELECT 'After Fix - User Profiles Count' as info, COUNT(*) as count FROM user_profiles;

SELECT 'After Fix - Interview Sessions Count' as info, COUNT(*) as count FROM interview_sessions;

SELECT 'After Fix - Coding Sessions Count' as info, COUNT(*) as count FROM coding_sessions;

-- 7. Test the relationship by checking if all sessions have valid user references
SELECT 'Valid Interview Sessions' as info, COUNT(*) as count 
FROM interview_sessions int_sessions 
WHERE EXISTS (SELECT 1 FROM auth.users au WHERE au.id = int_sessions.user_id);

SELECT 'Valid Coding Sessions' as info, COUNT(*) as count 
FROM coding_sessions cod_sessions 
WHERE EXISTS (SELECT 1 FROM auth.users au WHERE au.id = cod_sessions.user_id);

-- 8. Show sample data to verify relationships
SELECT 'Sample User Data' as info, 
       au.id as user_id, 
       au.email,
       up.full_name,
       (SELECT COUNT(*) FROM interview_sessions int_sessions WHERE int_sessions.user_id = au.id) as interview_count,
       (SELECT COUNT(*) FROM coding_sessions cod_sessions WHERE cod_sessions.user_id = au.id) as coding_count
FROM auth.users au
LEFT JOIN user_profiles up ON up.id = au.id
LIMIT 5; 