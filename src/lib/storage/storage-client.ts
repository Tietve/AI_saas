/**
 * Unified Storage Client
 *
 * Supports:
 * - Cloudflare R2 (S3-compatible)
 * - Azure Blob Storage
 *
 * Auto-selects based on available env vars
 */

import { env, getStorageConfig } from '@/config/env.server'
import { logger } from '@/lib/logger'

// ============================================
// TYPES
// ============================================

export interface UploadResult {
  url: string
  key: string
  bucket?: string
  size: number
  contentType: string
  provider: 'r2' | 'azure' | 'local'
}

export interface UploadOptions {
  key?: string // Custom key/path
  contentType?: string
  metadata?: Record<string, string>
  isPublic?: boolean
}

// ============================================
// STORAGE CLIENT INTERFACE
// ============================================

export interface StorageClient {
  upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult>
  delete(key: string): Promise<void>
  getUrl(key: string): string
  exists(key: string): Promise<boolean>
}

// ============================================
// CLOUDFLARE R2 CLIENT
// ============================================

class R2StorageClient implements StorageClient {
  private s3Client: any

  constructor() {
    // Lazy import AWS SDK only if R2 is configured
    const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3')

    const config = getStorageConfig()
    if (!config || config.type !== 'r2') {
      throw new Error('R2 storage not configured')
    }

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })

    logger.info('📦 R2 Storage Client initialized')
  }

  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    const { PutObjectCommand } = require('@aws-sdk/client-s3')

    const config = getStorageConfig()
    if (!config || config.type !== 'r2') {
      throw new Error('R2 storage not configured')
    }

    const key = options.key || `uploads/${Date.now()}-${Math.random().toString(36).substring(7)}`
    const contentType = options.contentType || 'application/octet-stream'

    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: options.metadata,
      ACL: options.isPublic !== false ? 'public-read' : 'private',
    })

    await this.s3Client.send(command)

    const url = this.getUrl(key)

    logger.info({ key, size: buffer.length, contentType }, 'File uploaded to R2')

    return {
      url,
      key,
      bucket: config.bucketName,
      size: buffer.length,
      contentType,
      provider: 'r2',
    }
  }

  async delete(key: string): Promise<void> {
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3')

    const config = getStorageConfig()
    if (!config || config.type !== 'r2') {
      throw new Error('R2 storage not configured')
    }

    const command = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    })

    await this.s3Client.send(command)

    logger.info({ key }, 'File deleted from R2')
  }

  async exists(key: string): Promise<boolean> {
    const { HeadObjectCommand } = require('@aws-sdk/client-s3')

    const config = getStorageConfig()
    if (!config || config.type !== 'r2') {
      throw new Error('R2 storage not configured')
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      })

      await this.s3Client.send(command)
      return true
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false
      }
      throw error
    }
  }

  getUrl(key: string): string {
    const config = getStorageConfig()
    if (!config || config.type !== 'r2') {
      throw new Error('R2 storage not configured')
    }

    if (config.publicUrl) {
      return `${config.publicUrl}/${key}`
    }

    // Default R2 public URL format
    return `https://pub-${config.accountId}.r2.dev/${key}`
  }
}

// ============================================
// AZURE BLOB CLIENT
// ============================================

class AzureBlobStorageClient implements StorageClient {
  private containerClient: any

  constructor() {
    // Lazy import Azure SDK only if Blob is configured
    const { BlobServiceClient } = require('@azure/storage-blob')

    const config = getStorageConfig()
    if (!config || config.type !== 'azure') {
      throw new Error('Azure Blob storage not configured')
    }

    const blobServiceClient = config.connectionString
      ? BlobServiceClient.fromConnectionString(config.connectionString)
      : new BlobServiceClient(
          `https://${config.accountName}.blob.core.windows.net`,
          {
            // TODO: Add SAS token or managed identity support
          }
        )

    this.containerClient = blobServiceClient.getContainerClient(config.containerName)

    logger.info('📦 Azure Blob Storage Client initialized')
  }

  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    const key = options.key || `uploads/${Date.now()}-${Math.random().toString(36).substring(7)}`
    const contentType = options.contentType || 'application/octet-stream'

    const blockBlobClient = this.containerClient.getBlockBlobClient(key)

    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: {
        blobContentType: contentType,
      },
      metadata: options.metadata,
    })

    const url = blockBlobClient.url

    logger.info({ key, size: buffer.length, contentType }, 'File uploaded to Azure Blob')

    return {
      url,
      key,
      size: buffer.length,
      contentType,
      provider: 'azure',
    }
  }

  async delete(key: string): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(key)
    await blockBlobClient.delete()

    logger.info({ key }, 'File deleted from Azure Blob')
  }

  async exists(key: string): Promise<boolean> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(key)
    return await blockBlobClient.exists()
  }

  getUrl(key: string): string {
    const config = getStorageConfig()
    if (!config || config.type !== 'azure') {
      throw new Error('Azure Blob storage not configured')
    }

    return `https://${config.accountName}.blob.core.windows.net/${config.containerName}/${key}`
  }
}

// ============================================
// LOCAL STORAGE CLIENT (Fallback for dev)
// ============================================

class LocalStorageClient implements StorageClient {
  private uploadsDir: string

  constructor() {
    const fs = require('fs')
    const path = require('path')

    this.uploadsDir = path.join(process.cwd(), 'public', 'uploads')

    // Create uploads directory if not exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true })
    }

    logger.warn('📦 Local Storage Client initialized (dev mode)')
  }

  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    const fs = require('fs').promises
    const path = require('path')

    const key = options.key || `uploads/${Date.now()}-${Math.random().toString(36).substring(7)}`
    const contentType = options.contentType || 'application/octet-stream'

    const filePath = path.join(process.cwd(), 'public', key)
    const dir = path.dirname(filePath)

    // Create directory if not exists
    await fs.mkdir(dir, { recursive: true })

    // Write file
    await fs.writeFile(filePath, buffer)

    const url = `/${key}`

    logger.info({ key, size: buffer.length, contentType }, 'File uploaded to local storage')

    return {
      url,
      key,
      size: buffer.length,
      contentType,
      provider: 'local',
    }
  }

  async delete(key: string): Promise<void> {
    const fs = require('fs').promises
    const path = require('path')

    const filePath = path.join(process.cwd(), 'public', key)
    await fs.unlink(filePath)

    logger.info({ key }, 'File deleted from local storage')
  }

  async exists(key: string): Promise<boolean> {
    const fs = require('fs').promises
    const path = require('path')

    const filePath = path.join(process.cwd(), 'public', key)

    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  getUrl(key: string): string {
    return `/${key}`
  }
}

// ============================================
// CLIENT FACTORY
// ============================================

let storageClient: StorageClient | null = null

export function getStorageClient(): StorageClient {
  if (storageClient) {
    return storageClient
  }

  const config = getStorageConfig()

  if (config?.type === 'r2') {
    storageClient = new R2StorageClient()
  } else if (config?.type === 'azure') {
    storageClient = new AzureBlobStorageClient()
  } else {
    // Fallback to local storage in development
    if (env.NODE_ENV === 'development') {
      storageClient = new LocalStorageClient()
    } else {
      throw new Error('No storage provider configured. Set R2 or Azure Blob env vars.')
    }
  }

  return storageClient
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

export async function uploadFile(
  buffer: Buffer,
  options: UploadOptions
): Promise<UploadResult> {
  const client = getStorageClient()
  return client.upload(buffer, options)
}

export async function deleteFile(key: string): Promise<void> {
  const client = getStorageClient()
  return client.delete(key)
}

export async function fileExists(key: string): Promise<boolean> {
  const client = getStorageClient()
  return client.exists(key)
}

export function getFileUrl(key: string): string {
  const client = getStorageClient()
  return client.getUrl(key)
}
