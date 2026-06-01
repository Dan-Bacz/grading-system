-- Ensure pgcrypto is available for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  full_name text,
  role text CHECK (role IN ('admin','teacher','student')) DEFAULT 'student',
  status text CHECK (status IN ('pending','active')) DEFAULT 'pending',
  assigned_subject text,
  phone text,
  address text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create grades table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(user_id),
  teacher_id uuid NOT NULL REFERENCES public.profiles(user_id),
  subject text NOT NULL,
  score numeric,
  comment text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create admins table to list admin user_ids (used by RLS policies to avoid recursion)
CREATE TABLE IF NOT EXISTS public.admins (
  user_id uuid PRIMARY KEY
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admins_select_self ON public.admins;
CREATE POLICY admins_select_self ON public.admins
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS admins_insert_self ON public.admins;
CREATE POLICY admins_insert_self ON public.admins
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger function to create a profile row whenever a new auth.user is created
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role, status, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data::json)->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data::json)->>'role', 'student'),
    'pending',
    now()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

-- Enable Row Level Security for profiles and add safe policies.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_admin_manage" ON public.profiles;
CREATE POLICY "profiles_admin_select" ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admins a
      WHERE a.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "profiles_admin_insert" ON public.profiles;
CREATE POLICY "profiles_admin_insert" ON public.profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admins a
      WHERE a.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admins a
      WHERE a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admins a
      WHERE a.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "profiles_admin_delete" ON public.profiles;
CREATE POLICY "profiles_admin_delete" ON public.profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admins a
      WHERE a.user_id = auth.uid()
    )
  );

-- NOTE:
-- Run this SQL in the Supabase SQL editor (it runs with elevated privileges).
-- After applying this, new signups will automatically get a `profiles` row.
-- If you already have RLS policies, these policies will allow owners and admins to access profile rows.