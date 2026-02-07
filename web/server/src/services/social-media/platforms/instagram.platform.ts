/**
 * Instagram Platform Adapter
 *
 * Implements Instagram Graph API integration for event promotion
 * Note: Instagram posting requires a Facebook Page connected to an Instagram Business Account
 * API Reference: https://developers.facebook.com/docs/instagram-api
 *
 * To enable: Set INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET in environment
 * (Uses Facebook OAuth - Instagram requires Facebook Business integration)
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

export class InstagramPlatform implements SocialMediaPlatform {
  getName(): string {
    return 'instagram';
  }

  private getClientId(): string {
    // Instagram uses Facebook OAuth
    return config.socialMedia?.instagram?.clientId || config.socialMedia?.facebook?.clientId || '';
  }

  private getClientSecret(): string {
    return config.socialMedia?.instagram?.clientSecret || config.socialMedia?.facebook?.clientSecret || '';
  }

  private isConfigured(): boolean {
    return Boolean(this.getClientId() && this.getClientSecret());
  }

  getAuthorizationUrl(redirectUri: string, state?: string): string {
    const clientId = this.getClientId();
    // Instagram requires Facebook OAuth with specific Instagram permissions
    const scopes = [
      'instagram_basic',
      'instagram_content_publish',
      'instagram_manage_insights',
      'pages_show_list',
      'pages_read_engagement',
    ].join(',');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      response_type: 'code',
      ...(state && { state }),
    });

    // Use Facebook OAuth for Instagram
    return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<TokenResponse> {
    if (!this.isConfigured()) {
      logger.warn('Instagram: API keys not configured, using placeholder response');
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
        logger.error('Instagram token exchange failed:', error);
        throw new Error(error.error?.message || 'Token exchange failed');
      }

      const data = await response.json();

      // Exchange for long-lived token
      const longLivedParams = new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: this.getClientId(),
        client_secret: this.getClientSecret(),
        fb_exchange_token: data.access_token,
      });

      const longLivedResponse = await fetch(
        `${GRAPH_API_BASE}/oauth/access_token?${longLivedParams.toString()}`,
      );

      if (!longLivedResponse.ok) {
        // If long-lived token exchange fails, use the short-lived token
        return {
          accessToken: data.access_token,
          expiresIn: 3600,
          tokenType: 'Bearer',
        };
      }

      const longLivedData = await longLivedResponse.json();

      return {
        accessToken: longLivedData.access_token,
        expiresIn: longLivedData.expires_in || 5184000,
        tokenType: 'Bearer',
      };
    } catch (error) {
      logger.error('Instagram: Error exchanging code for token:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    // Instagram (via Facebook) uses long-lived tokens that don't refresh
    logger.info('Instagram: Token refresh requested (long-lived tokens do not refresh)');
    return {
      accessToken: refreshToken,
      expiresIn: 5184000,
      tokenType: 'Bearer',
    };
  }

  async getUserProfile(accessToken: string): Promise<SocialProfile> {
    if (!this.isConfigured()) {
      logger.warn('Instagram: API keys not configured, using placeholder response');
      return this.getPlaceholderProfile();
    }

    try {
      // First get the Instagram Business Account ID
      const igAccount = await this.getInstagramBusinessAccount(accessToken);

      if (!igAccount) {
        throw new Error('No Instagram Business Account found');
      }

      const params = new URLSearchParams({
        access_token: accessToken,
        fields: 'id,username,profile_picture_url,followers_count,follows_count',
      });

      const response = await fetch(`${GRAPH_API_BASE}/${igAccount.id}?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        logger.error('Instagram: Failed to get user profile:', error);
        throw new Error(error.error?.message || 'Failed to get user profile');
      }

      const data = await response.json();

      return {
        id: data.id,
        name: data.username,
        username: data.username,
        profilePicture: data.profile_picture_url,
        followers: data.followers_count,
        following: data.follows_count,
        metadata: { raw: data },
      };
    } catch (error) {
      logger.error('Instagram: Error getting user profile:', error);
      throw error;
    }
  }

  private async getInstagramBusinessAccount(accessToken: string): Promise<{
    id: string;
    pageId: string;
  } | null> {
    try {
      // Get Facebook pages
      const pagesResponse = await fetch(
        `${GRAPH_API_BASE}/me/accounts?access_token=${accessToken}`,
      );

      if (!pagesResponse.ok) {
        return null;
      }

      const pagesData = await pagesResponse.json();
      const pages = pagesData.data || [];

      // Find a page with connected Instagram account
      for (const page of pages) {
        const igResponse = await fetch(
          `${GRAPH_API_BASE}/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`,
        );

        if (igResponse.ok) {
          const igData = await igResponse.json();
          if (igData.instagram_business_account) {
            return {
              id: igData.instagram_business_account.id,
              pageId: page.id,
            };
          }
        }
      }

      return null;
    } catch (error) {
      logger.error('Instagram: Error getting business account:', error);
      return null;
    }
  }

  async createPost(accessToken: string, post: PostData): Promise<PostResponse> {
    if (!this.isConfigured()) {
      logger.warn('Instagram: API keys not configured, using placeholder response');
      return this.getPlaceholderPostResponse(post);
    }

    try {
      const igAccount = await this.getInstagramBusinessAccount(accessToken);

      if (!igAccount) {
        throw new Error('No Instagram Business Account found');
      }

      // Instagram requires an image for posts
      if (!post.mediaUrls?.length) {
        throw new Error('Instagram posts require at least one image');
      }

      // Step 1: Create media container
      const mediaParams = new URLSearchParams({
        image_url: post.mediaUrls[0],
        caption: post.content,
        access_token: accessToken,
      });

      const containerResponse = await fetch(
        `${GRAPH_API_BASE}/${igAccount.id}/media?${mediaParams.toString()}`,
        { method: 'POST' },
      );

      if (!containerResponse.ok) {
        const error = await containerResponse.json();
        logger.error('Instagram: Failed to create media container:', error);
        throw new Error(error.error?.message || 'Failed to create media container');
      }

      const containerData = await containerResponse.json();

      // Step 2: Publish the container
      const publishParams = new URLSearchParams({
        creation_id: containerData.id,
        access_token: accessToken,
      });

      const publishResponse = await fetch(
        `${GRAPH_API_BASE}/${igAccount.id}/media_publish?${publishParams.toString()}`,
        { method: 'POST' },
      );

      if (!publishResponse.ok) {
        const error = await publishResponse.json();
        logger.error('Instagram: Failed to publish post:', error);
        throw new Error(error.error?.message || 'Failed to publish post');
      }

      const publishData = await publishResponse.json();

      return {
        postId: publishData.id,
        platform: 'instagram',
        url: `https://instagram.com/p/${publishData.id}`,
        publishedAt: new Date(),
        metadata: { igAccountId: igAccount.id },
      };
    } catch (error) {
      logger.error('Instagram: Error creating post:', error);
      throw error;
    }
  }

  async uploadMedia(accessToken: string, media: MediaData): Promise<MediaResponse> {
    // Instagram doesn't have a separate media upload - it's done in createPost
    logger.info('Instagram: Media upload is handled in createPost');
    return {
      mediaId: `ig_media_${Date.now()}`,
      url: media.url,
      metadata: { note: 'Instagram media is uploaded with post creation' },
    };
  }

  async getPostMetrics(accessToken: string, postId: string): Promise<PostMetrics> {
    if (!this.isConfigured()) {
      logger.warn('Instagram: API keys not configured, using placeholder response');
      return this.getPlaceholderMetrics();
    }

    try {
      const params = new URLSearchParams({
        access_token: accessToken,
        fields: 'like_count,comments_count',
      });

      const response = await fetch(`${GRAPH_API_BASE}/${postId}?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        logger.error('Instagram: Failed to get post metrics:', error);
        throw new Error(error.error?.message || 'Failed to get post metrics');
      }

      const data = await response.json();

      // Get insights for reach and impressions
      let reach = 0;
      let impressions = 0;

      try {
        const insightsParams = new URLSearchParams({
          access_token: accessToken,
          metric: 'reach,impressions',
        });

        const insightsResponse = await fetch(
          `${GRAPH_API_BASE}/${postId}/insights?${insightsParams.toString()}`,
        );

        if (insightsResponse.ok) {
          const insightsData = await insightsResponse.json();
          for (const metric of insightsData.data || []) {
            if (metric.name === 'reach') reach = metric.values[0]?.value || 0;
            if (metric.name === 'impressions') impressions = metric.values[0]?.value || 0;
          }
        }
      } catch {
        // Insights might not be available for all posts
      }

      return {
        likes: data.like_count || 0,
        comments: data.comments_count || 0,
        shares: 0, // Instagram doesn't expose shares
        reach,
        impressions,
        engagementRate: 0,
        lastUpdated: new Date(),
      };
    } catch (error) {
      logger.error('Instagram: Error getting post metrics:', error);
      throw error;
    }
  }

  async deletePost(_accessToken: string, _postId: string): Promise<boolean> {
    // Instagram doesn't support deleting posts via API
    logger.warn('Instagram: Post deletion is not supported via API');
    return false;
  }

  async validateToken(accessToken: string): Promise<boolean> {
    if (!this.isConfigured()) {
      logger.warn('Instagram: API keys not configured, assuming valid');
      return true;
    }

    try {
      const response = await fetch(
        `${GRAPH_API_BASE}/me?access_token=${accessToken}`,
      );
      return response.ok;
    } catch (error) {
      logger.error('Instagram: Error validating token:', error);
      return false;
    }
  }

  // Placeholder methods for when API keys are not configured
  private getPlaceholderTokenResponse(): TokenResponse {
    return {
      accessToken: `ig_placeholder_${Date.now()}`,
      expiresIn: 5184000,
      tokenType: 'Bearer',
    };
  }

  private getPlaceholderProfile(): SocialProfile {
    return {
      id: 'ig_placeholder_user',
      name: 'Instagram User (Configure API Keys)',
      username: 'instagram_user',
      profilePicture: undefined,
      metadata: { placeholder: true },
    };
  }

  private getPlaceholderPostResponse(post: PostData): PostResponse {
    logger.info('Instagram: Creating placeholder post', { content: post.content.substring(0, 50) });
    return {
      postId: `ig_placeholder_post_${Date.now()}`,
      platform: 'instagram',
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
      reach: 0,
      impressions: 0,
      engagementRate: 0,
      lastUpdated: new Date(),
    };
  }
}
