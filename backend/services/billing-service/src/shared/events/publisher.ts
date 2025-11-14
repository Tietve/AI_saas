/**
 * Event Publisher for Analytics
 *
 * Publishes events to RabbitMQ for consumption by Analytics Service
 */

import * as amqp from 'amqplib';
import { AnalyticsEvent } from './types';

interface PublisherConfig {
  rabbitmqUrl: string;
  exchange: string;
  reconnectInterval?: number; // ms
}

class EventPublisher {
  private connection: any = null;  // Using any to avoid amqplib type issues
  private channel: any = null;
  private config: PublisherConfig;
  private isConnecting = false;
  private publishQueue: Array<{ event: AnalyticsEvent; resolve: () => void; reject: (err: Error) => void }> = [];

  constructor(config: PublisherConfig) {
    this.config = {
      reconnectInterval: 5000,
      ...config,
    };
  }

  /**
   * Initialize connection to RabbitMQ
   */
  async connect(): Promise<void> {
    if (this.channel) {
      return; // Already connected
    }

    if (this.isConnecting) {
      // Wait for existing connection attempt
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.connect();
    }

    this.isConnecting = true;

    try {
      console.log('[EventPublisher] Connecting to RabbitMQ...');

      this.connection = await amqp.connect(this.config.rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Declare exchange
      await this.channel.assertExchange(this.config.exchange, 'topic', {
        durable: true,
      });

      console.log('[EventPublisher] ✅ Connected to RabbitMQ');

      // Handle connection errors
      this.connection.on('error', (err: Error) => {
        console.error('[EventPublisher] ❌ Connection error:', err.message);
        this.reconnect();
      });

      this.connection.on('close', () => {
        console.warn('[EventPublisher] ⚠️  Connection closed');
        this.reconnect();
      });

      // Process queued events
      this.processQueue();

    } catch (error) {
      console.error('[EventPublisher] ❌ Failed to connect:', error);
      this.reconnect();
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Reconnect to RabbitMQ
   */
  private reconnect(): void {
    this.connection = null;
    this.channel = null;

    setTimeout(() => {
      console.log('[EventPublisher] Attempting to reconnect...');
      this.connect().catch(err => {
        console.error('[EventPublisher] Reconnect failed:', err.message);
      });
    }, this.config.reconnectInterval);
  }

  /**
   * Process queued events
   */
  private processQueue(): void {
    if (!this.channel) return;

    while (this.publishQueue.length > 0) {
      const item = this.publishQueue.shift();
      if (item) {
        this.publishNow(item.event)
          .then(item.resolve)
          .catch(item.reject);
      }
    }
  }

  /**
   * Publish event immediately (assumes channel is available)
   */
  private async publishNow(event: AnalyticsEvent): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    const routingKey = event.event_type; // e.g., 'user.signup'

    const published = this.channel.publish(
      this.config.exchange,
      routingKey,
      Buffer.from(JSON.stringify(event)),
      {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now(),
      }
    );

    if (!published) {
      throw new Error('Failed to publish event (buffer full)');
    }
  }

  /**
   * Publish event to RabbitMQ
   */
  async publish(event: AnalyticsEvent): Promise<void> {
    // Add event_id if not present
    if (!event.event_id) {
      event.event_id = crypto.randomUUID();
    }

    // Add timestamp if not present
    if (!event.timestamp) {
      event.timestamp = new Date().toISOString();
    }

    try {
      // Ensure connection
      if (!this.channel) {
        // Queue event and attempt connection
        return new Promise((resolve, reject) => {
          this.publishQueue.push({ event, resolve, reject });
          this.connect().catch(reject);
        });
      }

      // Publish immediately
      await this.publishNow(event);

    } catch (error) {
      console.error('[EventPublisher] ❌ Failed to publish event:', error);

      // Queue for retry if connection issue
      if (!this.channel) {
        return new Promise((resolve, reject) => {
          this.publishQueue.push({ event, resolve, reject });
        });
      }

      throw error;
    }
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }

    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }

    console.log('[EventPublisher] ✅ Connection closed');
  }
}

// Singleton instance
let publisher: EventPublisher | null = null;

/**
 * Initialize event publisher
 */
export function initEventPublisher(config: PublisherConfig): void {
  if (publisher) {
    console.warn('[EventPublisher] Already initialized');
    return;
  }

  publisher = new EventPublisher(config);
  publisher.connect().catch(err => {
    console.error('[EventPublisher] Initial connection failed:', err);
  });
}

/**
 * Publish analytics event
 */
export async function publishAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  if (!publisher) {
    console.error('[EventPublisher] Not initialized. Call initEventPublisher() first.');

    // In development, we can be lenient
    if (process.env.NODE_ENV === 'development') {
      console.warn('[EventPublisher] Skipping event in development mode');
      return;
    }

    throw new Error('EventPublisher not initialized');
  }

  await publisher.publish(event);
}

/**
 * Close event publisher
 */
export async function closeEventPublisher(): Promise<void> {
  if (publisher) {
    await publisher.close();
    publisher = null;
  }
}

// Export for direct use if needed
export { EventPublisher };
