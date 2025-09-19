# Deployment Guide

This guide walks you through deploying the GSC Web Dashboard to Railway.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Google Cloud Project**: With Search Console API enabled
3. **GitHub Repository**: Fork this repository to your account

## Step 1: Google Cloud Setup

### 1.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### 1.2 Enable APIs
1. Navigate to "APIs & Services" → "Library"
2. Search and enable:
   - **Google Search Console API**
   - **Google Webmasters API**

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Configure:
   - Application type: **Web application**
   - Name: **GSC Dashboard**
   - Authorized redirect URIs: `https://your-app-name.railway.app/api/auth/callback/google`
4. Save the **Client ID** and **Client Secret**

## Step 2: Railway Deployment

### 2.1 Deploy from GitHub
1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Choose "Deploy from GitHub repo"
4. Select your forked repository

### 2.2 Add PostgreSQL Database
1. In your Railway project dashboard
2. Click "New" → "Database" → "PostgreSQL"
3. Railway will automatically create a `DATABASE_URL` environment variable

### 2.3 Configure Environment Variables
In your Railway project settings, add these environment variables:

```bash
# NextAuth Configuration
NEXTAUTH_SECRET=your-random-secret-key-here
NEXTAUTH_URL=https://your-app-name.railway.app

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Database (automatically provided by Railway)
DATABASE_URL=postgresql://...
```

### 2.4 Generate NextAuth Secret
Run this command locally to generate a secure secret:
```bash
openssl rand -base64 32
```

### 2.5 Update OAuth Redirect URI
1. Go back to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 client
3. Update redirect URI to: `https://your-app-name.railway.app/api/auth/callback/google`

## Step 3: Database Migration

### 3.1 Run Migrations
Railway will automatically run the build process, but you may need to run database migrations manually:

1. In Railway dashboard, go to your app service
2. Open the "Deploy" tab
3. Click on the latest deployment
4. Use the terminal to run:
```bash
npm run db:generate
npm run db:migrate
```

Alternatively, set up a deploy script in `package.json`:
```json
{
  "scripts": {
    "build": "npm run db:generate && npm run db:migrate && next build"
  }
}
```

## Step 4: Search Console Setup

### 4.1 Add Service Account (Optional)
If you want to use service account authentication for some properties:

1. Create a service account in Google Cloud Console
2. Download the JSON key file
3. Add the service account email to your Search Console properties as a user

### 4.2 Add OAuth User
For each Google account you want to connect:
1. The account owner needs to sign into your deployed app
2. Grant the necessary permissions during OAuth flow
3. The app will automatically sync available properties

## Step 5: Testing

### 5.1 Test Authentication
1. Visit your deployed app: `https://your-app-name.railway.app`
2. Click "Sign in with Google"
3. Grant permissions for Search Console access
4. Verify you can see your connected account

### 5.2 Test Site Sync
1. In the dashboard, click "Sync Sites" for your connected account
2. Verify that your Search Console properties appear
3. Try running a search analytics query

## Step 6: Custom Domain (Optional)

### 6.1 Add Custom Domain in Railway
1. Go to your app service settings
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### 6.2 Update Environment Variables
Update these variables with your custom domain:
```bash
NEXTAUTH_URL=https://your-custom-domain.com
```

### 6.3 Update Google OAuth
Update the OAuth redirect URI in Google Cloud Console:
```
https://your-custom-domain.com/api/auth/callback/google
```

## Troubleshooting

### Common Issues

**1. OAuth Redirect URI Mismatch**
- Ensure the redirect URI in Google Cloud matches your deployed URL exactly
- Check that `NEXTAUTH_URL` environment variable is set correctly

**2. Database Connection Issues**
- Verify `DATABASE_URL` is set correctly
- Check Railway database logs for connection errors
- Ensure database migrations have run successfully

**3. Search Console API Errors**
- Verify the Search Console API is enabled in Google Cloud
- Check that the user has access to the Search Console properties
- Ensure OAuth scopes include webmasters permissions

**4. Build Failures**
- Check Railway build logs for specific error messages
- Verify all environment variables are set
- Ensure `package.json` dependencies are correct

### Logs and Monitoring

- **Railway Logs**: Available in the Railway dashboard under "Observability"
- **Application Logs**: Use `console.log` statements for debugging
- **Database Logs**: Available in the PostgreSQL service logs

## Security Notes

1. **Environment Variables**: Never commit sensitive data to your repository
2. **OAuth Scopes**: Only request necessary permissions
3. **Database Access**: Railway databases are private by default
4. **HTTPS**: Railway provides SSL/TLS certificates automatically

## Support

For deployment issues:
1. Check Railway documentation: [docs.railway.app](https://docs.railway.app)
2. Review Google Cloud API documentation
3. Check application logs for specific error messages

