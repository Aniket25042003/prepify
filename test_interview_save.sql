-- Test Interview Session Saving
-- This script will test if we can manually save interview sessions

-- 1. Get the first user to test with
SELECT 'Testing with user:' as info;
SELECT id, email FROM auth.users LIMIT 1;

-- 2. Test saving an interview session manually
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
  'Test Company',
  'Technical',
  30,
  'Experienced developer with React and TypeScript',
  'Looking for a full-stack developer',
  'Great communication skills',
  'Completed a technical interview covering algorithms and system design. Demonstrated strong problem-solving skills.'
FROM test_user tu
RETURNING 
  id,
  user_id,
  role,
  company,
  interview_type,
  duration,
  created_at;

-- 3. Verify the session was saved
SELECT 'Verifying saved session:' as info;
SELECT 
  id,
  user_id,
  role,
  company,
  interview_type,
  duration,
  created_at
FROM interview_sessions
ORDER BY created_at DESC
LIMIT 1;

-- 4. Test querying sessions for the user (like the app does)
SELECT 'Testing app-like query:' as info;
WITH test_user AS (
  SELECT id FROM auth.users LIMIT 1
)
SELECT 
  int_sessions.id,
  int_sessions.user_id,
  int_sessions.role,
  int_sessions.company,
  int_sessions.interview_type,
  int_sessions.duration,
  int_sessions.created_at
FROM interview_sessions int_sessions
JOIN test_user tu ON tu.id = int_sessions.user_id
ORDER BY int_sessions.created_at DESC;

-- 5. Show total count
SELECT 'Total interview sessions:' as info;
SELECT COUNT(*) as total_sessions FROM interview_sessions; 