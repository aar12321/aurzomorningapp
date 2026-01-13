-- SQL Query to Refresh and Get All New Users
-- This query helps you identify and manage new users in your system

-- 1. Get all users with their signup information
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.created_at as signup_date,
    u.streak_count,
    u.total_xp,
    -- Calculate level based on total_xp
    CASE 
        WHEN COALESCE(u.total_xp, 0) >= 1000 THEN 5
        WHEN COALESCE(u.total_xp, 0) >= 500 THEN 4
        WHEN COALESCE(u.total_xp, 0) >= 250 THEN 3
        WHEN COALESCE(u.total_xp, 0) >= 100 THEN 2
        ELSE 1
    END as calculated_level,
    COUNT(DISTINCT ut.topic_id) as topics_count,
    MAX(ut.current_day) as max_day_progress,
    -- Check if user has completed any quizzes
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM quiz_attempts qa 
            WHERE qa.user_id = u.id
        ) THEN true 
        ELSE false 
    END as has_completed_quizzes,
    -- Days since signup
    EXTRACT(DAY FROM NOW() - u.created_at) as days_since_signup
FROM users u
LEFT JOIN user_topics ut ON ut.user_id = u.id
GROUP BY u.id, u.email, u.full_name, u.created_at, u.streak_count, u.total_xp
ORDER BY u.created_at DESC;

-- 2. Get only NEW users (signed up in the last 7 days)
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.created_at as signup_date,
    u.streak_count,
    u.total_xp,
    -- Calculate level based on total_xp
    CASE 
        WHEN COALESCE(u.total_xp, 0) >= 1000 THEN 5
        WHEN COALESCE(u.total_xp, 0) >= 500 THEN 4
        WHEN COALESCE(u.total_xp, 0) >= 250 THEN 3
        WHEN COALESCE(u.total_xp, 0) >= 100 THEN 2
        ELSE 1
    END as calculated_level,
    COUNT(DISTINCT ut.topic_id) as topics_count,
    -- Days since signup
    EXTRACT(DAY FROM NOW() - u.created_at) as days_since_signup,
    -- Check if user is active (has completed at least one quiz)
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM quiz_attempts qa 
            WHERE qa.user_id = u.id
        ) THEN 'Active' 
        ELSE 'Inactive' 
    END as user_status
FROM users u
LEFT JOIN user_topics ut ON ut.user_id = u.id
WHERE u.created_at >= NOW() - INTERVAL '7 days'
GROUP BY u.id, u.email, u.full_name, u.created_at, u.streak_count, u.total_xp
ORDER BY u.created_at DESC;

-- 3. Get users who signed up today
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.created_at as signup_time,
    u.streak_count,
    u.total_xp,
    COUNT(DISTINCT ut.topic_id) as topics_count
FROM users u
LEFT JOIN user_topics ut ON ut.user_id = u.id
WHERE DATE(u.created_at) = CURRENT_DATE
GROUP BY u.id, u.email, u.full_name, u.created_at, u.streak_count, u.total_xp
ORDER BY u.created_at DESC;

-- 4. Get users who signed up in the last 24 hours
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.created_at as signup_time,
    u.streak_count,
    u.total_xp,
    COUNT(DISTINCT ut.topic_id) as topics_count,
    -- Time since signup
    EXTRACT(HOUR FROM NOW() - u.created_at) as hours_since_signup
FROM users u
LEFT JOIN user_topics ut ON ut.user_id = u.id
WHERE u.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY u.id, u.email, u.full_name, u.created_at, u.streak_count, u.total_xp
ORDER BY u.created_at DESC;

-- 5. Get new users with their authentication method
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.created_at as signup_date,
    -- Get auth provider from auth.users table
    au.raw_app_meta_data->>'provider' as auth_provider,
    u.streak_count,
    u.total_xp,
    COUNT(DISTINCT ut.topic_id) as topics_count
FROM users u
LEFT JOIN auth.users au ON au.id = u.id
LEFT JOIN user_topics ut ON ut.user_id = u.id
WHERE u.created_at >= NOW() - INTERVAL '7 days'
GROUP BY u.id, u.email, u.full_name, u.created_at, au.raw_app_meta_data, u.streak_count, u.total_xp
ORDER BY u.created_at DESC;

-- 6. Get new users who haven't completed any quizzes (inactive new users)
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.created_at as signup_date,
    u.streak_count,
    u.total_xp,
    COUNT(DISTINCT ut.topic_id) as topics_count,
    EXTRACT(DAY FROM NOW() - u.created_at) as days_since_signup
FROM users u
LEFT JOIN user_topics ut ON ut.user_id = u.id
WHERE u.created_at >= NOW() - INTERVAL '7 days'
    AND NOT EXISTS (
        SELECT 1 FROM quiz_attempts qa 
        WHERE qa.user_id = u.id
    )
GROUP BY u.id, u.email, u.full_name, u.created_at, u.streak_count, u.total_xp
ORDER BY u.created_at DESC;

-- 7. Summary statistics for new users
SELECT 
    COUNT(*) as total_new_users,
    COUNT(CASE WHEN EXISTS (
        SELECT 1 FROM quiz_attempts qa WHERE qa.user_id = u.id
    ) THEN 1 END) as active_new_users,
    COUNT(CASE WHEN NOT EXISTS (
        SELECT 1 FROM quiz_attempts qa WHERE qa.user_id = u.id
    ) THEN 1 END) as inactive_new_users,
    AVG(u.streak_count) as avg_streak,
    AVG(u.total_xp) as avg_xp,
    AVG(EXTRACT(DAY FROM NOW() - u.created_at)) as avg_days_since_signup
FROM users u
WHERE u.created_at >= NOW() - INTERVAL '7 days';

-- 8. Refresh user statistics (update user stats based on current data)
-- This can be used to recalculate user statistics
-- Note: Level is calculated dynamically based on total_xp, so we don't store it
-- Note: Streak is maintained by the application logic, so we only refresh total_xp here
WITH user_stats AS (
    SELECT 
        u.id,
        COALESCE((
            SELECT SUM(xp_earned) 
            FROM quiz_attempts qa 
            WHERE qa.user_id = u.id
        ), 0) as calculated_xp
    FROM users u
    WHERE u.created_at >= NOW() - INTERVAL '7 days'
)
UPDATE users u
SET 
    total_xp = us.calculated_xp
FROM user_stats us
WHERE u.id = us.id;

-- 9. Get new users with their topic selections
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.created_at as signup_date,
    STRING_AGG(DISTINCT t.name, ', ' ORDER BY t.name) as selected_topics,
    COUNT(DISTINCT ut.topic_id) as topics_count
FROM users u
LEFT JOIN user_topics ut ON ut.user_id = u.id
LEFT JOIN topics t ON t.id = ut.topic_id
WHERE u.created_at >= NOW() - INTERVAL '7 days'
GROUP BY u.id, u.email, u.full_name, u.created_at
ORDER BY u.created_at DESC;

-- 10. Export new users to CSV format (for use in other tools)
-- Note: This is a SELECT query that can be exported
SELECT 
    u.id as "User ID",
    u.email as "Email",
    u.full_name as "Full Name",
    u.created_at as "Signup Date",
    u.streak_count as "Streak",
    u.total_xp as "Total XP",
    -- Calculate level based on total_xp
    CASE 
        WHEN COALESCE(u.total_xp, 0) >= 1000 THEN 5
        WHEN COALESCE(u.total_xp, 0) >= 500 THEN 4
        WHEN COALESCE(u.total_xp, 0) >= 250 THEN 3
        WHEN COALESCE(u.total_xp, 0) >= 100 THEN 2
        ELSE 1
    END as "Level",
    COUNT(DISTINCT ut.topic_id) as "Topics Count",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM quiz_attempts qa WHERE qa.user_id = u.id
        ) THEN 'Yes' 
        ELSE 'No' 
    END as "Has Completed Quizzes"
FROM users u
LEFT JOIN user_topics ut ON ut.user_id = u.id
WHERE u.created_at >= NOW() - INTERVAL '7 days'
GROUP BY u.id, u.email, u.full_name, u.created_at, u.streak_count, u.total_xp
ORDER BY u.created_at DESC;

