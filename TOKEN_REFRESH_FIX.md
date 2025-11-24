# Token Refresh Fix - Summary of Changes

## Problem Identified
The application was experiencing token expiration issues where:
1. Google OAuth access tokens expire after 1 hour
2. No automatic token refresh mechanism was implemented
3. Tokens were not being refreshed before making API calls
4. No tracking of token expiration time

## Solution Implemented

### 1. **User Entity** (`backend/src/entities/user.entity.ts`)
- ✅ Added `googleTokenExpiresAt` column (bigint) to track when access token expires

### 2. **Auth Service** (`backend/src/services/auth.service.ts`)
- ✅ Added `refreshGoogleAccessToken(userId)` - Refreshes expired tokens using refresh token
- ✅ Added `getValidAccessToken(userId)` - Gets valid token, auto-refreshes if expired/expiring soon (5 min buffer)
- ✅ Updated `createOrUpdateGoogleUser()` - Now stores token expiry timestamp
- ✅ Added proper logging for debugging token refresh operations

### 3. **Users Service** (`backend/src/services/users.service.ts`)
- ✅ Added `findById(id)` method for AuthService to look up users

### 4. **Google Fit Service** (`backend/src/services/google-fit.service.ts`)
- ✅ Injected `AuthService` dependency
- ✅ Updated `getValidAccessToken()` to use AuthService for token management
- ✅ Updated `fetchStepsWithAutoRefresh()` to use centralized token refresh logic
- ✅ Added fallback emergency token refresh if needed

### 5. **Google Strategy** (`backend/src/strategies/google.strategy.ts`)
- ✅ Changed `prompt` from `'select_account consent'` to just `'consent'`
- ✅ This ensures refresh tokens are always provided on re-authentication

### 6. **Google Fit Module** (`backend/src/modules/google-fit.module.ts`)
- ✅ Added `AuthModule` import to make AuthService available

## How It Works

### Token Lifecycle:
1. **User logs in** → Receives access token (1 hour) + refresh token
2. **Token stored** → Both tokens + expiry time saved to database
3. **Before API call** → System checks if token expired or expiring soon (< 5 min)
4. **Auto-refresh** → If expired, uses refresh token to get new access token
5. **Update database** → New access token + new expiry time saved
6. **API call** → Proceeds with valid token

### Key Features:
- ✅ **Proactive refresh**: Tokens refreshed 5 minutes before expiry
- ✅ **Automatic retry**: If API call fails with 401, attempts emergency refresh
- ✅ **Preserve refresh tokens**: Only updates refresh token when Google provides one
- ✅ **Comprehensive logging**: All token operations logged for debugging

## Database Migration Required

Run the SQL migration to add the new column:

```bash
# PostgreSQL/MySQL
psql -d your_database < backend/add-token-expiry-column.sql

# Or run directly in your database client:
ALTER TABLE users ADD COLUMN IF NOT EXISTS googleTokenExpiresAt BIGINT;
```

## Testing

1. **Clear existing tokens** (optional, for clean test):
   ```sql
   UPDATE users SET googleTokenExpiresAt = NULL WHERE googleAccessToken IS NOT NULL;
   ```

2. **Re-authenticate**: Log out and log back in via Google OAuth

3. **Verify token storage**: Check that `googleTokenExpiresAt` is populated

4. **Wait for expiry**: After 1 hour, trigger a sync - token should auto-refresh

5. **Check logs**: Should see messages like:
   - "Token expired or expiring soon for user X, refreshing..."
   - "Successfully refreshed token for user X"

## Files Modified

1. `backend/src/entities/user.entity.ts`
2. `backend/src/services/auth.service.ts`
3. `backend/src/services/users.service.ts`
4. `backend/src/services/google-fit.service.ts`
5. `backend/src/strategies/google.strategy.ts`
6. `backend/src/modules/google-fit.module.ts`

## Next Steps

1. ✅ Run database migration
2. ✅ Test the application
3. ✅ Ask users to re-authenticate to get fresh refresh tokens
4. ✅ Monitor logs for successful token refreshes
5. ✅ Verify scheduled sync jobs work without manual intervention

## Environment Variables Required

Make sure these are set in your `.env` file:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
