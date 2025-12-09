/**
 * Social Media Platform Interface
 * 
 * This interface defines the contract for all social media platform integrations.
 * Each platform (Facebook, Twitter, Instagram, LinkedIn) must implement this interface.
 */

export interface SocialMediaPlatform {
  /**
   * Get the platform name
   */
  getName(): string;

  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl(redirectUri: string, state?: string): string;

  /**
   * Exchange authorization code for access token
   */
  exchangeCodeForToken(code: string, redirectUri: string): Promise<TokenResponse>;

  /**
   * Refresh access token using refresh token
   */
  refreshToken(refreshToken: string): Promise<TokenResponse>;

  /**
   * Get user profile information
   */
  getUserProfile(accessToken: string): Promise<SocialProfile>;

  /**
   * Post content to the platform
   */
  createPost(accessToken: string, post: PostData): Promise<PostResponse>;

  /**
   * Upload media to the platform
   */
  uploadMedia(accessToken: string, media: MediaData): Promise<MediaResponse>;

  /**
   * Get post analytics/metrics
   */
  getPostMetrics(accessToken: string, postId: string): Promise<PostMetrics>;

  /**
   * Delete a post
   */
  deletePost(accessToken: string, postId: string): Promise<boolean>;

  /**
   * Validate access token
   */
  validateToken(accessToken: string): Promise<boolean>;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number; // seconds
  tokenType?: string;
  scope?: string;
}

export interface SocialProfile {
  id: string;
  username?: string;
  name: string;
  email?: string;
  profilePicture?: string;
  followers?: number;
  following?: number;
  metadata?: Record<string, unknown>;
}

export interface PostData {
  content: string;
  mediaUrls?: string[];
  scheduledAt?: Date;
  link?: string;
  hashtags?: string[];
  mentions?: string[];
  location?: {
    name?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface PostResponse {
  postId: string;
  platform: string;
  url?: string;
  publishedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface MediaData {
  url: string;
  type: 'image' | 'video';
  caption?: string;
  altText?: string;
}

export interface MediaResponse {
  mediaId: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

export interface PostMetrics {
  likes: number;
  comments: number;
  shares: number;
  views?: number;
  clicks?: number;
  reach?: number;
  impressions?: number;
  engagementRate?: number;
  lastUpdated: Date;
}

export interface WebhookEvent {
  type: string;
  platform: string;
  data: Record<string, unknown>;
  timestamp: Date;
}
