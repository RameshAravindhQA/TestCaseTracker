
# Secrets Configuration Guide for TestCaseTracker

## Overview
This guide explains how to configure secrets (API keys, OAuth credentials) for TestCaseTracker in Replit environment.

## 1. Accessing Secrets in Replit

1. In your Replit workspace, navigate to the **Tools** pane
2. Select **Secrets** (or click the **+** button and type "Secrets")
3. Click **+ New Secret** to add new secrets

## 2. Required Secrets Configuration

### Gmail/Email Configuration

For email notifications and welcome emails:

```
EMAIL_PASSWORD
```
**Value**: Your Gmail App Password (not your regular Gmail password)

**How to get Gmail App Password**:
1. Go to your Google Account settings
2. Enable 2-Factor Authentication if not already enabled
3. Go to Security → 2-Step Verification → App passwords
4. Generate an app password for "Mail"
5. Use this 16-character password as the EMAIL_PASSWORD value

### Google OAuth Configuration (Optional)

For Google login integration:

```
GOOGLE_CLIENT_ID
```
**Value**: Your Google OAuth Client ID

```
GOOGLE_CLIENT_SECRET
```
**Value**: Your Google OAuth Client Secret

**How to get Google OAuth credentials**:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client IDs
5. Set authorized redirect URIs: `https://your-repl-name.your-username.repl.co/api/auth/google/callback`

### GitHub OAuth Configuration (Optional)

For GitHub login integration:

```
GITHUB_CLIENT_ID
```
**Value**: Your GitHub OAuth App Client ID

```
GITHUB_CLIENT_SECRET
```
**Value**: Your GitHub OAuth App Client Secret

**How to get GitHub OAuth credentials**:
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Set Authorization callback URL: `https://your-repl-name.your-username.repl.co/api/auth/github/callback`
4. Copy the Client ID and generate Client Secret

### Database Configuration

If using external PostgreSQL (Replit auto-configures this):

```
DATABASE_URL
```
**Value**: PostgreSQL connection string
**Format**: `postgresql://username:password@host:port/database`

### Security Secrets

```
JWT_SECRET
```
**Value**: Random secure string for JWT token signing
**Example**: `your-super-secret-jwt-key-change-this-in-production`

```
SESSION_SECRET
```
**Value**: Random secure string for session signing
**Example**: `your-session-secret-change-this-in-production`

## 3. Environment Variables for Local Development

Create a `.env` file in your project root with these values:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/testcasetracker

# Email Configuration
EMAIL_PASSWORD=your-gmail-app-password

# OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Security
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-session-secret-here

# Application
NODE_ENV=development
PORT=5000
```

## 4. Testing Configuration

After adding secrets, restart your application to verify:

1. Email functionality works (check welcome email sending)
2. OAuth login buttons appear and function
3. GitHub integration works for bug reporting

## 5. Security Best Practices

1. **Never commit secrets to version control**
2. Use strong, unique secrets for production
3. Regularly rotate OAuth credentials
4. Use Gmail App Passwords, not regular passwords
5. Limit OAuth app permissions to minimum required

## 6. Troubleshooting

### Email Issues
- Verify Gmail App Password is correct
- Check 2FA is enabled on Gmail account
- Ensure less secure app access is disabled (use App Passwords instead)

### OAuth Issues
- Verify callback URLs match exactly
- Check OAuth app is not suspended
- Ensure proper scopes are requested

### Database Issues
- Verify DATABASE_URL format is correct
- Check database server is accessible
- Ensure user has proper permissions
