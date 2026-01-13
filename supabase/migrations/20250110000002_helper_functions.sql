-- Helper Functions for Daily Quiz App
-- These functions provide server-side calculations for streaks, accuracy, and badges

-- Function to calculate user's current streak
CREATE OR REPLACE FUNCTION calculate_user_streak(user_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_streak INTEGER := 0;
  last_quiz_date DATE;
  current_date DATE := CURRENT_DATE;
  check_date DATE;
BEGIN
  -- Get the last quiz date for the user
  SELECT last_quiz_date INTO last_quiz_date
  FROM public.users
  WHERE id = user_id_param;
  
  -- If no last quiz date, streak is 0
  IF last_quiz_date IS NULL THEN
    RETURN 0;
  END IF;
  
  -- If last quiz was today, return current streak from users table
  IF last_quiz_date = current_date THEN
    SELECT streak_count INTO current_streak
    FROM public.users
    WHERE id = user_id_param;
    RETURN current_streak;
  END IF;
  
  -- If last quiz was yesterday, continue counting from there
  IF last_quiz_date = current_date - INTERVAL '1 day' THEN
    SELECT streak_count INTO current_streak
    FROM public.users
    WHERE id = user_id_param;
    RETURN current_streak;
  END IF;
  
  -- If more than 1 day gap, streak is broken
  RETURN 0;
END;
$$;

-- Function to calculate user's average accuracy
CREATE OR REPLACE FUNCTION get_user_accuracy(user_id_param UUID)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_correct INTEGER := 0;
  total_questions INTEGER := 0;
  accuracy DECIMAL(5,2) := 0.00;
BEGIN
  -- Calculate total correct answers and total questions
  SELECT 
    COALESCE(SUM(score), 0),
    COALESCE(SUM(total_questions), 0)
  INTO total_correct, total_questions
  FROM public.quiz_attempts
  WHERE user_id = user_id_param;
  
  -- Calculate accuracy percentage
  IF total_questions > 0 THEN
    accuracy := ROUND((total_correct::DECIMAL / total_questions::DECIMAL) * 100, 2);
  END IF;
  
  RETURN accuracy;
END;
$$;

-- Function to check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges(user_id_param UUID)
RETURNS TABLE(badge_id UUID, badge_name TEXT, badge_icon TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_stats RECORD;
  badge_record RECORD;
  already_earned BOOLEAN;
BEGIN
  -- Get user statistics
  SELECT 
    u.total_xp,
    u.streak_count,
    COUNT(qa.id) as total_quizzes,
    COUNT(CASE WHEN qa.score = qa.total_questions THEN 1 END) as perfect_quizzes,
    get_user_accuracy(user_id_param) as accuracy
  INTO user_stats
  FROM public.users u
  LEFT JOIN public.quiz_attempts qa ON u.id = qa.user_id
  WHERE u.id = user_id_param
  GROUP BY u.id, u.total_xp, u.streak_count;
  
  -- Check each badge requirement
  FOR badge_record IN 
    SELECT id, name, icon, requirement_type, requirement_value
    FROM public.badges
  LOOP
    -- Check if user already has this badge
    SELECT EXISTS(
      SELECT 1 FROM public.user_badges 
      WHERE user_id = user_id_param AND badge_id = badge_record.id
    ) INTO already_earned;
    
    -- If not already earned, check if they qualify
    IF NOT already_earned THEN
      CASE badge_record.requirement_type
        WHEN 'quizzes_completed' THEN
          IF user_stats.total_quizzes >= badge_record.requirement_value THEN
            -- Award the badge
            INSERT INTO public.user_badges (user_id, badge_id)
            VALUES (user_id_param, badge_record.id);
            
            -- Return the badge info
            badge_id := badge_record.id;
            badge_name := badge_record.name;
            badge_icon := badge_record.icon;
            RETURN NEXT;
          END IF;
          
        WHEN 'streak' THEN
          IF user_stats.streak_count >= badge_record.requirement_value THEN
            INSERT INTO public.user_badges (user_id, badge_id)
            VALUES (user_id_param, badge_record.id);
            
            badge_id := badge_record.id;
            badge_name := badge_record.name;
            badge_icon := badge_record.icon;
            RETURN NEXT;
          END IF;
          
        WHEN 'total_xp' THEN
          IF user_stats.total_xp >= badge_record.requirement_value THEN
            INSERT INTO public.user_badges (user_id, badge_id)
            VALUES (user_id_param, badge_record.id);
            
            badge_id := badge_record.id;
            badge_name := badge_record.name;
            badge_icon := badge_record.icon;
            RETURN NEXT;
          END IF;
          
        WHEN 'perfect_quiz' THEN
          IF user_stats.perfect_quizzes >= badge_record.requirement_value THEN
            INSERT INTO public.user_badges (user_id, badge_id)
            VALUES (user_id_param, badge_record.id);
            
            badge_id := badge_record.id;
            badge_name := badge_record.name;
            badge_icon := badge_record.icon;
            RETURN NEXT;
          END IF;
          
        WHEN 'accuracy' THEN
          IF user_stats.accuracy >= badge_record.requirement_value THEN
            INSERT INTO public.user_badges (user_id, badge_id)
            VALUES (user_id_param, badge_record.id);
            
            badge_id := badge_record.id;
            badge_name := badge_record.name;
            badge_icon := badge_record.icon;
            RETURN NEXT;
          END IF;
      END CASE;
    END IF;
  END LOOP;
END;
$$;

-- Function to get daily leaderboard
CREATE OR REPLACE FUNCTION get_daily_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  user_id UUID,
  user_name TEXT,
  total_xp INTEGER,
  streak_count INTEGER,
  accuracy DECIMAL(5,2),
  rank_position BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.full_name as user_name,
    u.total_xp,
    u.streak_count,
    get_user_accuracy(u.id) as accuracy,
    ROW_NUMBER() OVER (ORDER BY u.total_xp DESC, u.streak_count DESC) as rank_position
  FROM public.users u
  WHERE u.total_xp > 0  -- Only include users who have taken quizzes
  ORDER BY u.total_xp DESC, u.streak_count DESC
  LIMIT limit_count;
END;
$$;

-- Function to get user's quiz completion status for today
CREATE OR REPLACE FUNCTION get_user_today_status(user_id_param UUID)
RETURNS TABLE(
  topic_id UUID,
  topic_name TEXT,
  current_day INTEGER,
  completed_today BOOLEAN,
  quiz_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
BEGIN
  RETURN QUERY
  SELECT 
    ut.topic_id,
    t.name as topic_name,
    ut.current_day,
    CASE 
      WHEN qa.id IS NOT NULL THEN true 
      ELSE false 
    END as completed_today,
    q.id as quiz_id
  FROM public.user_topics ut
  JOIN public.topics t ON ut.topic_id = t.id
  LEFT JOIN public.quizzes q ON t.id = q.topic_id AND q.day_number = ut.current_day
  LEFT JOIN public.quiz_attempts qa ON q.id = qa.quiz_id 
    AND qa.user_id = user_id_param 
    AND DATE(qa.completed_at) = today_date
  WHERE ut.user_id = user_id_param;
END;
$$;

-- Function to update user streak after quiz completion
CREATE OR REPLACE FUNCTION update_user_streak_after_quiz(user_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_streak INTEGER;
  last_quiz_date DATE;
  today_date DATE := CURRENT_DATE;
  new_streak INTEGER;
BEGIN
  -- Get current streak and last quiz date
  SELECT streak_count, last_quiz_date
  INTO current_streak, last_quiz_date
  FROM public.users
  WHERE id = user_id_param;
  
  -- Determine new streak
  IF last_quiz_date IS NULL THEN
    -- First quiz ever
    new_streak := 1;
  ELSIF last_quiz_date = today_date - INTERVAL '1 day' THEN
    -- Consecutive day
    new_streak := current_streak + 1;
  ELSIF last_quiz_date = today_date THEN
    -- Same day, keep current streak
    new_streak := current_streak;
  ELSE
    -- Gap in days, reset streak
    new_streak := 1;
  END IF;
  
  -- Update user record
  UPDATE public.users
  SET 
    streak_count = new_streak,
    last_quiz_date = today_date
  WHERE id = user_id_param;
  
  RETURN new_streak;
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION calculate_user_streak(UUID) IS 'Calculates the current streak for a user based on their quiz completion history';
COMMENT ON FUNCTION get_user_accuracy(UUID) IS 'Calculates the average accuracy percentage for a user across all their quiz attempts';
COMMENT ON FUNCTION check_and_award_badges(UUID) IS 'Checks if a user qualifies for any new badges and awards them automatically';
COMMENT ON FUNCTION get_daily_leaderboard(INTEGER) IS 'Returns the top users by XP and streak for leaderboard display';
COMMENT ON FUNCTION get_user_today_status(UUID) IS 'Returns the completion status of all user topics for today';
COMMENT ON FUNCTION update_user_streak_after_quiz(UUID) IS 'Updates user streak count after completing a quiz, handling streak logic';
