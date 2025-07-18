/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Shared types for Moments API
 */
export interface Reply {
  id: string;
  text: string;
  anonymousId: string;
  displayName: string;
  timestamp: number;
  momentId: string;
}

export interface Moment {
  id: string;
  text: string;
  image?: string;
  anonymousId: string;
  displayName: string;
  timestamp: number;
  replies: Reply[];
  replyCount: number;
}

export interface CreateMomentRequest {
  text: string;
  image?: string;
  anonymousId: string;
  displayName: string;
}

export interface CreateReplyRequest {
  text: string;
  anonymousId: string;
  displayName: string;
  momentId: string;
}

export interface DeleteMomentRequest {
  anonymousId: string;
}

export interface DeleteReplyRequest {
  anonymousId: string;
}
