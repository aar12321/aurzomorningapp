-- Admin Role Support for Daily Quiz App
-- This migration adds admin role functionality and appropriate RLS policies

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'super_admin')),
  granted_by UUID REFERENCES public.users(id),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles FOR SELECT 
USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Admins can view all roles" 
ON public.user_roles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.auth_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Super admins can manage roles" 
ON public.user_roles FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.auth_id = auth.uid() 
    AND ur.role = 'super_admin'
  )
);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_id_param 
    AND role IN ('admin', 'super_admin')
  );
END;
$$;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_id_param 
    AND role = 'super_admin'
  );
END;
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = user_id_param
  ORDER BY 
    CASE role 
      WHEN 'super_admin' THEN 3
      WHEN 'admin' THEN 2
      WHEN 'user' THEN 1
    END DESC
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'user');
END;
$$;

-- Update RLS policies to allow admin access
-- Topics policies (admins can manage)
DROP POLICY IF EXISTS "Topics are viewable by everyone" ON public.topics;
CREATE POLICY "Topics are viewable by everyone" 
ON public.topics FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage topics" 
ON public.topics FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.user_roles ur ON u.id = ur.user_id
    WHERE u.auth_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Quizzes policies (admins can manage)
DROP POLICY IF EXISTS "Quizzes are viewable by everyone" ON public.quizzes;
CREATE POLICY "Quizzes are viewable by everyone" 
ON public.quizzes FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage quizzes" 
ON public.quizzes FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.user_roles ur ON u.id = ur.user_id
    WHERE u.auth_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Questions policies (admins can manage)
DROP POLICY IF EXISTS "Questions are viewable by everyone" ON public.questions;
CREATE POLICY "Questions are viewable by everyone" 
ON public.questions FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage questions" 
ON public.questions FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.user_roles ur ON u.id = ur.user_id
    WHERE u.auth_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Badges policies (admins can manage)
DROP POLICY IF EXISTS "Badges are viewable by everyone" ON public.badges;
CREATE POLICY "Badges are viewable by everyone" 
ON public.badges FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage badges" 
ON public.badges FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.user_roles ur ON u.id = ur.user_id
    WHERE u.auth_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Quiz attempts policies (admins can view all)
DROP POLICY IF EXISTS "Users can view their own attempts" ON public.quiz_attempts;
CREATE POLICY "Users can view their own attempts" 
ON public.quiz_attempts FOR SELECT 
USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Admins can view all attempts" 
ON public.quiz_attempts FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.user_roles ur ON u.id = ur.user_id
    WHERE u.auth_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- User badges policies (admins can view all)
DROP POLICY IF EXISTS "Users can view their own badges" ON public.user_badges;
CREATE POLICY "Users can view their own badges" 
ON public.user_badges FOR SELECT 
USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Admins can view all badges" 
ON public.user_badges FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.user_roles ur ON u.id = ur.user_id
    WHERE u.auth_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Users policies (admins can view all users)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = auth_id);

CREATE POLICY "Admins can view all users" 
ON public.users FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.user_roles ur ON u.id = ur.user_id
    WHERE u.auth_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Create indexes for user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Insert initial admin user (replace with actual admin email)
-- This should be updated with the actual admin email address
INSERT INTO public.user_roles (user_id, role, granted_at)
SELECT 
  u.id,
  'super_admin',
  now()
FROM public.users u
WHERE u.email = 'admin@dailyquiz.com'  -- Replace with actual admin email
ON CONFLICT (user_id, role) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE public.user_roles IS 'User roles and permissions for admin access';
COMMENT ON FUNCTION is_admin(UUID) IS 'Checks if a user has admin or super_admin role';
COMMENT ON FUNCTION is_super_admin(UUID) IS 'Checks if a user has super_admin role';
COMMENT ON FUNCTION get_user_role(UUID) IS 'Returns the highest role for a user (super_admin > admin > user)';
