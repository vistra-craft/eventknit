declare module 'multer' {
  import { Request, RequestHandler } from 'express';

  interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination?: string;
    filename?: string;
    path?: string;
    buffer: Buffer;
  }

  interface StorageEngine {
    _handleFile(
      req: Request,
      file: MulterFile,
      callback: (error?: Error, info?: Partial<MulterFile>) => void
    ): void;
    _removeFile(
      req: Request,
      file: MulterFile,
      callback: (error: Error | null) => void
    ): void;
  }

  interface DiskStorageOptions {
    destination?: string | ((req: Request, file: MulterFile, callback: (error: Error | null, destination: string) => void) => void);
    filename?: (req: Request, file: MulterFile, callback: (error: Error | null, filename: string) => void) => void;
  }

  interface Options {
    dest?: string;
    storage?: StorageEngine;
    limits?: {
      fieldNameSize?: number;
      fieldSize?: number;
      fields?: number;
      fileSize?: number;
      files?: number;
      parts?: number;
      headerPairs?: number;
    };
    fileFilter?: (
      req: Request,
      file: MulterFile,
      callback: (error: Error | null, acceptFile?: boolean) => void
    ) => void;
    preservePath?: boolean;
  }

  interface Multer {
    single(fieldname: string): RequestHandler;
    array(fieldname: string, maxCount?: number): RequestHandler;
    fields(fields: Array<{ name: string; maxCount?: number }>): RequestHandler;
    none(): RequestHandler;
    any(): RequestHandler;
  }

  function multer(options?: Options): Multer;

  namespace multer {
    function diskStorage(options: DiskStorageOptions): StorageEngine;
    function memoryStorage(): StorageEngine;
  }

  export = multer;
}
