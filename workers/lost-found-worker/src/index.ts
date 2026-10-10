import { PgBoss } from 'pg-boss';
import { logger } from './logger';
import { handleProcessItem } from './handlers';

async function start() {
    const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
    const boss = new PgBoss(dbUrl);

    boss.on('error', (error: any) => logger.error('pg-boss error:', error));

    await boss.start();
    logger.info("Lost & Found Worker started, connected to pg-boss.");

    await boss.work('process-item', async (job: any) => {
        try {
            await handleProcessItem(job as any);
        } catch (e) {
            logger.error("Error processing item:", e);
            throw e;
        }
    });
}

start().catch(e => {
    logger.error("Failed to start worker:", e);
    process.exit(1);
});
