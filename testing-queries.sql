-- ============================================================
-- SQL Testing Queries for Google Fit Integration
-- ============================================================
-- Use these queries to verify your implementation is working

-- 1. Check users with Google Fit connected
-- ============================================================
SELECT 
    id,
    name,
    email,
    googleId,
    CASE 
        WHEN googleAccessToken IS NOT NULL THEN '✓ Has Access Token'
        ELSE '✗ No Access Token'
    END as accessToken,
    CASE 
        WHEN googleRefreshToken IS NOT NULL THEN '✓ Has Refresh Token'
        ELSE '✗ No Refresh Token'
    END as refreshToken,
    totalSteps
FROM users
ORDER BY name;


-- 2. Count users ready for auto-sync
-- ============================================================
SELECT 
    COUNT(*) as total_users,
    SUM(CASE WHEN googleRefreshToken IS NOT NULL THEN 1 ELSE 0 END) as users_with_google_fit,
    SUM(CASE WHEN googleRefreshToken IS NULL THEN 1 ELSE 0 END) as users_without_google_fit
FROM users;


-- 3. View yesterday's step records
-- ============================================================
SELECT 
    u.name,
    u.email,
    sr.date,
    sr.steps,
    sr.id as record_id
FROM step_records sr
JOIN users u ON sr.userId = u.id
WHERE sr.date = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
ORDER BY sr.steps DESC;


-- 4. View all step records for a specific user
-- ============================================================
SELECT 
    date,
    steps,
    DATE_FORMAT(date, '%W, %M %d, %Y') as formatted_date
FROM step_records
WHERE userId = 'YOUR-USER-ID-HERE'
ORDER BY date DESC
LIMIT 30;


-- 5. Check total steps calculation
-- ============================================================
SELECT 
    u.name,
    u.totalSteps as stored_total,
    COALESCE(SUM(sr.steps), 0) as calculated_total,
    CASE 
        WHEN u.totalSteps = COALESCE(SUM(sr.steps), 0) THEN '✓ Correct'
        ELSE '✗ Mismatch - Needs Recalculation'
    END as status
FROM users u
LEFT JOIN step_records sr ON u.id = sr.userId
GROUP BY u.id, u.name, u.totalSteps
ORDER BY u.name;


-- 6. View step history (last 7 days)
-- ============================================================
SELECT 
    u.name,
    sr.date,
    sr.steps,
    DAYNAME(sr.date) as day_of_week
FROM step_records sr
JOIN users u ON sr.userId = u.id
WHERE sr.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
ORDER BY sr.date DESC, u.name;


-- 7. Find duplicate step records (should be none)
-- ============================================================
SELECT 
    userId,
    date,
    COUNT(*) as duplicate_count
FROM step_records
GROUP BY userId, date
HAVING COUNT(*) > 1;


-- 8. View users who need re-authentication
-- ============================================================
SELECT 
    id,
    name,
    email,
    googleId,
    CASE 
        WHEN googleAccessToken IS NULL THEN 'Missing Access Token'
        WHEN googleRefreshToken IS NULL THEN 'Missing Refresh Token'
        ELSE 'OK'
    END as issue
FROM users
WHERE googleId IS NOT NULL 
  AND (googleAccessToken IS NULL OR googleRefreshToken IS NULL);


-- 9. Test token expiry (CAREFUL - this invalidates tokens!)
-- ============================================================
-- Use this to test automatic token refresh
-- WARNING: Only use on test accounts!
/*
UPDATE users 
SET googleAccessToken = 'invalid_test_token_12345'
WHERE email = 'test-user@example.com';
*/


-- 10. View sync performance (most active users)
-- ============================================================
SELECT 
    u.name,
    u.email,
    COUNT(sr.id) as days_synced,
    SUM(sr.steps) as total_steps,
    AVG(sr.steps) as avg_daily_steps,
    MAX(sr.steps) as max_steps_day,
    MIN(sr.steps) as min_steps_day
FROM users u
JOIN step_records sr ON u.id = sr.userId
GROUP BY u.id, u.name, u.email
ORDER BY total_steps DESC;


-- 11. Check for missing sync days
-- ============================================================
-- This finds gaps in step records (days that weren't synced)
SELECT 
    u.name,
    DATE_SUB(CURDATE(), INTERVAL seq.seq DAY) as missing_date
FROM users u
CROSS JOIN (
    SELECT 0 as seq UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION 
    SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
) seq
LEFT JOIN step_records sr ON 
    sr.userId = u.id AND 
    sr.date = DATE_SUB(CURDATE(), INTERVAL seq.seq DAY)
WHERE u.googleRefreshToken IS NOT NULL
  AND sr.id IS NULL
  AND DATE_SUB(CURDATE(), INTERVAL seq.seq DAY) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
ORDER BY u.name, missing_date DESC;


-- 12. Leaderboard query (for testing leaderboard feature)
-- ============================================================
SELECT 
    ROW_NUMBER() OVER (ORDER BY totalSteps DESC) as rank,
    name,
    email,
    totalSteps,
    FORMAT(totalSteps, 0) as formatted_steps
FROM users
WHERE totalSteps > 0
ORDER BY totalSteps DESC
LIMIT 10;


-- ============================================================
-- Utility Queries for Maintenance
-- ============================================================

-- Reset a user's tokens (force re-authentication)
/*
UPDATE users 
SET googleAccessToken = NULL, googleRefreshToken = NULL 
WHERE email = 'user@example.com';
*/

-- Delete all step records for a user (careful!)
/*
DELETE FROM step_records 
WHERE userId = 'YOUR-USER-ID-HERE';

-- Then recalculate total:
UPDATE users 
SET totalSteps = 0 
WHERE id = 'YOUR-USER-ID-HERE';
*/

-- Recalculate total steps for a specific user
/*
UPDATE users u
SET totalSteps = (
    SELECT COALESCE(SUM(steps), 0)
    FROM step_records
    WHERE userId = u.id
)
WHERE id = 'YOUR-USER-ID-HERE';
*/

-- Recalculate total steps for ALL users
/*
UPDATE users u
SET totalSteps = (
    SELECT COALESCE(SUM(steps), 0)
    FROM step_records
    WHERE userId = u.id
);
*/
