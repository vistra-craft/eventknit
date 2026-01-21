declare module 'apple-signin-auth' {
  export interface AppleIdTokenVerifyOptions {
    audience?: string | string[];
    ignoreExpiration?: boolean;
    nonce?: string;
  }

  export interface AppleIdTokenPayload {
    iss: string;
    aud: string;
    exp: number;
    iat: number;
    sub: string;
    nonce?: string;
    c_hash: string;
    email?: string;
    email_verified?: string | boolean;
    is_private_email?: string | boolean;
    auth_time: number;
    nonce_supported: boolean;
  }

  export function verifyIdToken(
    idToken: string,
    options: AppleIdTokenVerifyOptions
  ): Promise<AppleIdTokenPayload>;

  const appleSignin: {
    verifyIdToken: typeof verifyIdToken;
  };

  export default appleSignin;
}
