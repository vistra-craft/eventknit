// Apple Sign In SDK TypeScript declarations
declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string;
          scope: string;
          redirectURI: string;
          state?: string;
          usePopup?: boolean;
        }) => void;
        signIn: () => Promise<{
          authorization: {
            code: string;
            id_token: string;
            state?: string;
          };
          user?: {
            name?: {
              firstName?: string;
              lastName?: string;
            };
            email?: string;
          };
        }>;
      };
    };
  }
}

export {};
