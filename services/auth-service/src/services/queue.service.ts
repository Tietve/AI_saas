import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null
});

// Email queue
const emailQueue = new Queue('email', { connection });

export interface EmailJob {
  type: 'verification' | 'password-reset' | 'welcome' | 'custom';
  to: string;
  token?: string;
  subject?: string;
  html?: string;
}

/**
 * Add email job to queue
 */
export async function addEmailJob(data: EmailJob): Promise<void> {
  await emailQueue.add('send-email', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: false // Keep failed jobs for debugging
  });

  console.log(`[Queue] Email job added: type=${data.type}, to=${data.to}`);
}

/**
 * Get queue metrics
 */
export async function getEmailQueueMetrics() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
    emailQueue.getDelayedCount()
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed
  };
}

/**
 * Close queue connection
 */
export async function closeQueue() {
  await emailQueue.close();
  await connection.quit();
}
