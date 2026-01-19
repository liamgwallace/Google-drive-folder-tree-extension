/**
 * Authentication Module
 * Handles Google OAuth authentication using Chrome Identity API
 */

class Auth {
  constructor() {
    this.token = null;
    this.isAuthenticated = false;
  }

  /**
   * Get a valid authentication token
   * @param {boolean} interactive - Whether to show interactive auth prompt
   * @returns {Promise<string>} Access token
   */
  async getToken(interactive = false) {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive }, (token) => {
        if (chrome.runtime.lastError) {
          console.error('Auth error:', chrome.runtime.lastError);
          this.isAuthenticated = false;
          this.token = null;
          reject(chrome.runtime.lastError);
        } else if (token) {
          this.token = token;
          this.isAuthenticated = true;
          resolve(token);
        } else {
          this.isAuthenticated = false;
          this.token = null;
          reject(new Error('No token received'));
        }
      });
    });
  }

  /**
   * Sign in and get authentication token
   * @returns {Promise<string>} Access token
   */
  async signIn() {
    try {
      const token = await this.getToken(true);
      await this.storeAuthState(true);
      return token;
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  }

  /**
   * Sign out and revoke token
   * @returns {Promise<void>}
   */
  async signOut() {
    try {
      if (this.token) {
        // Revoke the token
        await this.revokeToken(this.token);
      }

      // Remove the cached token
      return new Promise((resolve, reject) => {
        chrome.identity.clearAllCachedAuthTokens(() => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            this.token = null;
            this.isAuthenticated = false;
            this.storeAuthState(false);
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if revocation fails, clear local state
      this.token = null;
      this.isAuthenticated = false;
      await this.storeAuthState(false);
      throw error;
    }
  }

  /**
   * Revoke the access token
   * @param {string} token - Token to revoke
   * @returns {Promise<void>}
   */
  async revokeToken(token) {
    const revokeUrl = `https://accounts.google.com/o/oauth2/revoke?token=${token}`;
    try {
      const response = await fetch(revokeUrl);
      if (!response.ok) {
        console.warn('Token revocation returned non-OK status:', response.status);
      }
    } catch (error) {
      console.error('Token revocation failed:', error);
      // Don't throw - continue with sign out even if revocation fails
    }
  }

  /**
   * Check if user is currently authenticated
   * @returns {Promise<boolean>}
   */
  async checkAuth() {
    try {
      // Try to get a token non-interactively
      await this.getToken(false);
      return this.isAuthenticated;
    } catch (error) {
      this.isAuthenticated = false;
      return false;
    }
  }

  /**
   * Get a fresh token, refreshing if necessary
   * @returns {Promise<string>}
   */
  async getFreshToken() {
    try {
      // Try to get existing token
      const token = await this.getToken(false);

      // Verify token is valid by making a test request
      const isValid = await this.verifyToken(token);

      if (!isValid) {
        // Token expired, remove it and get a new one
        await this.removeCachedToken(token);
        return await this.getToken(true);
      }

      return token;
    } catch (error) {
      // If non-interactive fails, try interactive
      return await this.getToken(true);
    }
  }

  /**
   * Verify if a token is valid
   * @param {string} token - Token to verify
   * @returns {Promise<boolean>}
   */
  async verifyToken(token) {
    try {
      const response = await fetch(
        'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + token
      );
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Remove a specific cached token
   * @param {string} token - Token to remove
   * @returns {Promise<void>}
   */
  async removeCachedToken(token) {
    return new Promise((resolve) => {
      chrome.identity.removeCachedAuthToken({ token }, () => {
        resolve();
      });
    });
  }

  /**
   * Store authentication state in chrome.storage
   * @param {boolean} isAuthenticated - Authentication state
   * @returns {Promise<void>}
   */
  async storeAuthState(isAuthenticated) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ isAuthenticated }, () => {
        resolve();
      });
    });
  }

  /**
   * Get stored authentication state from chrome.storage
   * @returns {Promise<boolean>}
   */
  async getStoredAuthState() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['isAuthenticated'], (result) => {
        resolve(result.isAuthenticated || false);
      });
    });
  }

  /**
   * Handle authentication errors
   * @param {Error} error - Error object
   * @returns {string} User-friendly error message
   */
  getErrorMessage(error) {
    if (error.message && error.message.includes('OAuth2')) {
      return 'Authentication failed. Please check your OAuth configuration.';
    } else if (error.message && error.message.includes('network')) {
      return 'Network error. Please check your internet connection.';
    } else if (error.message && error.message.includes('User')) {
      return 'Authentication cancelled by user.';
    } else {
      return 'Authentication failed. Please try again.';
    }
  }
}

// Create a global auth instance
const auth = new Auth();
