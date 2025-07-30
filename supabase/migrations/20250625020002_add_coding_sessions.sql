/*
  # Coding Sessions Table

  1. New Tables
    - `coding_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `platform_name` (text, name of coding platform)
      - `platform_url` (text, URL of the platform)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `coding_sessions` table
    - Add policies for users to read and insert their own sessions

  3. Indexes
    - Add index on user_id for efficient queries
*/

-- Create coding_sessions table
CREATE TABLE IF NOT EXISTS coding_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform_name text NOT NULL,
  platform_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE coding_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_coding_sessions_user_id ON coding_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_coding_sessions_created_at ON coding_sessions(created_at DESC); 