import dotenv from 'dotenv';
import path from 'path';

const env = process.env.NODE_ENV || 'development';
const envPath = path.resolve(process.cwd(), `.env.${env}`);

dotenv.config({ path: envPath });

export const config = {
  env,
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/eventknit',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
};

