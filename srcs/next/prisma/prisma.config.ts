import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
    schema: 'prisma/website/schema.prisma',
    migrations: {
        path: 'prisma/website/migrations',
    },
    datasource: {
        url: env('DATABASE_URL'),
    },
});