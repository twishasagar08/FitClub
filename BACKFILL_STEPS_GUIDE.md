# How to Backfill Missing Step Data

## Problem
- Today (Nov 24) shows 0 steps
- Missing records from Nov 18 to Nov 23

## Why This Happened
1. **0 steps for today**: You clicked "Sync Now" which was fetching TODAY's incomplete data
2. **Missing historical data**: The midnight cron job wasn't running during those days

## Solution: Manual Backfill

### Option 1: Sync Last 7 Days (Recommended)
```bash
# Replace {userId} with the actual user ID
GET http://localhost:3000/steps/sync-history/{userId}?days=7
```

**Example:**
```bash
curl "http://localhost:3000/steps/sync-history/your-user-id-here?days=7"
```

### Option 2: Sync Last 30 Days
```bash
GET http://localhost:3000/steps/sync-history/{userId}?days=30
```

### Option 3: Use the Updated "Sync Now" Button
The "Sync Now" button now syncs **yesterday's** data (not today's), which is more accurate.

## What Changed

### Before Fix:
- ❌ "Sync Now" fetched TODAY's incomplete steps
- ❌ No way to backfill missing days
- ❌ Token expiry caused sync failures

### After Fix:
- ✅ "Sync Now" fetches YESTERDAY's complete steps
- ✅ New endpoint `/steps/sync-history/:userId?days=N` to backfill
- ✅ Automatic token refresh on every sync
- ✅ Midnight cron job will work going forward

## How to Get User ID

You can find the user ID in the browser URL or from the database:

```sql
SELECT id, name, email FROM users;
```

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/steps/sync/:userId` | PUT | Sync yesterday's steps (manual) |
| `/steps/sync-history/:userId?days=7` | GET | Backfill last 7 days |
| `/steps/:userId` | GET | View all step records |

## Example Response from Backfill

```json
{
  "synced": 7,
  "records": [
    {
      "id": "uuid",
      "userId": "user-id",
      "date": "2025-11-23T00:00:00.000Z",
      "steps": 8234
    },
    {
      "id": "uuid",
      "userId": "user-id",
      "date": "2025-11-22T00:00:00.000Z",
      "steps": 6521
    }
    // ... more records
  ]
}
```

## Next Steps

1. **Backfill missing data**: Call the sync-history endpoint
2. **Check the results**: Refresh the Step History page
3. **Going forward**: Midnight cron job will automatically sync every day
4. **Manual sync**: Use "Sync Now" button to sync yesterday's data anytime

## Important Notes

- ✅ Google Fit keeps historical data for ~30 days
- ✅ You can backfill up to 30 days at once
- ✅ The endpoint automatically handles token refresh
- ✅ Existing records are updated (not duplicated)
