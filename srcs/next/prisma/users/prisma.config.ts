import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
    schema: 'prisma/users/schema.prisma',
    migrations: {
        path: 'prisma/users/migrations',
    },
    datasource: {
        url: env('USERS_DATABASE_URL'),
    },
});