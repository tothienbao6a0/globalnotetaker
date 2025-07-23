import { google } from 'googleapis';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

// OAuth2 configuration - these must be set from environment variables
const getOAuthConfig = () => ({
  clientId: process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.VITE_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: 'http://localhost:3000/auth/callback',
  scopes: [
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/drive.file',
  ],
});

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date?: number;
}

export class GoogleAuthService {
  private oauth2Client: any;

  constructor() {
    const OAUTH_CONFIG = getOAuthConfig();
    
    // Debug environment variables
    console.log('DEBUG: CLIENT_ID exists:', !!OAUTH_CONFIG.clientId);
    console.log('DEBUG: CLIENT_SECRET exists:', !!OAUTH_CONFIG.clientSecret);
    console.log('DEBUG: CLIENT_ID value:', OAUTH_CONFIG.clientId ? 'SET' : 'EMPTY');
    console.log('DEBUG: CLIENT_SECRET value:', OAUTH_CONFIG.clientSecret ? 'SET' : 'EMPTY');
    
    // Check if credentials are properly configured
    if (!OAUTH_CONFIG.clientId || !OAUTH_CONFIG.clientSecret) {
      console.warn('Google OAuth credentials not configured. Please set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_SECRET in your .env file.');
    } else {
      console.log('Google OAuth credentials successfully loaded!');
    }

    this.oauth2Client = new google.auth.OAuth2(
      OAUTH_CONFIG.clientId,
      OAUTH_CONFIG.clientSecret,
      OAUTH_CONFIG.redirectUri
    );
  }

  /**
   * Check if OAuth credentials are configured
   */
  isConfigured(): boolean {
    const OAUTH_CONFIG = getOAuthConfig();
    return !!(OAUTH_CONFIG.clientId && OAUTH_CONFIG.clientSecret);
  }

  /**
   * Get the authorization URL for the user to grant permissions
   */
  getAuthUrl(): string {
    if (!this.isConfigured()) {
      throw new Error('Google OAuth credentials not configured. Please set up your .env file with VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_SECRET.');
    }

    const OAUTH_CONFIG = getOAuthConfig();
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: OAUTH_CONFIG.scopes,
      prompt: 'consent',
    });
  }

  /**
   * Exchange authorization code for access tokens
   */
  async getTokens(code: string): Promise<AuthTokens> {
    if (!this.isConfigured()) {
      throw new Error('Google OAuth credentials not configured');
    }

    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens as AuthTokens;
  }

  /**
   * Set stored credentials
   */
  setCredentials(tokens: AuthTokens): void {
    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<AuthTokens> {
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    this.oauth2Client.setCredentials(credentials);
    return credentials as AuthTokens;
  }

  /**
   * Check if current tokens are valid
   */
  isAuthenticated(): boolean {
    const credentials = this.oauth2Client.credentials;
    return !!(credentials?.access_token && this.isTokenValid(credentials));
  }

  /**
   * Check if token is still valid (not expired)
   */
  private isTokenValid(credentials: any): boolean {
    if (!credentials.expiry_date) return true;
    return Date.now() < credentials.expiry_date;
  }

  /**
   * Get the configured OAuth2 client for API calls
   */
  getAuthClient() {
    return this.oauth2Client;
  }

  /**
   * Clear stored credentials
   */
  clearCredentials(): void {
    this.oauth2Client.setCredentials({});
  }
} 