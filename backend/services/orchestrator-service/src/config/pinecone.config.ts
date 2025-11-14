import { Pinecone } from '@pinecone-database/pinecone';
import { env } from './env.config';
import logger from './logger.config';

// Initialize Pinecone client
let pineconeClient: Pinecone | null = null;

export async function initPinecone(): Promise<Pinecone> {
  if (pineconeClient) {
    return pineconeClient;
  }

  try {
    // Skip if API key is placeholder
    if (env.pinecone.apiKey === 'your_pinecone_api_key_here') {
      logger.warn('[Pinecone] Skipping initialization - API key not configured');
      return null as any;
    }

    pineconeClient = new Pinecone({
      apiKey: env.pinecone.apiKey,
    });

    logger.info('[Pinecone] Client initialized successfully');

    // Verify index exists
    await verifyPineconeIndex();

    return pineconeClient;
  } catch (error) {
    logger.error('[Pinecone] Initialization failed:', error);
    logger.warn('[Pinecone] Continuing without Pinecone (features will be limited)');
    return null as any;
  }
}

export async function verifyPineconeIndex(): Promise<void> {
  if (!pineconeClient) {
    throw new Error('Pinecone client not initialized');
  }

  try {
    const indexList = await pineconeClient.listIndexes();
    const indexExists = indexList.indexes?.some(
      (index) => index.name === env.pinecone.indexName
    );

    if (!indexExists) {
      logger.warn(`[Pinecone] Index '${env.pinecone.indexName}' not found`);
      logger.info('[Pinecone] Creating new index...');

      // Determine cloud provider and region from environment
      const cloudProvider = env.pinecone.environment?.includes('gcp') ? 'gcp' : 'aws';
      const region = cloudProvider === 'gcp' ? 'us-west1' : 'us-east-1';

      await pineconeClient.createIndex({
        name: env.pinecone.indexName,
        dimension: 1536, // text-embedding-3-small dimension
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: cloudProvider,
            region: region,
          },
        },
      });

      logger.info('[Pinecone] Index creation initiated - waiting for index to be ready...');

      // Wait for index to be ready (can take 30-60 seconds)
      let retries = 0;
      const maxRetries = 30;
      while (retries < maxRetries) {
        try {
          const index = pineconeClient.index(env.pinecone.indexName);
          await index.describeIndexStats();
          logger.info('[Pinecone] Index is ready!');
          break;
        } catch (error) {
          retries++;
          if (retries >= maxRetries) {
            logger.warn('[Pinecone] Index not ready after 60s, continuing anyway...');
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between checks
        }
      }
    } else {
      logger.info(`[Pinecone] Index '${env.pinecone.indexName}' verified`);
    }
  } catch (error) {
    logger.error('[Pinecone] Index verification failed:', error);
    throw error;
  }
}

export async function getPineconeIndex() {
  if (!pineconeClient) {
    await initPinecone();
  }
  return pineconeClient!.index(env.pinecone.indexName);
}

export async function checkPineconeConnection(): Promise<boolean> {
  try {
    if (!pineconeClient) {
      await initPinecone();
    }

    const index = await getPineconeIndex();
    await index.describeIndexStats();

    return true;
  } catch (error) {
    logger.error('[Pinecone] Health check failed:', error);
    return false;
  }
}

export { pineconeClient };
