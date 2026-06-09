// Environment variable validation and access
export const env = {
  DB_HOST: process.env.DB_HOST!,
  DB_USER: process.env.DB_USER!,
  DB_PASSWORD: process.env.DB_PASSWORD!,
  DB_NAME: process.env.DB_NAME!,
  DB_PORT: parseInt(process.env.DB_PORT || "5432"),

  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID!,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID!,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY!,
  R2_PUBLIC_BUCKET_NAME: process.env.R2_PUBLIC_BUCKET_NAME!,
  R2_PRIVATE_BUCKET_NAME: process.env.R2_PRIVATE_BUCKET_NAME!,

  ADMIN_EMAIL: process.env.ADMIN_EMAIL!,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:3000",

  MIDTRANS_SERVER_KEY: process.env.MIDTRANS_SERVER_KEY!,
  MIDTRANS_CLIENT_KEY: process.env.MIDTRANS_CLIENT_KEY!,
  NEXT_PUBLIC_MIDTRANS_CLIENT_KEY:
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!,

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
};
