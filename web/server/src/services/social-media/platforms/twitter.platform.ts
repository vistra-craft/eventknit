/**
 * Twitter Platform Adapter
 *
 * Implements Twitter API v2 integration for event promotion
 * API Reference: https://developer.twitter.com/en/docs/twitter-api
 *
 * To enable: Set TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET in environment
 */

import {
  SocialMediaPlatform,
  TokenResponse,
  SocialProfile,
  PostData,
  PostResponse,
  MediaData,
  MediaResponse,
  PostMetrics,
} from '../platform.interface.js';
import { URLSearchParams } from 'url';
import { logger } from '../../../utils/logger.js';
import { config } from '../../../config/index.js';
import crypto from 'crypto';

const TWITTER_API_BASE = 'https://api.twitter.com/2';

export class TwitterPlatform implements SocialMediaPlatform {
  private codeVerifier: string = '';

  getName(): string {
    return 'twitter';
  }

  private getClientId(): string {
    return config.socialMedia?.twitter?.clientId || '';
  }

  private getClientSecret(): string {
    return config.socialMedia?.twitter?.clientSecret || '';
  }

  private isConfigured(): boolean {
    return Boolean(this.getClientId() && this.getClientSecret());
  }

  private generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  private generateCodeChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }

  getAuthorizationUrl(redirectUri: string, state?: string): string {
    const clientId = this.getClientId();

    // Generate PKCE code verifier and challenge
    this.codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(this.codeVerifier);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'tweet.read tweet.write users.read offline.access',
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      ...(state && { state: `${state}|${this.codeVerifier}` }), // Include verifier in state
    });

    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<TokenResponse> {
    if (!this.isConfigured()) {
      logger.warn('Twitter: API keys not configured, using placeholder response');
      return this.getPlaceholderTokenResponse();
    }

    try {
      // Extract code verifier from state if available
      const codeVerifier = this.codeVerifier || 'challenge';

      const credentials = Buffer.from(
        `${this.getClientId()}:${this.getClientSecret()}`,
      ).toString('base64');

      const body = new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      });

      const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error('Twitter token exchange failed:', error);
        throw new Error(error.error_description || 'Token exchange failed');
      }

      const data = await response.json();

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in || 7200, // 2 hours default
        tokenType: data.token_type || 'Bearer',
        scope: data.scope,
      };
    } catch (error) {
      logger.error('Twitter: Error exchanging code for token:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    if (!this.isConfigured()) {
      logger.warn('Twitter: API keys not configured, using placeholder response');
      return this.getPlaceholderTokenResponse();
    }

    try {
      const credentials = Buffer.from(
        `${this.getClientId()}:${this.getClientSecret()}`,
      ).toString('base64');

      const body = new URLSearchParams({
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });

      const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error('Twitter token refresh failed:', error);
        throw new Error(error.error_description || 'Token refresh failed');
      }

      const data = await response.json();

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in || 7200,
        tokenType: data.token_type || 'Bearer',
      };
    } catch (error) {
      logger.error('Twitter: Error refreshing token:', error);
      throw error;
    }
  }

  async getUserProfile(accessToken: string): Promise<SocialProfile> {
    if (!this.isConfigured()) {
      logger.warn('Twitter: API keys not configured, using placeholder response');
      return this.getPlaceholderProfile();
    }

    try {
      const response = await fetch(
        `${TWITTER_API_BASE}/users/me?user.fields=profile_image_url,public_metrics`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        logger.error('Twitter: Failed to get user profile:', error);
        throw new Error(error.detail || 'Failed to get user profile');
      }

      const data = await response.json();
      const user = data.data;

      return {
        id: user.id,
        name: user.name,
        username: user.username,
        profilePicture: user.profile_image_url,
        followers: user.public_metrics?.followers_count,
        following: user.public_metrics?.following_count,
        metadata: { raw: user },
      };
    } catch (error) {
      logger.error('Twitter: Error getting user profile:', error);
      throw error;
    }
  }

  async createPost(accessToken: string, post: PostData): Promise<PostResponse> {
    if (!this.isConfigured()) {
      logger.warn('Twitter: API keys not configured, using placeholder response');
      return this.getPlaceholderPostResponse(post);
    }

    try {
      let tweetText = post.content;

      // Add hashtags if provided
      if (post.hashtags?.length) {
        tweetText += `\n\n${post.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}`;
      }

      // Add link if provided
      if (post.link) {
        tweetText += `\n\n${post.link}`;
      }

      const body: { text: string; media?: { media_ids: string[] } } = {
        text: tweetText.substring(0, 280), // Twitter limit
      };

      // Add media if uploaded
      if (post.mediaUrls?.length) {
        // Note: Media must be uploaded first using uploadMedia
        logger.info('Twitter: Media URLs provided but must be uploaded separately');
      }

      const response = await fetch(`${TWITTER_API_BASE}/tweets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error('Twitter: Failed to create tweet:', error);
        throw new Error(error.detail || 'Failed to create tweet');
      }

      const data = await response.json();

      return {
        postId: data.data.id,
        platform: 'twitter',
        url: `https://twitter.com/i/status/${data.data.id}`,
        publishedAt: new Date(),
        metadata: { text: data.data.text },
      };
    } catch (error) {
      logger.error('Twitter: Error creating tweet:', error);
      throw error;
    }
  }

  async uploadMedia(accessToken: string, media: MediaData): Promise<MediaResponse> {
    if (!this.isConfigured()) {
      logger.warn('Twitter: API keys not configured, using placeholder response');
      return { mediaId: `tw_media_placeholder_${Date.now()}`, url: media.url };
    }

    try {
      // Twitter media upload requires OAuth 1.0a or downloading the image first
      // For simplicity, we'll return a placeholder and note the limitation
      logger.warn('Twitter: Media upload requires additional implementation for production');

      return {
        mediaId: `tw_media_${Date.now()}`,
        url: media.url,
        metadata: { note: 'Media upload requires OAuth 1.0a implementation' },
      };
    } catch (error) {
      logger.error('Twitter: Error uploading media:', error);
      throw error;
    }
  }

  async getPostMetrics(accessToken: string, postId: string): Promise<PostMetrics> {
    if (!this.isConfigured()) {
      logger.warn('Twitter: API keys not configured, using placeholder response');
      return this.getPlaceholderMetrics();
    }

    try {
      const response = await fetch(
        `${TWITTER_API_BASE}/tweets/${postId}?tweet.fields=public_metrics`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        logger.error('Twitter: Failed to get tweet metrics:', error);
        throw new Error(error.detail || 'Failed to get tweet metrics');
      }

      const data = await response.json();
      const metrics = data.data.public_metrics || {};

      return {
        likes: metrics.like_count || 0,
        comments: metrics.reply_count || 0,
        shares: metrics.retweet_count || 0,
        views: metrics.impression_count || 0,
        impressions: metrics.impression_count || 0,
        engagementRate: 0,
        lastUpdated: new Date(),
      };
    } catch (error) {
      logger.error('Twitter: Error getting tweet metrics:', error);
      throw error;
    }
  }

  async deletePost(accessToken: string, postId: string): Promise<boolean> {
    if (!this.isConfigured()) {
      logger.warn('Twitter: API keys not configured, simulating delete');
      return true;
    }

    try {
      const response = await fetch(`${TWITTER_API_BASE}/tweets/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error('Twitter: Failed to delete tweet:', error);
        throw new Error(error.detail || 'Failed to delete tweet');
      }

      return true;
    } catch (error) {
      logger.error('Twitter: Error deleting tweet:', error);
      throw error;
    }
  }

  async validateToken(accessToken: string): Promise<boolean> {
    if (!this.isConfigured()) {
      logger.warn('Twitter: API keys not configured, assuming valid');
      return true;
    }

    try {
      const response = await fetch(`${TWITTER_API_BASE}/users/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.ok;
    } catch (error) {
      logger.error('Twitter: Error validating token:', error);
      return false;
    }
  }

  // Placeholder methods for when API keys are not configured
  private getPlaceholderTokenResponse(): TokenResponse {
    return {
      accessToken: `tw_placeholder_${Date.now()}`,
      refreshToken: `tw_refresh_placeholder_${Date.now()}`,
      expiresIn: 7200,
      tokenType: 'Bearer',
    };
  }

  private getPlaceholderProfile(): SocialProfile {
    return {
      id: 'tw_placeholder_user',
      name: 'Twitter User (Configure API Keys)',
      username: 'twitter_user',
      profilePicture: undefined,
      metadata: { placeholder: true },
    };
  }

  private getPlaceholderPostResponse(post: PostData): PostResponse {
    logger.info('Twitter: Creating placeholder tweet', { content: post.content.substring(0, 50) });
    return {
      postId: `tw_placeholder_post_${Date.now()}`,
      platform: 'twitter',
      url: undefined,
      publishedAt: new Date(),
      metadata: { placeholder: true },
    };
  }

  private getPlaceholderMetrics(): PostMetrics {
    return {
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      impressions: 0,
      engagementRate: 0,
      lastUpdated: new Date(),
    };
  }
}
