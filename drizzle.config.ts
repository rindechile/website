import type { Config } from 'drizzle-kit';

const config: Config = {
    schema: './schemas/drizzle.ts',
    out: '.drizzle-out',
    dialect: 'sqlite',
    driver: 'd1-http',
    dbCredentials: {
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
        databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
        token: process.env.CLOUDFLARE_D1_TOKEN!,
    },
    verbose: true,
};

export default config satisfies Config;