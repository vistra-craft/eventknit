// Type declarations for modules without @types packages or when types are not recognized

declare module 'swagger-ui-express' {
  import { RequestHandler } from 'express';

  export function serve(...args: any[]): RequestHandler;
  export function setup(swaggerDoc: any, options?: any): RequestHandler;
}

declare module 'yamljs' {
  export function load(file: string): any;
  export function parse(yaml: string): any;
}

declare module 'morgan' {
  import { RequestHandler } from 'express';

  function morgan(format: string, options?: any): RequestHandler;
  export = morgan;
}
