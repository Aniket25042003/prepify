-- Fix OAuth Configuration and User Creation Issues
-- This script will help ensure users are properly created in auth.users

-- 1. First, let's check the current OAuth configuration
SELECT 'Current OAuth Configuration' as section;

-- Check if there are any OAuth providers configured
SELECT 
  'OAuth Providers' as info,
  'Checking via Supabase Dashboard - OAuth providers are configured in the dashboard, not in database tables' as note;

-- 2. Check the current auth.users table structure
SELECT 'Auth Users Table Structure' as section;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Verify the trigger function exists and is working
SELECT 'Trigger Function Status' as section;

-- Check if the trigger function exists
SELECT 
  'handle_new_user function exists' as check_type,
  COUNT(*) as exists
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Check if the trigger exists
SELECT 
  'on_auth_user_created trigger exists' as check_type,
  COUNT(*) as exists
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 4. Test the trigger function manually
SELECT 'Testing Trigger Function' as section;

-- Create a test function to verify the trigger works
CREATE OR REPLACE FUNCTION test_user_creation()
RETURNS void AS $$
DECLARE
  test_user_id uuid := gen_random_uuid();
BEGIN
  -- This is just a test - we won't actually insert into auth.users
  -- but we can test if the function logic works
  RAISE NOTICE 'Testing user creation logic for user ID: %', test_user_id;
  
  -- Test the profile creation logic
  INSERT INTO user_profiles (id, email, full_name, email_verified)
  VALUES (
    test_user_id,
    'test@example.com',
    'Test User',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    email_verified = EXCLUDED.email_verified,
    updated_at = now();
    
  RAISE NOTICE 'Test profile created successfully';
  
  -- Clean up test data
  DELETE FROM user_profiles WHERE id = test_user_id;
  
  RAISE NOTICE 'Test completed successfully';
END;
$$ LANGUAGE plpgsql;

-- 5. Fix potential issues with the trigger function
SELECT 'Fixing Trigger Function' as section;

-- Recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Log the user creation attempt
  RAISE LOG 'Creating user profile for user % with email %', NEW.id, NEW.email;
  
  -- Insert profile with better error handling and OAuth support
  INSERT INTO user_profiles (id, email, full_name, email_verified, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'display_name',
      SPLIT_PART(COALESCE(NEW.email, ''), '@', 1)
    ),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    COALESCE(NEW.created_at, now()),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    email_verified = EXCLUDED.email_verified,
    updated_at = now();
  
  RAISE LOG 'User profile created/updated successfully for user %', NEW.id;
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't prevent user creation
    RAISE LOG 'Error creating user profile for user %: %', NEW.id, SQLERRM;
    RAISE LOG 'Error details: %', SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Ensure the trigger is properly set up
SELECT 'Setting up Trigger' as section;

-- Drop and recreate the trigger to ensure it's working
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 7. Add a function to manually create user profiles for existing users
CREATE OR REPLACE FUNCTION create_missing_user_profiles()
RETURNS TABLE(
  user_id uuid,
  user_email text,
  profile_created boolean,
  message text
) AS $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id, email, raw_user_meta_data, email_confirmed_at, created_at
    FROM auth.users
    WHERE id NOT IN (SELECT id FROM user_profiles)
  LOOP
    BEGIN
      INSERT INTO user_profiles (id, email, full_name, email_verified, created_at, updated_at)
      VALUES (
        user_record.id,
        COALESCE(user_record.email, ''),
        COALESCE(
          user_record.raw_user_meta_data->>'full_name', 
          user_record.raw_user_meta_data->>'name',
          user_record.raw_user_meta_data->>'display_name',
          SPLIT_PART(COALESCE(user_record.email, ''), '@', 1)
        ),
        COALESCE(user_record.email_confirmed_at IS NOT NULL, false),
        COALESCE(user_record.created_at, now()),
        now()
      );
      
      user_id := user_record.id;
      user_email := user_record.email;
      profile_created := true;
      message := 'Profile created successfully';
      
      RETURN NEXT;
      
    EXCEPTION
      WHEN OTHERS THEN
        user_id := user_record.id;
        user_email := user_record.email;
        profile_created := false;
        message := 'Error: ' || SQLERRM;
        
        RETURN NEXT;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 8. Run the function to create missing profiles
SELECT 'Creating Missing User Profiles' as section;
SELECT * FROM create_missing_user_profiles();

-- 9. Final verification
SELECT 'Final Verification' as section;

SELECT 
  'Users without profiles' as check_type,
  COUNT(*) as count
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = au.id);

SELECT 
  'Total users' as metric,
  COUNT(*) as value
FROM auth.users
UNION ALL
SELECT 
  'Total profiles' as metric,
  COUNT(*) as value
FROM user_profiles;

-- 10. Show sample user data
SELECT 'Sample User Data' as section;
SELECT 
  au.id,
  au.email,
  au.created_at as user_created,
  up.id as profile_id,
  up.full_name,
  up.created_at as profile_created
FROM auth.users au
LEFT JOIN user_profiles up ON up.id = au.id
ORDER BY au.created_at DESC
LIMIT 5; 