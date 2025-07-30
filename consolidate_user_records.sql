-- Consolidate User Records and Fix Foreign Key Relationships
-- This script will identify duplicate users and consolidate them

-- 1. First, let's see what we're dealing with
SELECT 'Current State Analysis' as section;

-- Show all users with their associated data
SELECT 
  au.id as user_id,
  au.email,
  au.created_at as user_created,
  (SELECT COUNT(*) FROM user_profiles up WHERE up.id = au.id) as profile_exists,
  (SELECT COUNT(*) FROM interview_sessions int_sessions WHERE int_sessions.user_id = au.id) as interview_count,
  (SELECT COUNT(*) FROM coding_sessions cod_sessions WHERE cod_sessions.user_id = au.id) as coding_count
FROM auth.users au
ORDER BY au.email, au.created_at;

-- 2. Identify duplicate users (same email, different IDs)
SELECT 'Duplicate Users Found' as section;

WITH duplicate_users AS (
  SELECT 
    email,
    COUNT(*) as user_count,
    ARRAY_AGG(id ORDER BY created_at) as user_ids,
    ARRAY_AGG(created_at ORDER BY created_at) as created_dates
  FROM auth.users 
  WHERE email IS NOT NULL AND email != ''
  GROUP BY email
  HAVING COUNT(*) > 1
)
SELECT 
  email,
  user_count,
  user_ids,
  created_dates
FROM duplicate_users;

-- 3. Create a mapping table to consolidate users
-- We'll keep the oldest user record and migrate data from newer ones
CREATE TEMP TABLE user_consolidation_map AS
WITH duplicate_users AS (
  SELECT 
    email,
    COUNT(*) as user_count,
    ARRAY_AGG(id ORDER BY created_at) as user_ids,
    ARRAY_AGG(created_at ORDER BY created_at) as created_dates
  FROM auth.users 
  WHERE email IS NOT NULL AND email != ''
  GROUP BY email
  HAVING COUNT(*) > 1
)
SELECT 
  email,
  user_ids[1] as primary_user_id,  -- Keep the oldest user
  unnest(user_ids[2:]) as duplicate_user_id  -- All other users to be consolidated
FROM duplicate_users;

-- 4. Show the consolidation plan
SELECT 'Consolidation Plan' as section;
SELECT 
  email,
  primary_user_id,
  duplicate_user_id
FROM user_consolidation_map;

-- 5. Migrate data from duplicate users to primary users
-- Update interview_sessions
UPDATE interview_sessions 
SET user_id = ucm.primary_user_id
FROM user_consolidation_map ucm
WHERE interview_sessions.user_id = ucm.duplicate_user_id;

-- Update coding_sessions
UPDATE coding_sessions 
SET user_id = ucm.primary_user_id
FROM user_consolidation_map ucm
WHERE coding_sessions.user_id = ucm.duplicate_user_id;

-- Update user_profiles (merge data if needed)
UPDATE user_profiles 
SET 
  email = COALESCE(up_primary.email, up_duplicate.email),
  full_name = COALESCE(up_primary.full_name, up_duplicate.full_name),
  avatar_url = COALESCE(up_primary.avatar_url, up_duplicate.avatar_url),
  email_verified = up_primary.email_verified OR up_duplicate.email_verified,
  updated_at = NOW()
FROM user_consolidation_map ucm
JOIN user_profiles up_duplicate ON up_duplicate.id = ucm.duplicate_user_id
JOIN user_profiles up_primary ON up_primary.id = ucm.primary_user_id
WHERE user_profiles.id = ucm.primary_user_id;

-- 6. Delete duplicate user profiles
DELETE FROM user_profiles 
WHERE id IN (
  SELECT duplicate_user_id 
  FROM user_consolidation_map
);

-- 7. Delete duplicate auth.users (this will cascade to any remaining references)
DELETE FROM auth.users 
WHERE id IN (
  SELECT duplicate_user_id 
  FROM user_consolidation_map
);

-- 8. Verify the consolidation worked
SELECT 'After Consolidation - Final State' as section;

SELECT 
  au.id as user_id,
  au.email,
  au.created_at as user_created,
  (SELECT COUNT(*) FROM user_profiles up WHERE up.id = au.id) as profile_exists,
  (SELECT COUNT(*) FROM interview_sessions int_sessions WHERE int_sessions.user_id = au.id) as interview_count,
  (SELECT COUNT(*) FROM coding_sessions cod_sessions WHERE cod_sessions.user_id = au.id) as coding_count
FROM auth.users au
ORDER BY au.email, au.created_at;

-- 9. Final verification - ensure no orphaned records
SELECT 'Final Verification' as section;

SELECT 'Orphaned User Profiles' as check_type, COUNT(*) as count 
FROM user_profiles up 
WHERE NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = up.id);

SELECT 'Orphaned Interview Sessions' as check_type, COUNT(*) as count 
FROM interview_sessions int_sessions 
WHERE NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = int_sessions.user_id);

SELECT 'Orphaned Coding Sessions' as check_type, COUNT(*) as count 
FROM coding_sessions cod_sessions 
WHERE NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = cod_sessions.user_id);

-- 10. Show summary statistics
SELECT 'Summary Statistics' as section;

SELECT 
  'Total Users' as metric, COUNT(*) as value FROM auth.users
UNION ALL
SELECT 
  'Total User Profiles' as metric, COUNT(*) as value FROM user_profiles
UNION ALL
SELECT 
  'Total Interview Sessions' as metric, COUNT(*) as value FROM interview_sessions
UNION ALL
SELECT 
  'Total Coding Sessions' as metric, COUNT(*) as value FROM coding_sessions; 