# How to Disable Email Confirmation in Supabase

## Method 1: Supabase Dashboard (Recommended)

1. **Go to your Supabase project dashboard**
2. **Navigate to Authentication → Settings**
3. **Find "Email Auth" section**
4. **Uncheck "Enable email confirmations"**
5. **Click "Save"**

## Method 2: SQL Command (Alternative)

Run this in your Supabase SQL Editor:

```sql
-- Disable email confirmation
UPDATE auth.config 
SET enable_confirmations = false
WHERE id = 'auth';
```

## Method 3: Environment Variables

Add these to your Supabase project settings:

```
DISABLE_SIGNUP = false
ENABLE_EMAIL_CONFIRMATIONS = false
```

## Verification

After making changes, test by:
1. Creating a new account
2. Immediately trying to log in
3. Should work without email confirmation
