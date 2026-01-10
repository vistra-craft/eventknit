/**
 * Facebook Platform Adapter
 *
 * Implements Facebook Graph API integration for event promotion
 * API Reference: https://developers.facebook.com/docs/graph-api
 *
 * To enable: Set FACEBOOK_CLIENT_ID and FACEBOOK_CLIENT_SECRET in environment
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

const GRAPH_API_VERSION = 'v18.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export class FacebookPlatform implements SocialMediaPlatform {
  getName(): string {
    return 'facebook';
  }

  private getClientId(): string {
    return config.socialMedia?.facebook?.clientId || '';
  }

  private getClientSecret(): string {
    return config.socialMedia?.facebook?.clientSecret || '';
  }

  private isConfigured(): boolean {
    return Boolean(this.getClientId() && this.getClientSecret());
  }

  getAuthorizationUrl(redirectUri: string, state?: string): string {
    const clientId = this.getClientId();
    const scopes = [
      'pages_manage_posts',
      'pages_read_engagement',
      'pages_show_list',
      'public_profile',
    ].join(',');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      response_type: 'code',
      ...(state && { state }),
    });

    return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<TokenResponse> {
    if (!this.isConfigured()) {
      logger.warn('Facebook: API keys not configured, using placeholder response');
      return this.getPlaceholderTokenResponse();
    }

    try {
      const params = new URLSearchParams({
        client_id: this.getClientId(),
        client_secret: this.getClientSecret(),
        redirect_uri: redirectUri,
        code,
      });

      const response = await fetch(
        `${GRAPH_API_BASE}/oauth/access_token?${params.toString()}`,
      );

      if (!response.ok) {
        const error = await response.json();
        logger.error('Facebook token exchange failed:', error);
        throw new Error(error.error?.message || 'Token exchange failed');
      }

      const data = await response.json();

      // Exchange for long-lived token
      const longLivedToken = await this.exchangeForLongLivedToken(data.access_token);

      return {
        accessToken: longLivedToken.access_token,
        refreshToken: undefined, // Facebook uses long-lived tokens instead
        expiresIn: longLivedToken.expires_in || 5184000, // 60 days default
        tokenType: 'Bearer',
      };
    } catch (error) {
      logger.error('Facebook: Error exchanging code for token:', error);
      throw error;
    }
  }

  private async exchangeForLongLivedToken(shortLivedToken: string): Promise<{
    access_token: string;
    expires_in?: number;
  }> {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.getClientId(),
      client_secret: this.getClientSecret(),
      fb_exchange_token: shortLivedToken,
    });

    const response = await fetch(
      `${GRAPH_API_BASE}/oauth/access_token?${params.toString()}`,
    );

    if (!response.ok) {
      const error = await response.json();
      logger.error('Facebook long-lived token exchange failed:', error);
      throw new Error(error.error?.message || 'Long-lived token exchange failed');
    }

    return response.json();
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    // Facebook doesn't use refresh tokens - long-lived tokens last 60 days
    // After expiry, user must re-authenticate
    logger.info('Facebook: Token refresh requested (long-lived tokens do not refresh)');

    return {
      accessToken: refreshToken, // Return existing token
      refreshToken: undefined,
      expiresIn: 5184000,
      tokenType: 'Bearer',
    };
  }

  async getUserProfile(accessToken: string): Promise<SocialProfile> {
    if (!this.isConfigured()) {
      logger.warn('Facebook: API keys not configured, using placeholder response');
      return this.getPlaceholderProfile();
    }

    try {
      const params = new URLSearchParams({
        access_token: accessToken,
        fields: 'id,name,picture,email',
      });

      const response = await fetch(`${GRAPH_API_BASE}/me?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        logger.error('Facebook: Failed to get user profile:', error);
        throw new Error(error.error?.message || 'Failed to get user profile');
      }

      const data = await response.json();

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        profilePicture: data.picture?.data?.url,
        metadata: { raw: data },
      };
    } catch (error) {
      logger.error('Facebook: Error getting user profile:', error);
      throw error;
    }
  }

  async createPost(accessToken: string, post: PostData): Promise<PostResponse> {
    if (!this.isConfigured()) {
      logger.warn('Facebook: API keys not configured, using placeholder response');
      return this.getPlaceholderPostResponse(post);
    }

    try {
      // Get user's pages
      const pages = await this.getUserPages(accessToken);
      if (!pages.length) {
        throw new Error('No Facebook pages found for this account');
      }

      // Use the first page (or could be configurable)
      const page = pages[0];
      const pageAccessToken = page.access_token;

      const body: Record<string, string> = {
        message: post.content,
        access_token: pageAccessToken,
      };

      if (post.link) {
        body.link = post.link;
      }

      const response = await fetch(`${GRAPH_API_BASE}/${page.id}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error('Facebook: Failed to create post:', error);
        throw new Error(error.error?.message || 'Failed to create post');
      }

      const data = await response.json();

      return {
        postId: data.id,
        platform: 'facebook',
        url: `https://facebook.com/${data.id}`,
        publishedAt: new Date(),
        metadata: { pageId: page.id, pageName: page.name },
      };
    } catch (error) {
      logger.error('Facebook: Error creating post:', error);
      throw error;
    }
  }

  private async getUserPages(accessToken: string): Promise<Array<{
    id: string;
    name: string;
    access_token: string;
  }>> {
    const params = new URLSearchParams({
      access_token: accessToken,
    });

    const response = await fetch(`${GRAPH_API_BASE}/me/accounts?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      logger.error('Facebook: Failed to get user pages:', error);
      throw new Error(error.error?.message || 'Failed to get user pages');
    }

    const data = await response.json();
    return data.data || [];
  }

  async uploadMedia(accessToken: string, media: MediaData): Promise<MediaResponse> {
    if (!this.isConfigured()) {
      logger.warn('Facebook: API keys not configured, using placeholder response');
      return { mediaId: `fb_media_placeholder_${Date.now()}`, url: media.url };
    }

    try {
      const pages = await this.getUserPages(accessToken);
      if (!pages.length) {
        throw new Error('No Facebook pages found for this account');
      }

      const page = pages[0];
      const pageAccessToken = page.access_token;

      const endpoint = media.type === 'video'
        ? `${GRAPH_API_BASE}/${page.id}/videos`
        : `${GRAPH_API_BASE}/${page.id}/photos`;

      const body: Record<string, string> = {
        url: media.url,
        access_token: pageAccessToken,
        published: 'false', // Upload without publishing
      };

      if (media.caption) {
        body.caption = media.caption;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error('Facebook: Failed to upload media:', error);
        throw new Error(error.error?.message || 'Failed to upload media');
      }

      const data = await response.json();

      return {
        mediaId: data.id,
        url: media.url,
        metadata: { pageId: page.id },
      };
    } catch (error) {
      logger.error('Facebook: Error uploading media:', error);
      throw error;
    }
  }

  async getPostMetrics(accessToken: string, postId: string): Promise<PostMetrics> {
    if (!this.isConfigured()) {
      logger.warn('Facebook: API keys not configured, using placeholder response');
      return this.getPlaceholderMetrics();
    }

    try {
      const params = new URLSearchParams({
        access_token: accessToken,
        fields: 'likes.summary(true),comments.summary(true),shares',
      });

      const response = await fetch(`${GRAPH_API_BASE}/${postId}?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        logger.error('Facebook: Failed to get post metrics:', error);
        throw new Error(error.error?.message || 'Failed to get post metrics');
      }

      const data = await response.json();

      const likes = data.likes?.summary?.total_count || 0;
      const comments = data.comments?.summary?.total_count || 0;
      const shares = data.shares?.count || 0;

      return {
        likes,
        comments,
        shares,
        views: 0, // Requires page insights access
        reach: 0,
        impressions: 0,
        engagementRate: 0,
        lastUpdated: new Date(),
      };
    } catch (error) {
      logger.error('Facebook: Error getting post metrics:', error);
      throw error;
    }
  }

  async deletePost(accessToken: string, postId: string): Promise<boolean> {
    if (!this.isConfigured()) {
      logger.warn('Facebook: API keys not configured, simulating delete');
      return true;
    }

    try {
      const params = new URLSearchParams({
        access_token: accessToken,
      });

      const response = await fetch(`${GRAPH_API_BASE}/${postId}?${params.toString()}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error('Facebook: Failed to delete post:', error);
        throw new Error(error.error?.message || 'Failed to delete post');
      }

      return true;
    } catch (error) {
      logger.error('Facebook: Error deleting post:', error);
      throw error;
    }
  }

  async validateToken(accessToken: string): Promise<boolean> {
    if (!this.isConfigured()) {
      logger.warn('Facebook: API keys not configured, assuming valid');
      return true;
    }

    try {
      const params = new URLSearchParams({
        access_token: accessToken,
      });

      const response = await fetch(`${GRAPH_API_BASE}/me?${params.toString()}`);
      return response.ok;
    } catch (error) {
      logger.error('Facebook: Error validating token:', error);
      return false;
    }
  }

  // Placeholder methods for when API keys are not configured
  private getPlaceholderTokenResponse(): TokenResponse {
    return {
      accessToken: `fb_placeholder_${Date.now()}`,
      refreshToken: undefined,
      expiresIn: 5184000,
      tokenType: 'Bearer',
    };
  }

  private getPlaceholderProfile(): SocialProfile {
    return {
      id: 'fb_placeholder_user',
      name: 'Facebook User (Configure API Keys)',
      username: 'facebook_user',
      profilePicture: undefined,
      metadata: { placeholder: true },
    };
  }

  private getPlaceholderPostResponse(post: PostData): PostResponse {
    logger.info('Facebook: Creating placeholder post', { content: post.content.substring(0, 50) });
    return {
      postId: `fb_placeholder_post_${Date.now()}`,
      platform: 'facebook',
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
      reach: 0,
      impressions: 0,
      engagementRate: 0,
      lastUpdated: new Date(),
    };
  }
}
