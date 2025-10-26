import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config/env';
import { emailService } from '../services/email.service';
import pino from 'pino';

const logger = pino({ level: config.LOG_LEVEL });

// Job types
export interface EmailJob {
  type: 'verification' | 'password-reset' | 'welcome' | 'custom';
  to: string;
  token?: string;
  subject?: string;
  html?: string;
}

/**
 * Email worker to process email jobs from the queue
 */
export class EmailWorker {
  private worker: Worker;
  private connection: IORedis;

  constructor() {
    this.connection = new IORedis({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      maxRetriesPerRequest: null
    });

    this.worker = new Worker('email', this.processJob.bind(this), {
      connection: this.connection,
      concurrency: 5, // Process 5 emails at a time
      limiter: {
        max: 10, // Max 10 jobs
        duration: 1000 // per second
      }
    });

    this.setupEventHandlers();

    logger.info('[EmailWorker] Started with concurrency 5');
  }

  /**
   * Process individual email job
   */
  private async processJob(job: Job<EmailJob>): Promise<void> {
    const { type, to, token, subject, html } = job.data;

    logger.info(`[EmailWorker] Processing job ${job.id}: type=${type}, to=${to}`);

    try {
      switch (type) {
        case 'verification':
          if (!token) throw new Error('Token required for verification email');
          await emailService.sendVerificationEmail(to, token);
          break;

        case 'password-reset':
          if (!token) throw new Error('Token required for password reset email');
          await emailService.sendPasswordResetEmail(to, token);
          break;

        case 'welcome':
          await emailService.sendWelcomeEmail(to);
          break;

        case 'custom':
          if (!subject || !html) throw new Error('Subject and HTML required for custom email');
          await emailService.sendEmail({ to, subject, html });
          break;

        default:
          throw new Error(`Unknown email type: ${type}`);
      }

      logger.info(`[EmailWorker] Job ${job.id} completed successfully`);
    } catch (error: any) {
      logger.error(`[EmailWorker] Job ${job.id} failed:`, error.message);
      throw error; // Re-throw to trigger retry
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers() {
    this.worker.on('completed', (job) => {
      logger.info(`[EmailWorker] Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`[EmailWorker] Job ${job?.id} failed:`, {
        error: err.message,
        attempts: job?.attemptsMade,
        maxAttempts: job?.opts?.attempts
      });
    });

    this.worker.on('error', (err) => {
      logger.error('[EmailWorker] Worker error:', err);
    });

    this.worker.on('active', (job) => {
      logger.debug(`[EmailWorker] Job ${job.id} is now active`);
    });

    this.worker.on('stalled', (jobId) => {
      logger.warn(`[EmailWorker] Job ${jobId} stalled`);
    });
  }

  /**
   * Graceful shutdown
   */
  async close() {
    logger.info('[EmailWorker] Shutting down...');
    await this.worker.close();
    await this.connection.quit();
    logger.info('[EmailWorker] Shutdown complete');
  }
}

export const emailWorker = new EmailWorker();
