/**
 * Message Queue service using BullMQ
 */

import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import IORedis from 'ioredis';

export interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
}

export interface JobOptions {
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  delay?: number;
  priority?: number;
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
}

export class QueueService {
  private connection: IORedis;
  private queues: Map<string, Queue>;
  private workers: Map<string, Worker>;
  private events: Map<string, QueueEvents>;

  constructor(private config: QueueConfig) {
    this.connection = new IORedis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db || 0,
      maxRetriesPerRequest: null
    });

    this.queues = new Map();
    this.workers = new Map();
    this.events = new Map();
  }

  /**
   * Create or get a queue
   */
  getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, {
        connection: this.connection
      });
      this.queues.set(name, queue);
    }
    return this.queues.get(name)!;
  }

  /**
   * Add a job to the queue
   */
  async addJob<T = any>(
    queueName: string,
    jobName: string,
    data: T,
    options?: JobOptions
  ): Promise<Job<T>> {
    const queue = this.getQueue(queueName);

    return queue.add(jobName, data, {
      attempts: options?.attempts || 3,
      backoff: options?.backoff || {
        type: 'exponential',
        delay: 1000
      },
      removeOnComplete: options?.removeOnComplete ?? true,
      removeOnFail: options?.removeOnFail ?? false,
      ...options
    });
  }

  /**
   * Register a worker to process jobs
   */
  registerWorker<T = any>(
    queueName: string,
    processor: (job: Job<T>) => Promise<any>,
    concurrency: number = 5
  ): Worker {
    if (this.workers.has(queueName)) {
      throw new Error(`Worker already registered for queue: ${queueName}`);
    }

    const worker = new Worker(queueName, processor, {
      connection: this.connection,
      concurrency
    });

    // Error handling
    worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} in queue ${queueName} failed:`, err);
    });

    worker.on('error', (err) => {
      console.error(`Worker error in queue ${queueName}:`, err);
    });

    this.workers.set(queueName, worker);
    return worker;
  }

  /**
   * Listen to queue events
   */
  subscribeToEvents(queueName: string) {
    if (this.events.has(queueName)) {
      return this.events.get(queueName)!;
    }

    const queueEvents = new QueueEvents(queueName, {
      connection: this.connection
    });

    queueEvents.on('completed', ({ jobId, returnvalue }) => {
      console.log(`Job ${jobId} in queue ${queueName} completed`);
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`Job ${jobId} in queue ${queueName} failed: ${failedReason}`);
    });

    this.events.set(queueName, queueEvents);
    return queueEvents;
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics(queueName: string) {
    const queue = this.getQueue(queueName);

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount()
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
   * Clean up completed/failed jobs
   */
  async cleanQueue(
    queueName: string,
    grace: number = 24 * 60 * 60 * 1000 // 24 hours
  ) {
    const queue = this.getQueue(queueName);

    await Promise.all([
      queue.clean(grace, 10000, 'completed'),
      queue.clean(grace, 10000, 'failed')
    ]);
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: string) {
    const queue = this.getQueue(queueName);
    await queue.pause();
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName: string) {
    const queue = this.getQueue(queueName);
    await queue.resume();
  }

  /**
   * Close all connections
   */
  async close() {
    // Close all workers
    for (const worker of this.workers.values()) {
      await worker.close();
    }

    // Close all queue events
    for (const events of this.events.values()) {
      await events.close();
    }

    // Close all queues
    for (const queue of this.queues.values()) {
      await queue.close();
    }

    // Close Redis connection
    await this.connection.quit();
  }
}

// Pre-defined queue names
export const QUEUE_NAMES = {
  EMAIL: 'email',
  AI_PROCESSING: 'ai-processing',
  WEBHOOK: 'webhook',
  NOTIFICATION: 'notification',
  DATA_EXPORT: 'data-export',
  SUBSCRIPTION_RENEWAL: 'subscription-renewal'
} as const;

// Job types for type safety
export interface EmailJob {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface AIProcessingJob {
  userId: string;
  conversationId: string;
  messageId: string;
  prompt: string;
  model: string;
}

export interface WebhookJob {
  url: string;
  payload: any;
  headers?: Record<string, string>;
  retryCount?: number;
}

export interface NotificationJob {
  userId: string;
  type: 'push' | 'email' | 'sms';
  title: string;
  body: string;
  data?: any;
}

export interface DataExportJob {
  userId: string;
  format: 'json' | 'csv';
  email: string;
}

export interface SubscriptionRenewalJob {
  subscriptionId: string;
  userId: string;
}
