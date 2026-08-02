'use client'

import { useState } from 'react'
import Image from 'next/image'

// 带占位骨架和渐显动画的图片组件
// 使用 next/image 自动优化：WebP/AVIF 转换 + 响应式尺寸
export function SmartImage({ src, alt, className, onClick, loading = 'lazy', sizes = '100vw' }: {
  src: string
  alt: string
  className?: string
  onClick?: () => void
  loading?: 'lazy' | 'eager'
  sizes?: string
}) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={`relative w-full h-full ${className || ''}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        loading={loading}
        onLoad={() => setLoaded(true)}
        className={`object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
        draggable={false}
      />
    </div>
  )
}
