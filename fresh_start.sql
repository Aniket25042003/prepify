-- Fresh Start - Complete Database Reset
-- This script will drop all tables and recreate them from scratch

-- 1. Drop all existing tables in the correct order (respecting foreign keys)
SELECT 'Dropping all tables...' as step;

-- Drop tables that depend on other tables first
DROP TABLE IF EXISTS interview_sessions CASCADE;
DROP TABLE IF EXISTS coding_sessions CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop any other tables that might exist
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS diary_entries CASCADE;
DROP TABLE IF EXISTS figure_prompts CASCADE;
DROP TABLE IF EXISTS figure_topic_prompts CASCADE;

-- 2. Drop all functions and triggers
SELECT 'Dropping functions and triggers...' as step;

DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_user_email_verified() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS create_missing_user_profiles() CASCADE;
DROP FUNCTION IF EXISTS test_user_creation() CASCADE;
DROP FUNCTION IF EXISTS cleanup_user_data() CASCADE;
DROP FUNCTION IF EXISTS verify_user_data_integrity() CASCADE;

-- 3. Create the user_profiles table fresh
SELECT 'Creating user_profiles table...' as step;

CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  email_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 6. Create the interview_sessions table
SELECT 'Creating interview_sessions table...' as step;

CREATE TABLE interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL,
  company text NOT NULL,
  interview_type text NOT NULL CHECK (interview_type IN ('Technical', 'Behavioral', 'System Design')),
  duration int4 NOT NULL,
  resume text NOT NULL,
  job_description text NOT NULL,
  additional_notes text DEFAULT '',
  summary text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 7. Enable RLS on interview_sessions
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for interview_sessions
CREATE POLICY "Users can read own interview sessions"
  ON interview_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interview sessions"
  ON interview_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interview sessions"
  ON interview_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interview sessions"
  ON interview_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 9. Create the coding_sessions table
SELECT 'Creating coding_sessions table...' as step;

CREATE TABLE coding_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform_name text NOT NULL,
  platform_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 10. Enable RLS on coding_sessions
ALTER TABLE coding_sessions ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policies for coding_sessions
CREATE POLICY "Users can read own coding sessions"
  ON coding_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coding sessions"
  ON coding_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own coding sessions"
  ON coding_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own coding sessions"
  ON coding_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 12. Create indexes for better performance
SELECT 'Creating indexes...' as step;

CREATE INDEX idx_user_profiles_id ON user_profiles(id);
CREATE INDEX idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX idx_interview_sessions_created_at ON interview_sessions(created_at DESC);
CREATE INDEX idx_coding_sessions_user_id ON coding_sessions(user_id);
CREATE INDEX idx_coding_sessions_created_at ON coding_sessions(created_at DESC);

-- 13. Create the trigger function for automatic user profile creation
SELECT 'Creating trigger function...' as step;

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

-- 14. Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 15. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 16. Create trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 17. Verify the setup
SELECT 'Verifying setup...' as step;

SELECT 
  'Tables created' as check_type,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'interview_sessions', 'coding_sessions');

SELECT 
  'Functions created' as check_type,
  COUNT(*) as count
FROM pg_proc 
WHERE proname IN ('handle_new_user', 'update_updated_at_column');

SELECT 
  'Triggers created' as check_type,
  COUNT(*) as count
FROM pg_trigger 
WHERE tgname IN ('on_auth_user_created', 'update_user_profiles_updated_at');

-- 18. Show final status
SELECT 'Fresh start completed successfully!' as status;

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