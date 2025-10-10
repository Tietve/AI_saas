import React from 'react'
import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
}

const sizeMap = {
  sm: { width: 24, height: 34, fontSize: '12px' },
  md: { width: 32, height: 45, fontSize: '16px' },
  lg: { width: 48, height: 67, fontSize: '24px' },
  xl: { width: 64, height: 90, fontSize: '32px' }
}

export function Logo({ size = 'md', className = '', showText = true }: LogoProps) {
  const { width, height, fontSize } = sizeMap[size]
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 200 280" 
        width={width} 
        height={height}
        style={{ minWidth: width, minHeight: height }}
      >
        <g fill="currentColor">
          <path d="M 100,40 L 60,100 L 140,100 Z" stroke="currentColor" strokeWidth="12" fill="none"/>
          <path d="M 100,80 L 50,150 L 150,150 Z" stroke="currentColor" strokeWidth="12" fill="none"/>
          <path d="M 100,130 L 40,200 L 160,200 Z" stroke="currentColor" strokeWidth="12" fill="none"/>
          <rect x="85" y="195" width="30" height="40" rx="2" fill="currentColor"/>
        </g>
      </svg>
      {showText && (
        <span 
          style={{ 
            fontSize, 
            fontWeight: 'bold',
            color: 'currentColor'
          }}
        >
          FirAi
        </span>
      )}
    </div>
  )
}
