import amqp, { Channel, Connection, ConsumeMessage } from 'amqplib';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { AnalyticsEvent, toClickHouseEvent } from './types';
import { insertEvents } from '../database/clickhouse.client';

let connection: Connection | null = null;
let channel: Channel | null = null;

/**
 * Initialize RabbitMQ connection and channel
 */
export async function initRabbitMQ(): Promise<void> {
  try {
    logger.info('🐰 Connecting to RabbitMQ...');

    // Connect
    connection = await amqp.connect(config.rabbitmq.url);
    channel = await connection.createChannel();

    logger.info('✅ RabbitMQ connection established');

    // Declare exchange (topic type for routing)
    await channel.assertExchange(config.rabbitmq.exchange, 'topic', {
      durable: true,
    });

    // Declare queue
    await channel.assertQueue(config.rabbitmq.queue, {
      durable: true,
      maxLength: 100000, // Max 100k messages in queue
    });

    // Bind queue to exchange with routing patterns
    const routingKeys = [
      'user.*',     // All user events
      'chat.*',     // All chat events
      'billing.*',  // All billing events
      'provider.*', // All provider events
    ];

    for (const key of routingKeys) {
      await channel.bindQueue(
        config.rabbitmq.queue,
        config.rabbitmq.exchange,
        key
      );
    }

    logger.info(`✅ Queue ${config.rabbitmq.queue} bound to exchange ${config.rabbitmq.exchange}`);

    // Handle connection errors
    connection.on('error', (err) => {
      logger.error('❌ RabbitMQ connection error', err);
    });

    connection.on('close', () => {
      logger.warn('⚠️  RabbitMQ connection closed');
    });

  } catch (error) {
    logger.error('❌ Failed to initialize RabbitMQ', error);
    throw error;
  }
}

/**
 * Process incoming event
 */
async function processEvent(event: AnalyticsEvent): Promise<void> {
  try {
    // Transform to ClickHouse format
    const chEvent = toClickHouseEvent(event);

    // Insert into ClickHouse
    await insertEvents([chEvent]);

    logger.debug('✅ Event processed', {
      event_type: event.event_type,
      user_id: event.user_id,
    });

  } catch (error) {
    logger.error('❌ Failed to process event', {
      error,
      event_type: event.event_type,
      event_id: event.event_id,
    });
    throw error;
  }
}

/**
 * Batch processor for better performance
 */
class EventBatchProcessor {
  private batch: AnalyticsEvent[] = [];
  private batchSize = 100;
  private flushInterval = 5000; // 5 seconds
  private timer: NodeJS.Timeout | null = null;

  constructor(batchSize?: number, flushInterval?: number) {
    if (batchSize) this.batchSize = batchSize;
    if (flushInterval) this.flushInterval = flushInterval;
    this.startTimer();
  }

  private startTimer() {
    this.timer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  async add(event: AnalyticsEvent): Promise<void> {
    this.batch.push(event);

    if (this.batch.length >= this.batchSize) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.batch.length === 0) return;

    const events = [...this.batch];
    this.batch = [];

    try {
      const chEvents = events.map(toClickHouseEvent);
      await insertEvents(chEvents);
      logger.info(`✅ Batch inserted: ${events.length} events`);
    } catch (error) {
      logger.error('❌ Failed to insert batch', error);
      // Re-add failed events to batch (with limit to prevent infinite growth)
      if (this.batch.length < 1000) {
        this.batch.push(...events);
      }
    }
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

const batchProcessor = new EventBatchProcessor();

/**
 * Start consuming events from RabbitMQ
 */
export async function startConsumer(): Promise<void> {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }

  logger.info('🚀 Starting event consumer...');

  // Set prefetch count (process N messages at a time)
  await channel.prefetch(10);

  // Start consuming
  await channel.consume(
    config.rabbitmq.queue,
    async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        // Parse message
        const content = msg.content.toString();
        const event: AnalyticsEvent = JSON.parse(content);

        logger.debug('📨 Received event', {
          event_type: event.event_type,
          routing_key: msg.fields.routingKey,
        });

        // Add to batch processor
        await batchProcessor.add(event);

        // Acknowledge message
        channel!.ack(msg);

      } catch (error) {
        logger.error('❌ Failed to process message', {
          error,
          message: msg.content.toString(),
        });

        // Reject and requeue (will be retried)
        // After 3 failures, message goes to dead letter queue (if configured)
        channel!.nack(msg, false, true);
      }
    },
    {
      noAck: false, // Manual acknowledgment
    }
  );

  logger.info(`✅ Consumer started on queue: ${config.rabbitmq.queue}`);
}

/**
 * Stop consumer and close connections
 */
export async function stopConsumer(): Promise<void> {
  logger.info('Stopping event consumer...');

  // Flush remaining events
  await batchProcessor.flush();
  batchProcessor.stop();

  if (channel) {
    await channel.close();
    channel = null;
  }

  if (connection) {
    await connection.close();
    connection = null;
  }

  logger.info('✅ Event consumer stopped');
}

/**
 * Publish event to RabbitMQ (for testing)
 */
export async function publishEvent(event: AnalyticsEvent): Promise<void> {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }

  const routingKey = event.event_type; // e.g., 'user.signup', 'chat.message_sent'

  channel.publish(
    config.rabbitmq.exchange,
    routingKey,
    Buffer.from(JSON.stringify(event)),
    {
      persistent: true,
      contentType: 'application/json',
    }
  );

  logger.debug('✅ Event published', {
    event_type: event.event_type,
    routing_key: routingKey,
  });
}
