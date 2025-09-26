/**
 * CDN Asset Manager for static assets optimization
 */

export interface CDNConfig {
  provider: 'cloudinary' | 'aws-s3' | 'vercel' | 'custom'
  baseUrl?: string
  apiKey?: string
  apiSecret?: string
  bucket?: string
  region?: string
  folder?: string
}

export interface AssetUploadResult {
  url: string
  publicId?: string
  width?: number
  height?: number
  size?: number
  format?: string
}

export interface AssetTransformOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'auto' | 'webp' | 'jpg' | 'png' | 'avif'
  crop?: 'fill' | 'fit' | 'scale' | 'crop'
  gravity?: 'center' | 'face' | 'auto'
}

class CDNAssetManager {
  private config: CDNConfig | null = null

  constructor() {
    this.loadConfig()
  }

  private loadConfig(): void {
    const provider = process.env.CDN_PROVIDER as CDNConfig['provider']
    
    if (!provider || provider === 'none') {
      console.log('[CDN] No CDN provider configured, using local assets')
      return
    }

    this.config = {
      provider,
      baseUrl: process.env.CDN_BASE_URL,
      apiKey: process.env.CDN_API_KEY,
      apiSecret: process.env.CDN_API_SECRET,
      bucket: process.env.CDN_BUCKET,
      region: process.env.CDN_REGION,
      folder: process.env.CDN_FOLDER || 'uploads',
    }

    console.log(`[CDN] Configured with provider: ${provider}`)
  }

  /**
   * Upload file to CDN
   */
  async uploadFile(
    file: File | Buffer,
    filename: string,
    options: AssetTransformOptions = {}
  ): Promise<AssetUploadResult> {
    if (!this.config) {
      // Fallback to local storage
      return this.uploadToLocal(file, filename)
    }

    try {
      switch (this.config.provider) {
        case 'cloudinary':
          return await this.uploadToCloudinary(file, filename, options)
        case 'aws-s3':
          return await this.uploadToS3(file, filename, options)
        case 'vercel':
          return await this.uploadToVercel(file, filename, options)
        default:
          return await this.uploadToLocal(file, filename)
      }
    } catch (error) {
      console.error('[CDN] Upload failed, falling back to local:', error)
      return await this.uploadToLocal(file, filename)
    }
  }

  /**
   * Generate optimized asset URL
   */
  getOptimizedUrl(
    originalUrl: string,
    options: AssetTransformOptions = {}
  ): string {
    if (!this.config) {
      return originalUrl
    }

    switch (this.config.provider) {
      case 'cloudinary':
        return this.getCloudinaryUrl(originalUrl, options)
      case 'aws-s3':
        return this.getS3OptimizedUrl(originalUrl, options)
      case 'vercel':
        return this.getVercelOptimizedUrl(originalUrl, options)
      default:
        return originalUrl
    }
  }

  /**
   * Delete asset from CDN
   */
  async deleteAsset(publicId: string): Promise<boolean> {
    if (!this.config) {
      return false
    }

    try {
      switch (this.config.provider) {
        case 'cloudinary':
          return await this.deleteFromCloudinary(publicId)
        case 'aws-s3':
          return await this.deleteFromS3(publicId)
        case 'vercel':
          return await this.deleteFromVercel(publicId)
        default:
          return false
      }
    } catch (error) {
      console.error('[CDN] Delete failed:', error)
      return false
    }
  }

  // Cloudinary implementation
  private async uploadToCloudinary(
    file: File | Buffer,
    filename: string,
    options: AssetTransformOptions
  ): Promise<AssetUploadResult> {
    const formData = new FormData()
    
    if (file instanceof File) {
      formData.append('file', file)
    } else {
      formData.append('file', new Blob([file]), filename)
    }
    
    formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default')
    formData.append('public_id', `${this.config?.folder || 'uploads'}/${filename}`)
    
    if (options.width) formData.append('width', options.width.toString())
    if (options.height) formData.append('height', options.height.toString())
    if (options.quality) formData.append('quality', options.quality.toString())
    if (options.format) formData.append('format', options.format)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      throw new Error(`Cloudinary upload failed: ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
      size: data.bytes,
      format: data.format,
    }
  }

  private getCloudinaryUrl(originalUrl: string, options: AssetTransformOptions): string {
    if (!originalUrl.includes('cloudinary.com')) {
      return originalUrl
    }

    const url = new URL(originalUrl)
    const pathParts = url.pathname.split('/')
    
    if (pathParts.length < 3) return originalUrl

    // Insert transformation parameters
    const transformations = []
    if (options.width) transformations.push(`w_${options.width}`)
    if (options.height) transformations.push(`h_${options.height}`)
    if (options.quality) transformations.push(`q_${options.quality}`)
    if (options.format && options.format !== 'auto') transformations.push(`f_${options.format}`)
    if (options.crop) transformations.push(`c_${options.crop}`)
    if (options.gravity) transformations.push(`g_${options.gravity}`)

    if (transformations.length > 0) {
      pathParts.splice(2, 0, transformations.join(','))
    }

    return `${url.protocol}//${url.host}${pathParts.join('/')}`
  }

  // AWS S3 implementation
  private async uploadToS3(
    file: File | Buffer,
    filename: string,
    options: AssetTransformOptions
  ): Promise<AssetUploadResult> {
    // This would require AWS SDK implementation
    // For now, return a placeholder
    throw new Error('S3 upload not implemented yet')
  }

  private getS3OptimizedUrl(originalUrl: string, options: AssetTransformOptions): string {
    // S3 with CloudFront for optimization
    return originalUrl
  }

  // Vercel implementation
  private async uploadToVercel(
    file: File | Buffer,
    filename: string,
    options: AssetTransformOptions
  ): Promise<AssetUploadResult> {
    // Vercel Blob storage implementation
    throw new Error('Vercel upload not implemented yet')
  }

  private getVercelOptimizedUrl(originalUrl: string, options: AssetTransformOptions): string {
    // Vercel Image Optimization
    const params = new URLSearchParams()
    if (options.width) params.set('w', options.width.toString())
    if (options.height) params.set('h', options.height.toString())
    if (options.quality) params.set('q', options.quality.toString())
    if (options.format) params.set('f', options.format)

    const queryString = params.toString()
    return queryString ? `${originalUrl}?${queryString}` : originalUrl
  }

  // Local fallback
  private async uploadToLocal(file: File | Buffer, filename: string): Promise<AssetUploadResult> {
    // This would save to local public folder
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const url = `${baseUrl}/uploads/${filename}`
    
    return {
      url,
      size: file instanceof File ? file.size : file.length,
    }
  }

  // Delete implementations
  private async deleteFromCloudinary(publicId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/destroy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            public_id: publicId,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
          }),
        }
      )
      return response.ok
    } catch {
      return false
    }
  }

  private async deleteFromS3(publicId: string): Promise<boolean> {
    // S3 delete implementation
    return false
  }

  private async deleteFromVercel(publicId: string): Promise<boolean> {
    // Vercel delete implementation
    return false
  }
}

// Singleton instance
export const assetManager = new CDNAssetManager()

// Helper functions
export const uploadAsset = (file: File | Buffer, filename: string, options?: AssetTransformOptions) =>
  assetManager.uploadFile(file, filename, options)

export const getOptimizedAssetUrl = (url: string, options?: AssetTransformOptions) =>
  assetManager.getOptimizedUrl(url, options)

export const deleteAsset = (publicId: string) => assetManager.deleteAsset(publicId)

// Image optimization helpers
export const getOptimizedImageUrl = (
  url: string,
  width?: number,
  height?: number,
  quality: number = 80
): string => {
  return assetManager.getOptimizedUrl(url, {
    width,
    height,
    quality,
    format: 'auto',
    crop: 'fill',
  })
}

export const getResponsiveImageUrls = (url: string): Record<string, string> => {
  return {
    sm: getOptimizedImageUrl(url, 640),
    md: getOptimizedImageUrl(url, 768),
    lg: getOptimizedImageUrl(url, 1024),
    xl: getOptimizedImageUrl(url, 1280),
  }
}


