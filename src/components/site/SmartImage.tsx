'use client'

import { useState } from 'react'

// 带占位骨架和渐显动画的图片组件
export function SmartImage({ src, alt, className, onClick, loading = 'lazy' }: {
  src: string
  alt: string
  className?: string
  onClick?: () => void
  loading?: 'lazy' | 'eager'
}) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={`relative ${className || ''}`}>
      {/* 骨架占位 */}
      {!loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-lg" />
      )}
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      />
    </div>
  )
}
