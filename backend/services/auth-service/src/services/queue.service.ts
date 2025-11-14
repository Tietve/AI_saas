import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export interface EmailJob {
  type: 'verification' | 'password-reset' | 'welcome' | 'custom';
  to: string;
  token?: string;
  subject?: string;
  html?: string;
}

// Lazy initialization of connection and queue
let connection: IORedis | null = null;
let emailQueue: Queue | null = null;
let connectionAttempted = false;
let connectionFailed = false;

/**
 * Initialize Redis connection and email queue
 */
function initializeQueue(): void {
  if (connectionAttempted) {
    return;
  }

  connectionAttempted = true;

  try {
    connection = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null,
      retryStrategy(times) {
        // Stop retrying after 3 attempts in development
        if (process.env.NODE_ENV === 'development' && times > 3) {
          connectionFailed = true;
          console.error('[Queue] Redis connection failed after 3 attempts. Email queue disabled.');
          return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
      },
      connectTimeout: 5000, // 5 second timeout
    });

    connection.on('error', (err) => {
      connectionFailed = true;
      console.error('[Queue] Redis connection error:', err.message);
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Queue] Email queue disabled in development mode due to Redis unavailability');
      }
    });

    connection.on('ready', () => {
      connectionFailed = false;
      console.log('[Queue] Redis connection established');
    });

    // Email queue
    emailQueue = new Queue('email', { connection });
  } catch (error) {
    connectionFailed = true;
    console.error('[Queue] Failed to initialize queue:', error);
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Queue] Email queue disabled in development mode');
    }
  }
}

/**
 * Add email job to queue
 */
export async function addEmailJob(data: EmailJob): Promise<void> {
  // Initialize queue on first use
  if (!connectionAttempted) {
    initializeQueue();
  }

  // Skip if connection failed in development
  if (connectionFailed && process.env.NODE_ENV === 'development') {
    console.warn(`[Queue] Skipping email job in development mode (Redis unavailable): type=${data.type}, to=${data.to}`);
    return;
  }

  // Check if queue is available
  if (!emailQueue) {
    throw new Error('Email queue not initialized');
  }

  try {
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
  } catch (error: any) {
    console.error(`[Queue] Failed to add email job:`, error.message);

    // In development, don't throw - just log
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Queue] Email job skipped in development mode');
      return;
    }

    throw error;
  }
}

/**
 * Get queue metrics
 */
export async function getEmailQueueMetrics() {
  if (!emailQueue) {
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      total: 0
    };
  }

  try {
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
  } catch (error) {
    console.error('[Queue] Failed to get metrics:', error);
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      total: 0
    };
  }
}

/**
 * Close queue connection
 */
export async function closeQueue() {
  if (emailQueue) {
    await emailQueue.close();
  }
  if (connection) {
    await connection.quit();
  }
}
