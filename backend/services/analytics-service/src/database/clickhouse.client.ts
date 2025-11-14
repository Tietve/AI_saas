import { createClient, ClickHouseClient } from '@clickhouse/client';
import { config } from '../config/env';
import { logger } from '../utils/logger';

let client: ClickHouseClient | null = null;

/**
 * Initialize ClickHouse client
 */
export function initClickHouseClient(): ClickHouseClient {
  if (client) {
    return client;
  }

  client = createClient({
    host: `http://${config.clickhouse.host}:${config.clickhouse.port}`,
    username: config.clickhouse.user,
    password: config.clickhouse.password,
    database: config.clickhouse.database,
    compression: {
      request: true,
      response: true,
    },
    clickhouse_settings: {
      // Recommended settings for analytics workloads
      max_execution_time: 60,
      max_memory_usage: 10000000000, // 10GB
    },
  });

  logger.info('✅ ClickHouse client initialized');

  return client;
}

/**
 * Get ClickHouse client instance
 */
export function getClickHouseClient(): ClickHouseClient {
  if (!client) {
    throw new Error('ClickHouse client not initialized. Call initClickHouseClient() first.');
  }
  return client;
}

/**
 * Test ClickHouse connection
 */
export async function testClickHouseConnection(): Promise<boolean> {
  try {
    const ch = getClickHouseClient();
    const result = await ch.query({
      query: 'SELECT 1 as test',
      format: 'JSONEachRow',
    });

    const data = await result.json();
    logger.info('✅ ClickHouse connection test successful', data);
    return true;
  } catch (error) {
    logger.error('❌ ClickHouse connection test failed', error);
    return false;
  }
}

/**
 * Insert events into ClickHouse
 */
export async function insertEvents(events: any[]): Promise<void> {
  if (events.length === 0) {
    return;
  }

  const ch = getClickHouseClient();

  try {
    await ch.insert({
      table: 'analytics_db.events',
      values: events,
      format: 'JSONEachRow',
    });

    logger.info(`✅ Inserted ${events.length} events into ClickHouse`);
  } catch (error) {
    logger.error('❌ Failed to insert events into ClickHouse', error);
    throw error;
  }
}

/**
 * Execute a query
 */
export async function executeQuery<T = any>(query: string): Promise<T[]> {
  const ch = getClickHouseClient();

  try {
    const result = await ch.query({
      query,
      format: 'JSONEachRow',
    });

    const data = await result.json<T>();
    return data as T[];
  } catch (error) {
    logger.error('❌ Query execution failed', { query, error });
    throw error;
  }
}

/**
 * Close ClickHouse client
 */
export async function closeClickHouseClient(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    logger.info('✅ ClickHouse client closed');
  }
}
