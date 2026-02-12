
-- Fix 1: Profiles table - remove overly permissive SELECT policy
-- Keep "Users can view own profile" and "Public profiles are viewable by authenticated users"
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Also clean up duplicate UPDATE policies
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Fix 2: Waitlist - remove overly permissive SELECT and duplicate INSERT
DROP POLICY IF EXISTS "Authenticated users can view waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can add to waitlist" ON public.waitlist;
