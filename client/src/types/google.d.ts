// Google Sign In SDK TypeScript declarations
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token: string;
              error?: string;
            }) => void;
            error_callback?: (error: { type: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

export {};
