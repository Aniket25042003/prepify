-- Debug Interview Sessions Issue
-- This script will help identify why interview sessions are showing 0

-- 1. Check current state of all tables
SELECT 'Current Database State' as section;

SELECT 
  'auth.users' as table_name,
  COUNT(*) as record_count
FROM auth.users
UNION ALL
SELECT 
  'user_profiles' as table_name,
  COUNT(*) as record_count
FROM user_profiles
UNION ALL
SELECT 
  'interview_sessions' as table_name,
  COUNT(*) as record_count
FROM interview_sessions
UNION ALL
SELECT 
  'coding_sessions' as table_name,
  COUNT(*) as record_count
FROM coding_sessions;

-- 2. Check if there are any interview sessions at all
SELECT 'Interview Sessions Data' as section;

SELECT 
  id,
  user_id,
  role,
  company,
  interview_type,
  duration,
  created_at
FROM interview_sessions
ORDER BY created_at DESC;

-- 3. Check if users have any interview sessions
SELECT 'Users and Their Interview Sessions' as section;

SELECT 
  au.id as user_id,
  au.email,
  up.full_name,
  COUNT(int_sessions.id) as interview_count,
  COUNT(cod_sessions.id) as coding_count
FROM auth.users au
LEFT JOIN user_profiles up ON up.id = au.id
LEFT JOIN interview_sessions int_sessions ON int_sessions.user_id = au.id
LEFT JOIN coding_sessions cod_sessions ON cod_sessions.user_id = au.id
GROUP BY au.id, au.email, up.full_name
ORDER BY interview_count DESC, coding_count DESC;

-- 4. Check RLS policies for interview_sessions
SELECT 'RLS Policies for interview_sessions' as section;

SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'interview_sessions';

-- 5. Test inserting a sample interview session
SELECT 'Testing Interview Session Insert' as section;

-- Get the first user to test with
DO $$
DECLARE
  test_user_id uuid;
  insert_result record;
BEGIN
  -- Get the first user
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing with user ID: %', test_user_id;
    
    -- Try to insert a test interview session
    INSERT INTO interview_sessions (
      user_id,
      role,
      company,
      interview_type,
      duration,
      resume,
      job_description,
      additional_notes,
      summary
    ) VALUES (
      test_user_id,
      'Test Role',
      'Test Company',
      'Technical',
      30,
      'Test resume content',
      'Test job description',
      'Test additional notes',
      'Test interview summary'
    ) RETURNING id, user_id, role INTO insert_result;
    
    RAISE NOTICE 'Successfully inserted interview session: ID=%, User=%, Role=%', 
      insert_result.id, insert_result.user_id, insert_result.role;
    
    -- Clean up the test data
    DELETE FROM interview_sessions WHERE id = insert_result.id;
    RAISE NOTICE 'Test data cleaned up';
    
  ELSE
    RAISE NOTICE 'No users found to test with';
  END IF;
END $$;

-- 6. Check for any constraint violations
SELECT 'Checking for Constraint Issues' as section;

-- Check if the interview_sessions table has the correct structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'interview_sessions'
ORDER BY ordinal_position;

-- 7. Check if there are any foreign key issues
SELECT 'Foreign Key Check' as section;

SELECT 
  'Interview sessions with invalid user_id' as check_type,
  COUNT(*) as count
FROM interview_sessions int_sessions
WHERE NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = int_sessions.user_id);

-- 8. Show recent activity
SELECT 'Recent Activity' as section;

SELECT 
  'Recent interview sessions' as activity_type,
  created_at,
  role,
  company,
  interview_type
FROM interview_sessions
ORDER BY created_at DESC
LIMIT 5;

-- 9. Check if the trigger is working
SELECT 'Trigger Status' as section;

SELECT 
  'handle_new_user function exists' as check_type,
  COUNT(*) as exists
FROM pg_proc 
WHERE proname = 'handle_new_user';

SELECT 
  'on_auth_user_created trigger exists' as check_type,
  COUNT(*) as exists
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 10. Manual test of the interview session creation
SELECT 'Manual Test - Create Interview Session' as section;

-- This will create a test interview session for the first user
WITH test_user AS (
  SELECT id FROM auth.users LIMIT 1
)
INSERT INTO interview_sessions (
  user_id,
  role,
  company,
  interview_type,
  duration,
  resume,
  job_description,
  additional_notes,
  summary
)
SELECT 
  tu.id,
  'Software Engineer',
  'Tech Corp',
  'Technical',
  45,
  'Experienced developer with 5+ years in full-stack development',
  'Looking for a senior software engineer to join our team',
  'Great communication skills and team player',
  'Completed a comprehensive technical interview covering algorithms, system design, and coding challenges. Demonstrated strong problem-solving skills and technical knowledge.'
FROM test_user tu
RETURNING id, user_id, role, company, interview_type, created_at; 