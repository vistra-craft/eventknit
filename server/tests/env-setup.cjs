// Set NODE_ENV to 'development' so src/config/index.ts loads .env.development
// This must run before any test module is imported (hence setupFiles, not setupFilesAfterEnv)
process.env.NODE_ENV = 'development';
