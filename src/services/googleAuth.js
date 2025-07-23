"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAuthService = void 0;
const googleapis_1 = require("googleapis");
// OAuth2 configuration - these would be set from environment variables in production
const OAUTH_CONFIG = {
    clientId: process.env.VITE_GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.VITE_GOOGLE_CLIENT_SECRET || '',
    redirectUri: 'http://localhost:3000/auth/callback',
    scopes: [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive.file',
    ],
};
class GoogleAuthService {
    constructor() {
        this.oauth2Client = new googleapis_1.google.auth.OAuth2(OAUTH_CONFIG.clientId, OAUTH_CONFIG.clientSecret, OAUTH_CONFIG.redirectUri);
    }
    /**
     * Get the authorization URL for the user to grant permissions
     */
    getAuthUrl() {
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: OAUTH_CONFIG.scopes,
            prompt: 'consent',
        });
    }
    /**
     * Exchange authorization code for access tokens
     */
    async getTokens(code) {
        const { tokens } = await this.oauth2Client.getToken(code);
        this.oauth2Client.setCredentials(tokens);
        return tokens;
    }
    /**
     * Set stored credentials
     */
    setCredentials(tokens) {
        this.oauth2Client.setCredentials(tokens);
    }
    /**
     * Refresh access token using refresh token
     */
    async refreshToken() {
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        this.oauth2Client.setCredentials(credentials);
        return credentials;
    }
    /**
     * Check if current tokens are valid
     */
    isAuthenticated() {
        const credentials = this.oauth2Client.credentials;
        return !!(credentials?.access_token && this.isTokenValid(credentials));
    }
    /**
     * Check if token is still valid (not expired)
     */
    isTokenValid(credentials) {
        if (!credentials.expiry_date)
            return true;
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
    clearCredentials() {
        this.oauth2Client.setCredentials({});
    }
}
exports.GoogleAuthService = GoogleAuthService;
