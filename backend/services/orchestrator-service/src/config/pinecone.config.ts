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

      await pineconeClient.createIndex({
        name: env.pinecone.indexName,
        dimension: 1536, // text-embedding-3-small dimension
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-west-2',
          },
        },
      });

      logger.info('[Pinecone] Index created successfully');
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
