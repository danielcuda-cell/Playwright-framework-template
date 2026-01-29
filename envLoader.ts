import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

export function loadEnv() {
  const env = process.env.ENV || 'dev';
  const envFile = `.env.${env}`;
  const envPath = path.resolve(process.cwd(), envFile);

  if (!fs.existsSync(envPath)) {
    throw new Error(`❌ Environment file not found: ${envFile}`);
  }

  dotenv.config({ path: envPath });

  // Important variables validation
  const requiredVars = ['BASE_URL', 'API_BASE_URL'];
  requiredVars.forEach(v => {
    if (!process.env[v]) {
      throw new Error(`❌ Missing required environment variable: ${v}`);
    }
  });

  console.log(`🔧 Loaded environment: ${env}`);
  console.log(`🌍 BASE_URL=${process.env.BASE_URL}`);
  console.log(`🌍 API_BASE_URL=${process.env.API_BASE_URL}`);
}