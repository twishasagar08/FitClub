-- Check current token expiry status
SELECT 
    id,
    name,
    email,
    CASE 
        WHEN googleAccessToken IS NOT NULL THEN 'Has Token'
        ELSE 'No Token'
    END as access_token_status,
    CASE 
        WHEN googleRefreshToken IS NOT NULL THEN 'Has Refresh'
        ELSE 'No Refresh'
    END as refresh_token_status,
    googleTokenExpiresAt,
    CASE 
        WHEN googleTokenExpiresAt IS NULL THEN 'NEEDS UPDATE'
        WHEN googleTokenExpiresAt < EXTRACT(EPOCH FROM NOW()) * 1000 THEN 'EXPIRED'
        ELSE 'VALID'
    END as token_status,
    ROUND((googleTokenExpiresAt - EXTRACT(EPOCH FROM NOW()) * 1000) / 60000, 2) as minutes_until_expiry
FROM users
WHERE googleAccessToken IS NOT NULL;

-- Fix: Mark all existing tokens as expired so they get refreshed on next sync
-- This forces the token refresh mechanism to kick in
UPDATE users 
SET googleTokenExpiresAt = EXTRACT(EPOCH FROM NOW()) * 1000 - 1000
WHERE googleAccessToken IS NOT NULL 
  AND googleTokenExpiresAt IS NULL;

-- Verify the fix
SELECT 
    name,
    email,
    CASE 
        WHEN googleTokenExpiresAt < EXTRACT(EPOCH FROM NOW()) * 1000 THEN 'Will refresh on next sync ✓'
        ELSE 'Still valid'
    END as status
FROM users
WHERE googleAccessToken IS NOT NULL;
