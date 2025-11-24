# API Flow with Token Refresh

## 🔐 Authentication Flow

### 1. **Login via Google OAuth**
```
GET /auth/google
```

**Flow:**
```
Client Request
    ↓
AuthController.googleLogin()
    ↓
Google OAuth Screen (prompt: 'consent' to get refresh token)
    ↓
GET /auth/google/callback
    ↓
AuthController.googleCallback()
    ↓
AuthService.handleGoogleLogin(googleUser)
    ↓
AuthService.createOrUpdateGoogleUser(googleUser)
    ↓
Stores:
  - googleAccessToken
  - googleRefreshToken
  - googleTokenExpiresAt (Date.now() + 3600000)
    ↓
Redirect to frontend with userId
```

**Code:**
```typescript
// auth.controller.ts
@Get('google/callback')
@UseGuards(AuthGuard('google'))
async googleCallback(@Req() req, @Res() res: Response) {
  const user = await this.authService.handleGoogleLogin(req.user);
  // user has tokens stored
}

// auth.service.ts
async createOrUpdateGoogleUser(googleUser: GoogleUser): Promise<User> {
  // Stores tokens with expiry
  user.googleAccessToken = accessToken;
  user.googleRefreshToken = refreshToken;
  user.googleTokenExpiresAt = Date.now() + (3600 * 1000); // 1 hour
  return await this.usersService.save(user);
}
```

---

## 📊 Sync Steps APIs

### 2. **Manual Sync - Sync Today's Steps**
```
PUT /steps/sync/:userId
```

**Flow with Auto Token Refresh:**
```
Client Request
    ↓
StepsController.syncFromGoogleFit(userId)
    ↓
StepsService.syncFromGoogleFit(userId)
    ↓
GoogleFitService.fetchDailyStepsWithRefresh(user)
    ↓
GoogleFitService.fetchStepsWithAutoRefresh(user, startMillis, endMillis)
    ↓
┌─────────────────────────────────────┐
│ GoogleFitService.getValidAccessToken│
│                                     │
│  1. Gets user from DB               │
│  2. Calls AuthService to check token│
└──────────────┬──────────────────────┘
               ↓
    ┌──────────────────────┐
    │ AuthService.         │
    │ getValidAccessToken()│
    └──────────┬───────────┘
               ↓
    ┌──────────────────────────────┐
    │ Is token expired or          │
    │ expiring in < 5 minutes?     │
    └──────────┬───────────────────┘
               ↓
        ┌──────┴──────┐
        │             │
       YES           NO
        │             │
        ↓             ↓
  ┌─────────────┐  Return
  │ AuthService.│  existing
  │ refresh     │  token
  │ GoogleAccess│
  │ Token()     │
  └──────┬──────┘
         ↓
  POST to Google OAuth
  /token endpoint with
  refresh_token
         ↓
  Get new access token
  + new expiry time
         ↓
  Update DB:
  - googleAccessToken
  - googleTokenExpiresAt
         ↓
  Return new token
         │
         └──────────────┐
                        ↓
                Use valid token to
                call Google Fit API
                        ↓
                Return step count
                        ↓
                StepsService.create()
                saves to database
```

**Code:**
```typescript
// steps.controller.ts
@Put('sync/:userId')
async syncFromGoogleFit(@Param('userId') userId: string): Promise<StepRecord> {
  return await this.stepsService.syncFromGoogleFit(userId);
}

// steps.service.ts
async syncFromGoogleFit(userId: string): Promise<StepRecord> {
  const user = await this.usersService.findOne(userId);
  
  // 🔑 This automatically handles token refresh!
  const steps = await this.googleFitService.fetchDailyStepsWithRefresh(user);
  
  return await this.create({ userId, steps });
}

// google-fit.service.ts
async fetchStepsWithAutoRefresh(
  user: User,
  startMillis: number,
  endMillis: number,
): Promise<number> {
  try {
    // 🔑 Gets valid token (auto-refreshes if needed)
    const accessToken = await this.getValidAccessToken(user);
    return await this.fetchSteps(accessToken, startMillis, endMillis);
  } catch (error) {
    // Emergency refresh if token expired during request
    if (error.message === 'TOKEN_EXPIRED' && user.googleRefreshToken) {
      const newAccessToken = await this.authService.refreshGoogleAccessToken(user.id);
      return await this.fetchSteps(newAccessToken, startMillis, endMillis);
    }
    throw error;
  }
}

// google-fit.service.ts -> calls AuthService
async getValidAccessToken(user: User): Promise<string> {
  // 🔑 Delegates to AuthService for token management
  return await this.authService.getValidAccessToken(user.id);
}

// auth.service.ts
async getValidAccessToken(userId: string): Promise<string> {
  const user = await this.usersService.findById(userId);
  
  // Check if token expires in next 5 minutes
  const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
  
  if (user.googleTokenExpiresAt < fiveMinutesFromNow) {
    // 🔑 AUTOMATICALLY REFRESH!
    return await this.refreshGoogleAccessToken(userId);
  }
  
  return user.googleAccessToken; // Token still valid
}

// auth.service.ts
async refreshGoogleAccessToken(userId: string): Promise<string> {
  const user = await this.usersService.findById(userId);
  
  // Call Google OAuth token endpoint
  const response = await axios.post('https://oauth2.googleapis.com/token', {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: user.googleRefreshToken,
    grant_type: 'refresh_token',
  });

  const newAccessToken = response.data.access_token;
  const expiresIn = response.data.expires_in || 3600;
  
  // Update database
  user.googleAccessToken = newAccessToken;
  user.googleTokenExpiresAt = Date.now() + (expiresIn * 1000);
  await this.usersService.save(user);

  return newAccessToken;
}
```

---

## ⏰ Automatic Sync (Cron Job)

### 3. **Midnight Cron - Sync All Users**
```
Runs daily at 00:00
```

**Flow:**
```
Cron triggers (@Cron('0 0 * * *'))
    ↓
StepSyncService.syncAllUsersSteps()
    ↓
Get all users with googleRefreshToken
    ↓
For each user:
    ↓
GoogleFitService.fetchYesterdaySteps(user)
    ↓
[Same token refresh flow as manual sync]
    ↓
GoogleFitService.fetchStepsWithAutoRefresh(user, yesterdayStart, yesterdayEnd)
    ↓
AuthService.getValidAccessToken() checks expiry
    ↓
If expired → AuthService.refreshGoogleAccessToken()
    ↓
Fetch steps from Google Fit API
    ↓
StepsService.saveDailySteps(userId, steps)
    ↓
Save to database for yesterday's date
```

**Code:**
```typescript
// step-sync.service.ts
@Cron('0 0 * * *') // Runs at midnight
async syncAllUsersSteps() {
  const users = await this.usersService.findUsersWithGoogleFit();
  
  for (const user of users) {
    // 🔑 Auto token refresh happens here!
    const steps = await this.googleFitService.fetchYesterdaySteps(user);
    await this.stepsService.saveDailySteps(user.id, steps);
  }
}

// google-fit.service.ts
async fetchYesterdaySteps(user: User): Promise<number> {
  const { startMillis, endMillis } = this.getYesterdayMillis();
  // 🔑 Uses the same auto-refresh mechanism
  return await this.fetchStepsWithAutoRefresh(user, startMillis, endMillis);
}
```

---

## 🔄 Token Refresh Trigger Points

### **Proactive Refresh (Before Expiry)**
- Triggered when token expires in < 5 minutes
- Location: `AuthService.getValidAccessToken()`
- Called before every Google Fit API request

### **Reactive Refresh (On Error)**
- Triggered when API returns 401 (TOKEN_EXPIRED)
- Location: `GoogleFitService.fetchStepsWithAutoRefresh()` catch block
- Emergency fallback if proactive refresh missed

---

## 📋 Complete API List

| Endpoint | Method | Uses Token Refresh? | Description |
|----------|--------|---------------------|-------------|
| `/auth/google` | GET | ❌ No | Initiates OAuth login |
| `/auth/google/callback` | GET | ❌ No | Receives OAuth tokens, stores them |
| `/steps/sync/:userId` | PUT | ✅ Yes | Manual sync with auto-refresh |
| `/steps/:userId` | GET | ❌ No | Get step history (no API call) |
| `/steps` | POST | ❌ No | Manually add steps |
| Cron Job | Auto | ✅ Yes | Midnight sync with auto-refresh |
| `/users` | GET | ❌ No | List all users |
| `/leaderboard` | GET | ❌ No | Get leaderboard |

---

## 🎯 Key Takeaways

1. **Every Google Fit API call** goes through `GoogleFitService.fetchStepsWithAutoRefresh()`
2. **Every token fetch** goes through `AuthService.getValidAccessToken()`
3. **Automatic refresh** happens 5 minutes before expiry
4. **Emergency refresh** happens on 401 errors
5. **Token expiry is tracked** in database (`googleTokenExpiresAt`)
6. **Refresh tokens are preserved** (only updated when Google provides new ones)

---

## 🧪 Testing the Flow

### Test Manual Sync:
```bash
# Wait for token to expire (or manually set expiry to past in DB)
PUT http://localhost:3000/steps/sync/{userId}

# Check logs - you should see:
# "Token expired or expiring soon for user X, refreshing..."
# "Successfully refreshed token for user X"
```

### Test Cron Sync:
```bash
# Manually trigger (if you add endpoint):
POST http://localhost:3000/sync/trigger

# Or wait for midnight - check logs next morning
```

### Check Token Expiry:
```sql
SELECT email, googleTokenExpiresAt, 
       (googleTokenExpiresAt - EXTRACT(EPOCH FROM NOW()) * 1000) / 60000 as minutes_until_expiry
FROM users 
WHERE googleRefreshToken IS NOT NULL;
```
