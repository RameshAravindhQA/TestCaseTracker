
import { logger } from "./logger";
import { storage } from "./storage";

export class OAuthService {
  // Google OAuth configuration
  private getGoogleOAuthConfig() {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: `${process.env.BASE_URL || process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/api/auth/google/callback`
    };
  }

  // GitHub OAuth configuration
  private getGitHubOAuthConfig() {
    return {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      redirectUri: `${process.env.BASE_URL || process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/api/auth/github/callback`
    };
  }

  // Generate Google OAuth URL with PKCE and state for security
  generateGoogleAuthUrl(state: string, codeVerifier: string): string {
    const config = this.getGoogleOAuthConfig();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Generate GitHub OAuth URL with proper state for CSRF protection
  generateGitHubAuthUrl(state: string): string {
    const config = this.getGitHubOAuthConfig();
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: 'user:email',
      state: state
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  // Generate PKCE code challenge from verifier
  private generateCodeChallenge(codeVerifier: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  }

  // Generate secure random string for PKCE and state
  generateSecureRandom(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('base64url');
  }

  // Exchange Google authorization code for access token with PKCE
  async exchangeGoogleCode(code: string, codeVerifier: string) {
    const config = this.getGoogleOAuthConfig();
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange Google authorization code');
    }

    const tokenData = await tokenResponse.json();
    
    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch Google user info');
    }

    const userData = await userResponse.json();
    
    return {
      email: userData.email,
      firstName: userData.given_name || userData.name?.split(' ')[0] || '',
      lastName: userData.family_name || userData.name?.split(' ').slice(1).join(' ') || '',
      profilePicture: userData.picture,
      provider: 'google',
      providerId: userData.id
    };
  }

  // Exchange GitHub authorization code for access token
  async exchangeGitHubCode(code: string) {
    const config = this.getGitHubOAuthConfig();
    
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange GitHub authorization code');
    }

    const tokenData = await tokenResponse.json();
    
    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${tokenData.access_token}`,
        'User-Agent': 'TestCaseTracker-App'
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch GitHub user info');
    }

    const userData = await userResponse.json();

    // Get user email (prioritize verified primary email)
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `token ${tokenData.access_token}`,
        'User-Agent': 'TestCaseTracker-App'
      },
    });

    let email = userData.email;
    
    // Strictly enforce verified email requirement for GitHub
    if (!email && emailResponse.ok) {
      const emails = await emailResponse.json();
      // Only consider verified emails - no fallback to unverified
      const verifiedEmails = emails.filter((e: any) => e.verified);
      
      if (verifiedEmails.length === 0) {
        throw new Error('No verified email available from GitHub account. Please verify at least one email address in your GitHub account settings and try again.');
      }
      
      // Prefer verified primary email, then any verified email
      const verifiedPrimaryEmail = verifiedEmails.find((e: any) => e.primary);
      email = verifiedPrimaryEmail?.email || verifiedEmails[0]?.email;
    }

    // Final validation - reject if no email or placeholder email
    if (!email || email.includes('@github.local')) {
      throw new Error('No verified email available from GitHub account. Please verify your email address in GitHub settings and try again.');
    }
    
    return {
      email: email,
      firstName: userData.name?.split(' ')[0] || userData.login,
      lastName: userData.name?.split(' ').slice(1).join(' ') || '',
      profilePicture: userData.avatar_url,
      provider: 'github',
      providerId: userData.id.toString()
    };
  }

  // Find or create user from OAuth data
  async findOrCreateOAuthUser(oauthData: any) {
    try {
      // Try to find existing user by email
      let user = await storage.getUserByEmail(oauthData.email);
      
      if (user) {
        // Update user profile picture if not set
        if (!user.profilePicture && oauthData.profilePicture) {
          await storage.updateUser(user.id, {
            profilePicture: oauthData.profilePicture
          });
          user.profilePicture = oauthData.profilePicture;
        }
        return user;
      }

      // Create new user
      const newUser = await storage.createUser({
        email: oauthData.email,
        firstName: oauthData.firstName,
        lastName: oauthData.lastName,
        password: '', // OAuth users don't need password
        role: 'Tester',
        profilePicture: oauthData.profilePicture,
        status: 'Active',
        provider: oauthData.provider,
        providerId: oauthData.providerId
      });

      logger.info(`Created new OAuth user: ${oauthData.email} via ${oauthData.provider}`);
      return newUser;
    } catch (error) {
      logger.error('OAuth user creation error:', error);
      throw error;
    }
  }
}

export const oauthService = new OAuthService();
