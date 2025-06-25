/*
  # Clean Interview Sessions Table

  1. Drop existing tables
    - Drop `interviews` table if exists
    - Drop `coding_sessions` table if exists

  2. Create new table
    - `interview_sessions` with specified schema
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `role` (text)
      - `company` (text)
      - `interview_type` (text)
      - `duration` (int4)
      - `resume` (text)
      - `job_description` (text)
      - `additional_notes` (text)
      - `summary` (text)
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on `interview_sessions` table
    - Add policies for users to manage their own sessions
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS coding_sessions CASCADE;
DROP TABLE IF EXISTS interview_sessions CASCADE;

-- Create the new interview_sessions table with exact schema requested
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

-- Enable Row Level Security
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
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

-- Create indexes for efficient queries
CREATE INDEX idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX idx_interview_sessions_created_at ON interview_sessions(created_at DESC); 