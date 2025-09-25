import React from 'react'
import Image from 'next/image'
import { getOptimizedImageUrl, getResponsiveImageUrls } from '@/lib/cdn/asset-manager'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  quality?: number
  priority?: boolean
  className?: string
  fill?: boolean
  sizes?: string
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  responsive?: boolean
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality = 80,
  priority = false,
  className,
  fill = false,
  sizes,
  placeholder = 'empty',
  blurDataURL,
  responsive = false,
}: OptimizedImageProps) {
  // Get optimized URL
  const optimizedSrc = getOptimizedImageUrl(src, width, height, quality)
  
  // Get responsive URLs if needed
  const responsiveUrls = responsive ? getResponsiveImageUrls(src) : null

  // Generate sizes attribute for responsive images
  const defaultSizes = sizes || (responsive ? 
    '(max-width: 640px) 640px, (max-width: 768px) 768px, (max-width: 1024px) 1024px, 1280px' :
    undefined
  )

  // Handle external URLs
  const isExternal = src.startsWith('http') && !src.includes(process.env.NEXT_PUBLIC_APP_URL || 'localhost')

  if (isExternal) {
    // For external URLs, use regular img tag with optimized src
    return (
      <img
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${className || ''} ${fill ? 'w-full h-full object-cover' : ''}`}
        loading={priority ? 'eager' : 'lazy'}
      />
    )
  }

  return (
    <Image
      src={optimizedSrc}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      quality={quality}
      priority={priority}
      className={className}
      sizes={defaultSizes}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      // Add responsive srcset if available
      {...(responsiveUrls && {
        srcSet: Object.entries(responsiveUrls)
          .map(([size, url]) => `${url} ${size === 'sm' ? '640w' : size === 'md' ? '768w' : size === 'lg' ? '1024w' : '1280w'}`)
          .join(', ')
      })}
    />
  )
}

// Avatar component with automatic optimization
interface OptimizedAvatarProps {
  src: string
  alt: string
  size?: number
  className?: string
  priority?: boolean
}

export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  className,
  priority = false,
}: OptimizedAvatarProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      quality={90}
      priority={priority}
      className={`rounded-full ${className || ''}`}
      responsive
    />
  )
}

// Background image component
interface OptimizedBackgroundProps {
  src: string
  alt: string
  className?: string
  quality?: number
  children?: React.ReactNode
}

export function OptimizedBackground({
  src,
  alt,
  className = '',
  quality = 70,
  children,
}: OptimizedBackgroundProps) {
  const optimizedSrc = getOptimizedImageUrl(src, 1920, 1080, quality)

  return (
    <div
      className={`relative bg-cover bg-center bg-no-repeat ${className}`}
      style={{
        backgroundImage: `url(${optimizedSrc})`,
      }}
    >
      {children}
    </div>
  )
}

// Gallery component for multiple images
interface OptimizedGalleryProps {
  images: Array<{
    src: string
    alt: string
    width?: number
    height?: number
  }>
  columns?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export function OptimizedGallery({
  images,
  columns = 3,
  gap = 'md',
  className = '',
}: OptimizedGalleryProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }

  const gaps = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  }

  return (
    <div className={`grid ${gridCols[columns]} ${gaps[gap]} ${className}`}>
      {images.map((image, index) => (
        <OptimizedImage
          key={index}
          src={image.src}
          alt={image.alt}
          width={image.width || 400}
          height={image.height || 300}
          quality={85}
          className="rounded-lg object-cover"
          responsive
        />
      ))}
    </div>
  )
}
