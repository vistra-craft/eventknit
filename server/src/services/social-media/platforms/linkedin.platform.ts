/**
 * LinkedIn Platform Adapter
 *
 * Implements LinkedIn API integration for event promotion
 * API Reference: https://learn.microsoft.com/en-us/linkedin/
 *
 * To enable: Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in environment
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

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';

export class LinkedInPlatform implements SocialMediaPlatform {
  getName(): string {
    return 'linkedin';
  }

  private getClientId(): string {
    return config.socialMedia?.linkedin?.clientId || '';
  }

  private getClientSecret(): string {
    return config.socialMedia?.linkedin?.clientSecret || '';
  }

  private isConfigured(): boolean {
    return Boolean(this.getClientId() && this.getClientSecret());
  }

  getAuthorizationUrl(redirectUri: string, state?: string): string {
    const clientId = this.getClientId();
    const scopes = [
      'openid',
      'profile',
      'email',
      'w_member_social',
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      ...(state && { state }),
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<TokenResponse> {
    if (!this.isConfigured()) {
      logger.warn('LinkedIn: API keys not configured, using placeholder response');
      return this.getPlaceholderTokenResponse();
    }

    try {
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: this.getClientId(),
        client_secret: this.getClientSecret(),
      });

      const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error('LinkedIn token exchange failed:', error);
        throw new Error(error.error_description || 'Token exchange failed');
      }

      const data = await response.json();

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in || 5184000, // 60 days default
        tokenType: 'Bearer',
        scope: data.scope,
      };
    } catch (error) {
      logger.error('LinkedIn: Error exchanging code for token:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    if (!this.isConfigured()) {
      logger.warn('LinkedIn: API keys not configured, using placeholder response');
      return this.getPlaceholderTokenResponse();
    }

    try {
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.getClientId(),
        client_secret: this.getClientSecret(),
      });

      const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error('LinkedIn token refresh failed:', error);
        throw new Error(error.error_description || 'Token refresh failed');
      }

      const data = await response.json();

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresIn: data.expires_in || 5184000,
        tokenType: 'Bearer',
      };
    } catch (error) {
      logger.error('LinkedIn: Error refreshing token:', error);
      throw error;
    }
  }

  async getUserProfile(accessToken: string): Promise<SocialProfile> {
    if (!this.isConfigured()) {
      logger.warn('LinkedIn: API keys not configured, using placeholder response');
      return this.getPlaceholderProfile();
    }

    try {
      // Get user info using OpenID Connect endpoint
      const response = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error('LinkedIn: Failed to get user profile:', error);
        throw new Error(error.message || 'Failed to get user profile');
      }

      const data = await response.json();

      return {
        id: data.sub,
        name: data.name,
        email: data.email,
        profilePicture: data.picture,
        metadata: { raw: data },
      };
    } catch (error) {
      logger.error('LinkedIn: Error getting user profile:', error);
      throw error;
    }
  }

  private async getPersonURN(accessToken: string): Promise<string> {
    const response = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get LinkedIn user info');
    }

    const data = await response.json();
    return `urn:li:person:${data.sub}`;
  }

  async createPost(accessToken: string, post: PostData): Promise<PostResponse> {
    if (!this.isConfigured()) {
      logger.warn('LinkedIn: API keys not configured, using placeholder response');
      return this.getPlaceholderPostResponse(post);
    }

    try {
      const personURN = await this.getPersonURN(accessToken);

      const shareContent: {
        shareCommentary: { text: string };
        shareMediaCategory: string;
        media?: Array<{
          status: string;
          originalUrl: string;
          title?: { text: string };
        }>;
      } = {
        shareCommentary: {
          text: post.content,
        },
        shareMediaCategory: post.link ? 'ARTICLE' : 'NONE',
      };

      if (post.link) {
        shareContent.media = [
          {
            status: 'READY',
            originalUrl: post.link,
          },
        ];
      }

      const body = {
        author: personURN,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': shareContent,
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      const response = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error('LinkedIn: Failed to create post:', error);
        throw new Error(error.message || 'Failed to create post');
      }

      // LinkedIn returns the post ID in the X-RestLi-Id header
      const postId = response.headers.get('X-RestLi-Id') || `li_${Date.now()}`;

      return {
        postId,
        platform: 'linkedin',
        url: `https://www.linkedin.com/feed/update/${postId}`,
        publishedAt: new Date(),
        metadata: { author: personURN },
      };
    } catch (error) {
      logger.error('LinkedIn: Error creating post:', error);
      throw error;
    }
  }

  async uploadMedia(accessToken: string, media: MediaData): Promise<MediaResponse> {
    if (!this.isConfigured()) {
      logger.warn('LinkedIn: API keys not configured, using placeholder response');
      return { mediaId: `li_media_placeholder_${Date.now()}`, url: media.url };
    }

    try {
      const personURN = await this.getPersonURN(accessToken);

      // Step 1: Register the upload
      const registerBody = {
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: personURN,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent',
            },
          ],
        },
      };

      const registerResponse = await fetch(
        `${LINKEDIN_API_BASE}/assets?action=registerUpload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(registerBody),
        },
      );

      if (!registerResponse.ok) {
        const error = await registerResponse.json();
        logger.error('LinkedIn: Failed to register upload:', error);
        throw new Error(error.message || 'Failed to register upload');
      }

      const registerData = await registerResponse.json();
      const asset = registerData.value?.asset;

      // Note: Actual binary upload would require downloading the image and uploading to uploadUrl
      // For simplicity, returning the asset ID
      logger.info('LinkedIn: Media registered, binary upload requires additional implementation');

      return {
        mediaId: asset || `li_media_${Date.now()}`,
        url: media.url,
        metadata: { registerData },
      };
    } catch (error) {
      logger.error('LinkedIn: Error uploading media:', error);
      throw error;
    }
  }

  async getPostMetrics(accessToken: string, postId: string): Promise<PostMetrics> {
    if (!this.isConfigured()) {
      logger.warn('LinkedIn: API keys not configured, using placeholder response');
      return this.getPlaceholderMetrics();
    }

    try {
      // Get social actions (likes, comments)
      const response = await fetch(
        `${LINKEDIN_API_BASE}/socialActions/${encodeURIComponent(postId)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        logger.error('LinkedIn: Failed to get post metrics:', error);
        throw new Error(error.message || 'Failed to get post metrics');
      }

      const data = await response.json();

      return {
        likes: data.likesSummary?.totalLikes || 0,
        comments: data.commentsSummary?.totalFirstLevelComments || 0,
        shares: 0, // LinkedIn doesn't expose shares in basic API
        views: 0,
        impressions: 0,
        engagementRate: 0,
        lastUpdated: new Date(),
      };
    } catch (error) {
      logger.error('LinkedIn: Error getting post metrics:', error);
      throw error;
    }
  }

  async deletePost(accessToken: string, postId: string): Promise<boolean> {
    if (!this.isConfigured()) {
      logger.warn('LinkedIn: API keys not configured, simulating delete');
      return true;
    }

    try {
      const response = await fetch(
        `${LINKEDIN_API_BASE}/ugcPosts/${encodeURIComponent(postId)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        logger.error('LinkedIn: Failed to delete post:', error);
        throw new Error(error.message || 'Failed to delete post');
      }

      return true;
    } catch (error) {
      logger.error('LinkedIn: Error deleting post:', error);
      throw error;
    }
  }

  async validateToken(accessToken: string): Promise<boolean> {
    if (!this.isConfigured()) {
      logger.warn('LinkedIn: API keys not configured, assuming valid');
      return true;
    }

    try {
      const response = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.ok;
    } catch (error) {
      logger.error('LinkedIn: Error validating token:', error);
      return false;
    }
  }

  // Placeholder methods for when API keys are not configured
  private getPlaceholderTokenResponse(): TokenResponse {
    return {
      accessToken: `li_placeholder_${Date.now()}`,
      refreshToken: `li_refresh_placeholder_${Date.now()}`,
      expiresIn: 5184000,
      tokenType: 'Bearer',
    };
  }

  private getPlaceholderProfile(): SocialProfile {
    return {
      id: 'li_placeholder_user',
      name: 'LinkedIn User (Configure API Keys)',
      email: 'user@example.com',
      profilePicture: undefined,
      metadata: { placeholder: true },
    };
  }

  private getPlaceholderPostResponse(post: PostData): PostResponse {
    logger.info('LinkedIn: Creating placeholder post', { content: post.content.substring(0, 50) });
    return {
      postId: `li_placeholder_post_${Date.now()}`,
      platform: 'linkedin',
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
