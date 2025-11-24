-- Check both users' token status
SELECT 
    id,
    name,
    email,
    CASE 
        WHEN googleAccessToken IS NOT NULL THEN 'Has Access Token'
        ELSE 'No Access Token'
    END as access_token,
    CASE 
        WHEN googleRefreshToken IS NOT NULL THEN 'Has Refresh Token'
        ELSE 'No Refresh Token'
    END as refresh_token,
    googleTokenExpiresAt,
    CASE 
        WHEN googleTokenExpiresAt IS NULL THEN 'Expiry Not Set'
        WHEN googleTokenExpiresAt < EXTRACT(EPOCH FROM NOW()) * 1000 THEN 'Expired'
        ELSE 'Valid'
    END as token_status,
    totalSteps
FROM users
ORDER BY name;

-- Check step records for both users
SELECT 
    u.name,
    u.email,
    COUNT(sr.id) as total_records,
    MAX(sr.date) as latest_record_date,
    SUM(sr.steps) as total_steps_from_records
FROM users u
LEFT JOIN step_records sr ON u.id = sr.userId
GROUP BY u.id, u.name, u.email
ORDER BY u.name;

-- Check the actual access token lengths (to see if one is invalid)
SELECT 
    name,
    email,
    LENGTH(googleAccessToken) as access_token_length,
    LENGTH(googleRefreshToken) as refresh_token_length,
    SUBSTRING(googleAccessToken, 1, 20) as token_preview
FROM users
WHERE googleAccessToken IS NOT NULL
ORDER BY name;
