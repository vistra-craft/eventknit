// Type declarations for modules without @types packages or when types are not recognized

declare module 'swagger-ui-express' {
  import { RequestHandler } from 'express';

  export function serve(...args: unknown[]): RequestHandler;
  export function setup(swaggerDoc: Record<string, unknown>, options?: Record<string, unknown>): RequestHandler;
}

declare module 'yamljs' {
  export function load(file: string): Record<string, unknown>;
  export function parse(yaml: string): Record<string, unknown>;
}

declare module 'morgan' {
  import { RequestHandler } from 'express';

  function morgan(format: string, options?: Record<string, unknown>): RequestHandler;
  export = morgan;
}
