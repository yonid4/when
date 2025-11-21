# Google OAuth Redirect URI Fix

## Problem
When signing in with Google from localhost, you get redirected to your EC2 URL, and then the Google Calendar connection fails with a `redirect_uri_mismatch` error.

## Root Causes
1. **Supabase Site URL** is set to EC2 URL instead of localhost
2. **Google OAuth redirect URI** in your backend `.env` is set to EC2 URL
3. **Google Cloud Console** may not have localhost URLs registered

## Complete Fix

### 1. Fix Supabase Configuration (CRITICAL)

This is why you're being redirected to EC2 after Google sign-in.

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Update these settings:

   **Site URL:**
   ```
   http://localhost:3000
   ```

   **Redirect URLs (add all of these):**
   ```
   http://localhost:3000/**
   http://localhost:3000
   http://ec2-3-101-190-142.us-west-1.compute.amazonaws.com/**
   http://ec2-3-101-190-142.us-west-1.compute.amazonaws.com
   ```

5. Click **Save**

### 2. Fix Backend .env File

Update your root `.env` file:

```env
# Change this line:
GOOGLE_REDIRECT_URI=http://ec2-3-101-190-142.us-west-1.compute.amazonaws.com/api/auth/google/callback

# To this:
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

### 3. Fix Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your project
3. Click on your **OAuth 2.0 Client ID**
4. Under **Authorized JavaScript origins**, add:
   ```
   http://localhost:3000
   http://localhost:5000
   http://ec2-3-101-190-142.us-west-1.compute.amazonaws.com
   ```

5. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:5000/api/auth/google/callback
   http://ec2-3-101-190-142.us-west-1.compute.amazonaws.com/api/auth/google/callback
   ```

6. Click **Save**

### 4. Update Frontend Environment Variables

Create/update `frontend/.env.local`:

```env
REACT_APP_SUPABASE_URL=your_actual_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
```

Replace `your_actual_supabase_url` and `your_actual_supabase_anon_key` with your actual values from Supabase.

### 5. Restart Everything

```bash
# Stop all running servers

# Start backend
cd backend
python run.py

# In another terminal, start frontend
cd frontend
npm start
```

## Testing the Fix

1. Open `http://localhost:3000` in your browser
2. Click "Sign in with Google"
3. Complete Google sign-in
4. You should be redirected back to `http://localhost:3000` (not EC2)
5. Open an event
6. Click "Connect Google Calendar"
7. Complete Google OAuth
8. You should be redirected back to `http://localhost:5000/api/auth/google/callback` and then to your event page

## For Production Deployment

When deploying to production, you'll need to:

1. **Update Supabase Site URL** to your production URL
2. **Update backend .env** to use production redirect URI
3. Keep both localhost and production URLs in Google Cloud Console (for development and production)

## Quick Reference

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Google Cloud Console**: https://console.cloud.google.com/apis/credentials
- **Backend .env location**: `/Users/yoni/Desktop/Projects/when/.env`
- **Frontend .env location**: `/Users/yoni/Desktop/Projects/when/frontend/.env.local`


