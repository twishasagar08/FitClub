-- Migration to add googleTokenExpiresAt column to users table
-- Run this SQL command in your database

ALTER TABLE users ADD COLUMN IF NOT EXISTS googleTokenExpiresAt BIGINT;

-- Optional: Set a default expiry for existing users (1 hour from now)
-- UPDATE users SET googleTokenExpiresAt = EXTRACT(EPOCH FROM NOW() + INTERVAL '1 hour') * 1000 WHERE googleAccessToken IS NOT NULL;
