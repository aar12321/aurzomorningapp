drop function if exists public.create_user_profile(
  p_auth_id uuid,
  p_full_name text,
  p_email text,
  p_timezone text,
  p_selected_topics text[]
);
