import { config } from 'dotenv';
import fs from 'fs';
config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

//export const CREDENTIALS = process.env.CREDENTIALS === 'true';

//Coerce the environment variables to the correct type
function coerceEnvVar<T>(value: string | undefined, defaultValue: T): T {
  if (typeof defaultValue === 'boolean') {
    return (value === 'true') as unknown as T;
  }
  if (typeof defaultValue === 'number') {
    return (value ? parseInt(value, 10) : defaultValue) as unknown as T;
  }
  return (value || defaultValue) as unknown as T;
}

export const NODE_ENV = coerceEnvVar(process.env.NODE_ENV, 'development');
export const SITE_URL = coerceEnvVar(process.env.SITE_URL, 'http://localhost:3000');
export const PORT = coerceEnvVar(process.env.PORT, 3000);
export const DATABSE_HOST = coerceEnvVar(process.env.DATABSE_HOST, 'localhost');
export const DATABASE_PORT = coerceEnvVar(process.env.DATABASE_PORT, 3306);
export const DATABASE_NAME = coerceEnvVar(process.env.DATABASE_NAME, 'database');
export const DATABASE_USER = coerceEnvVar(process.env.DATABASE_USER, 'root');
export const DATABASE_PASSWORD = coerceEnvVar(process.env.DATABASE_PASSWORD, 'password');
export const DATABASE_URL = coerceEnvVar(process.env.DATABASE_URL, 'dev');
export const REDIS_URL = coerceEnvVar(process.env.REDIS_URL, 'redis://localhost:6379');
export const REDIS_USERNAME = coerceEnvVar(process.env.REDIS_USERNAME, 'root');
export const REDIS_PASSWORD = coerceEnvVar(process.env.REDIS_PASSWORD, 'password');
export const REDIS_DB = coerceEnvVar(process.env.REDIS_DB, 0);
export const LOG_FORMAT = coerceEnvVar(process.env.LOG_FORMAT, 'dev');
export const LOG_DIR = coerceEnvVar(process.env.LOG_DIR, 'logs');
export const ORIGIN = coerceEnvVar(process.env.ORIGIN, 'http://localhost:3000');
export const CREDENTIALS = coerceEnvVar(process.env.CREDENTIALS, true);
export const SENDGRID_API_KEY = coerceEnvVar(process.env.SENDGRID_API_KEY, 'SG.1234567890');
export const FROM_EMAIL = coerceEnvVar(process.env.FROM_EMAIL, 'aurictouch.test@gmail.com');
export const OTP_TTL = coerceEnvVar(process.env.OTP_TTL, 5);
export const REFRESH_TOKEN_TTL = coerceEnvVar(process.env.REFRESH_TOKEN_TTL, 90);
export const JWT_TTL = coerceEnvVar(process.env.JWT_TTL, 1 * 60 * 60);
export const JWT_SECRET = coerceEnvVar(process.env.JWT_SECRET, 'secret');

const BANK_ID_RP_CERT_PATH = coerceEnvVar(process.env.BANK_ID_RP_CERT_PATH, './.certificates/rp-cert.pem');
const BANK_ID_CA_CERT_PATH = coerceEnvVar(process.env.BANK_ID_CA_CERT_PATH, './.certificates/ca-cert.crt');
const BANK_ID_RP_CERT_KEY_PATH = coerceEnvVar(process.env.BANK_ID_RP_CERT_KEY_PATH, './.certificates/rp-key.pem');
export const BANK_ID_RP_CERT_PASSKEY = coerceEnvVar(process.env.BANK_ID_RP_CERT_PASSKEY, 'qwerty123');
export const BANK_ID_RP_CERT = fs.readFileSync(BANK_ID_RP_CERT_PATH);
export const BANK_ID_CA_CERT = fs.readFileSync(BANK_ID_CA_CERT_PATH, 'utf8');
export const BANK_ID_RP_CERT_KEY = fs.readFileSync(BANK_ID_RP_CERT_KEY_PATH);
export const BANK_ID_API_URL = coerceEnvVar(process.env.BANK_ID_API_URL, 'https://appapi2.test.bankid.com/rp/v6');

export const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
export const TWILIO_SID = process.env.TWILIO_SID;
export const TWILIO_SERVICE_NAME = process.env.TWILIO_VERIFICATION_SERVICE_NAME;
export const TWILIO_SERVICE_ID = process.env.TWILIO_SERVICE_ID;
