/**
 * Environment configuration
 * Loads and validates environment variables
 */

import dotenv from 'dotenv';

// Load .env file
dotenv.config();

interface EnvConfig {
  // Application
  nodeEnv: string;
  port: number;

  // Database
  databaseUrl: string;

  // JWT
  jwtSecret: string;
  jwtExpiresIn: string;

  // API Keys
  apiKeySaltRounds: number;

  // ARCA/AFIP
  arcaEnvironment: string;
  arcaCuit: string;
  arcaCertPath: string;
  arcaKeyPath: string;

  // External Services
  openaiApiKey: string;

  // Webhook
  webhookSecret: string;

  // Redis
  redisUrl: string;

  // S3
  s3BucketName: string;
  s3Region: string;
  s3AccessKeyId: string;
  s3SecretAccessKey: string;

  // Monitoring
  logLevel: string;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;

  if (value === undefined) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }

  return value;
}

function getEnvVarAsNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];

  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required but not set`);
  }

  const num = parseInt(value, 10);

  if (isNaN(num)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }

  return num;
}

export const env: EnvConfig = {
  // Application
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  port: getEnvVarAsNumber('PORT', 3000),

  // Database
  databaseUrl: getEnvVar('DATABASE_URL'),

  // JWT
  jwtSecret: getEnvVar('JWT_SECRET'),
  jwtExpiresIn: getEnvVar('JWT_EXPIRES_IN', '7d'),

  // API Keys
  apiKeySaltRounds: getEnvVarAsNumber('API_KEY_SALT_ROUNDS', 12),

  // ARCA/AFIP
  arcaEnvironment: getEnvVar('ARCA_ENVIRONMENT', 'testing'),
  arcaCuit: getEnvVar('ARCA_CUIT', ''),
  arcaCertPath: getEnvVar('ARCA_CERT_PATH', ''),
  arcaKeyPath: getEnvVar('ARCA_KEY_PATH', ''),

  // External Services
  openaiApiKey: getEnvVar('OPENAI_API_KEY', ''),

  // Webhook
  webhookSecret: getEnvVar('WEBHOOK_SECRET', ''),

  // Redis
  redisUrl: getEnvVar('REDIS_URL', 'redis://localhost:6379'),

  // S3
  s3BucketName: getEnvVar('S3_BUCKET_NAME', ''),
  s3Region: getEnvVar('S3_REGION', ''),
  s3AccessKeyId: getEnvVar('S3_ACCESS_KEY_ID', ''),
  s3SecretAccessKey: getEnvVar('S3_SECRET_ACCESS_KEY', ''),

  // Monitoring
  logLevel: getEnvVar('LOG_LEVEL', 'info'),
};

export function isProduction(): boolean {
  return env.nodeEnv === 'production';
}

export function isDevelopment(): boolean {
  return env.nodeEnv === 'development';
}

export function isTest(): boolean {
  return env.nodeEnv === 'test';
}
