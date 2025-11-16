# Google OAuth2 Setup Guide for FitClub

This guide will walk you through setting up Google OAuth2 authentication to allow users to connect their Google Fit accounts.

## 📋 Overview

The OAuth integration allows users to:
- Sign in with their Google account
- Automatically grant access to their Google Fit data
- Have their step count synced automatically
- Refresh tokens automatically when they expire

## 🔧 Google Cloud Console Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Enter project name: `FitClub Step Tracker`
4. Click **Create**

### Step 2: Enable Google Fit API

1. In your project, go to **APIs & Services** → **Library**
2. Search for **"Fitness API"**
3. Click on **Google Fitness API**
4. Click **Enable**

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (for testing with any Google account)
3. Click **Create**

**Fill in the required fields:**
- **App name**: FitClub Step Tracker
- **User support email**: Your email
- **Developer contact**: Your email

**Scopes:**
Click **Add or Remove Scopes** and add:
- `.../auth/userinfo.email`
- `.../auth/userinfo.profile`
- `.../auth/fitness.activity.read`
- `.../auth/fitness.activity.write`

Click **Save and Continue**

**Test users (for development):**
- Add your email addresses that will test the app
- Click **Save and Continue**

### Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Application type**: Web application
4. **Name**: FitClub Backend

**Authorized JavaScript origins:**
```
http://localhost:3000
http://localhost:5173
```

**Authorized redirect URIs:**
```
http://localhost:3000/auth/google/callback
```

5. Click **Create**
6. **Copy** the **Client ID** and **Client Secret**

### Step 5: Update Environment Variables

Edit `/backend/.env`:

```env
GOOGLE_CLIENT_ID=your_client_id_from_step_4
GOOGLE_CLIENT_SECRET=your_client_secret_from_step_4
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

## 🚀 How It Works

### Authentication Flow

1. **User clicks "Connect Google Fit"** in frontend
2. Browser redirects to `GET /auth/google`
3. User is redirected to Google login page
4. User grants permissions for:
   - Profile access
   - Email access
   - Google Fit activity read/write
5. Google redirects back to `GET /auth/google/callback`
6. Backend receives:
   - Access token
   - Refresh token
   - User profile
7. Backend creates/updates user in database
8. User is redirected back to frontend with success

### Token Management

**Access Token:**
- Short-lived (typically 1 hour)
- Used for API requests to Google Fit
- Stored in `user.googleAccessToken`

**Refresh Token:**
- Long-lived (until revoked)
- Used to get new access tokens
- Stored in `user.googleRefreshToken`
- Only provided on first authorization with `prompt=consent`

### Automatic Token Refresh

When fetching Google Fit data:
1. Try to fetch with current access token
2. If 401 Unauthorized received:
   - Use refresh token to get new access token
   - Update user record
   - Retry the request
3. Return step data

## 📡 API Endpoints

### Initiate Google OAuth Flow

```
GET /auth/google
```

**Response:** Redirects to Google login

---

### OAuth Callback (handled automatically)

```
GET /auth/google/callback?code=...
```

**Response:** Redirects to frontend with result

Success:
```
http://localhost:5173/auth/callback?success=true&userId=xxx&name=John+Doe
```

Error:
```
http://localhost:5173/auth/callback?success=false&error=message
```

## 🎨 Frontend Integration

### Add Connect Button

Create a button to initiate OAuth flow:

```jsx
const handleConnectGoogleFit = () => {
  window.location.href = 'http://localhost:3000/auth/google';
};

<button onClick={handleConnectGoogleFit}>
  Connect Google Fit
</button>
```

### Handle Callback

Create a callback page at `/auth/callback`:

```jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const userId = params.get('userId');
    const error = params.get('error');

    if (success === 'true') {
      alert(`Successfully connected! User ID: ${userId}`);
      navigate('/');
    } else {
      alert(`Failed to connect: ${error}`);
      navigate('/');
    }
  }, [navigate]);

  return <div>Processing authentication...</div>;
}
```

## 🧪 Testing the Integration

### 1. Start Backend

```bash
cd backend
npm run start:dev
```

### 2. Start Frontend

```bash
cd frontend
npm run dev
```

### 3. Test OAuth Flow

1. Click "Connect Google Fit" button
2. Sign in with Google account
3. Grant permissions
4. Verify redirect back to frontend
5. Check database for saved tokens:

```sql
SELECT id, name, email, "googleId", 
       LENGTH("googleAccessToken") as token_length,
       LENGTH("googleRefreshToken") as refresh_length
FROM users
WHERE "googleId" IS NOT NULL;
```

### 4. Test Step Sync

```bash
# Sync steps for user
curl -X PUT http://localhost:3000/steps/sync/{userId}
```

Should return step data from Google Fit.

## 🔒 Security Best Practices

### For Production:

1. **Use HTTPS**
   - Update redirect URIs to use `https://`
   - Set secure cookie flags

2. **Environment Variables**
   - Never commit `.env` file
   - Use secret management (AWS Secrets Manager, etc.)

3. **OAuth Consent Screen**
   - Submit for verification
   - Add privacy policy and terms of service

4. **Token Storage**
   - Consider encrypting tokens in database
   - Implement token rotation

5. **Rate Limiting**
   - Limit OAuth attempts
   - Implement rate limiting on API endpoints

## 🐛 Troubleshooting

### "redirect_uri_mismatch" error

**Problem:** Redirect URI doesn't match Google Cloud Console

**Solution:**
- Check redirect URI in `.env` matches exactly
- Ensure URI is added in Google Cloud Console
- Include protocol (http/https) and port

### "invalid_client" error

**Problem:** Client ID or Secret incorrect

**Solution:**
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Regenerate credentials if needed

### "access_denied" error

**Problem:** User denied permissions or scope issue

**Solution:**
- Check scopes in `google.strategy.ts`
- Ensure Fitness API is enabled
- Add test user in OAuth consent screen (for development)

### Token refresh fails

**Problem:** No refresh token saved

**Solution:**
- Ensure `accessType: 'offline'` in strategy
- Ensure `prompt: 'consent'` to force token generation
- User must re-authenticate to get new refresh token

### "insufficient_scope" error

**Problem:** Missing required scopes

**Solution:**
- Add missing scopes to OAuth consent screen
- Update scopes in `google.strategy.ts`
- User must re-authenticate with new scopes

## 📚 Database Schema Changes

The User entity now includes:

```typescript
@Column({ nullable: true, unique: true })
googleId: string;  // Google user ID

@Column({ nullable: true })
googleAccessToken: string;  // Short-lived access token

@Column({ nullable: true })
googleRefreshToken: string;  // Long-lived refresh token
```

## 🔄 Token Lifecycle

```
Initial Auth
├── User clicks "Connect Google Fit"
├── OAuth flow completes
├── accessToken (1 hour) saved
└── refreshToken (long-lived) saved

Token Expires
├── API request with accessToken
├── 401 Unauthorized received
├── Use refreshToken to get new accessToken
├── Update user record
└── Retry API request

Token Revoked
├── User revokes access in Google
├── refreshToken becomes invalid
└── User must re-authenticate
```

## ✅ Checklist

Before going live:

- [ ] Google Cloud project created
- [ ] Fitness API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth credentials created
- [ ] Environment variables set
- [ ] Dependencies installed (`npm install`)
- [ ] Backend running successfully
- [ ] Frontend has connect button
- [ ] Callback page created
- [ ] Test OAuth flow works
- [ ] Test step sync works
- [ ] Test token refresh works

## 🎉 You're Done!

Users can now connect their Google Fit accounts and have their steps automatically synced!

For more info:
- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- [Google Fit API Docs](https://developers.google.com/fit)
- [Passport.js Docs](http://www.passportjs.org/)
