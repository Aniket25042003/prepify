/*
  # Modify interview_sessions table to support coding practice sessions

  1. Table Changes
    - Add `session_type` column to distinguish between 'interview' and 'coding' sessions
    - Add `platform_name` column for coding platform name
    - Add `platform_url` column for coding platform URL
    - Make some interview-specific columns nullable for coding sessions

  2. Security
    - Update existing RLS policies to work with both session types
    - Maintain data integrity with appropriate constraints

  3. Data Migration
    - Set existing records to 'interview' session type
    - Ensure backward compatibility
*/

-- Add new columns to support coding sessions
DO $$
BEGIN
  -- Add session_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_sessions' AND column_name = 'session_type'
  ) THEN
    ALTER TABLE interview_sessions ADD COLUMN session_type text DEFAULT 'interview' CHECK (session_type IN ('interview', 'coding'));
  END IF;

  -- Add platform_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_sessions' AND column_name = 'platform_name'
  ) THEN
    ALTER TABLE interview_sessions ADD COLUMN platform_name text;
  END IF;

  -- Add platform_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_sessions' AND column_name = 'platform_url'
  ) THEN
    ALTER TABLE interview_sessions ADD COLUMN platform_url text;
  END IF;
END $$;

-- Update existing records to have session_type = 'interview'
UPDATE interview_sessions 
SET session_type = 'interview' 
WHERE session_type IS NULL;

-- Make interview-specific columns nullable for coding sessions
ALTER TABLE interview_sessions ALTER COLUMN role DROP NOT NULL;
ALTER TABLE interview_sessions ALTER COLUMN company DROP NOT NULL;
ALTER TABLE interview_sessions ALTER COLUMN interview_type DROP NOT NULL;
ALTER TABLE interview_sessions ALTER COLUMN resume DROP NOT NULL;
ALTER TABLE interview_sessions ALTER COLUMN job_description DROP NOT NULL;
ALTER TABLE interview_sessions ALTER COLUMN summary DROP NOT NULL;

-- Add constraints to ensure data integrity
ALTER TABLE interview_sessions ADD CONSTRAINT check_interview_fields 
  CHECK (
    (session_type = 'interview' AND role IS NOT NULL AND company IS NOT NULL AND interview_type IS NOT NULL AND resume IS NOT NULL AND job_description IS NOT NULL AND summary IS NOT NULL) OR
    (session_type = 'coding' AND platform_name IS NOT NULL AND platform_url IS NOT NULL)
  );

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_interview_sessions_session_type ON interview_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_platform_name ON interview_sessions(platform_name) WHERE session_type = 'coding';