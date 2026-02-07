declare module 'paystack' {
  export default class Paystack {
    constructor(secretKey: string);
    transaction: {
      initialize: (params: Record<string, unknown>) => Promise<Record<string, unknown>>;
      verify: (reference: string) => Promise<Record<string, unknown>>;
      list: (params: Record<string, unknown>) => Promise<Record<string, unknown>>;
    };
    refund: {
      create: (params: Record<string, unknown>) => Promise<Record<string, unknown>>;
    };
  }
}

