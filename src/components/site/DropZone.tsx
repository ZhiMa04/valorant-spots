'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X } from 'lucide-react'
import Image from 'next/image'

interface DropZoneProps {
  label: string
  onUpload: (paths: string[]) => void
  uploadedPaths: string[]
  onRemove: (index: number) => void
  /** 最大宽度/高度，默认 1920px */
  maxSize?: number
  /** JPEG 压缩质量 0-1，默认 0.85 */
  quality?: number
}

// 客户端图片压缩：用 Canvas 缩放 + 转 JPEG
// 大图能砍 50-80% 体积，上传快很多
async function compressImage(file: File, maxSize: number, quality: number): Promise<File> {
  // 小文件不压缩
  if (file.size < 200 * 1024) return file

  const img = new window.Image()
  const url = URL.createObjectURL(file)
  try {
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = url
    })

    let { width, height } = img
    // 缩放到 maxSize 以内
    if (width > maxSize || height > maxSize) {
      if (width > height) {
        height = Math.round(height * maxSize / width)
        width = maxSize
      } else {
        width = Math.round(width * maxSize / height)
        height = maxSize
      }
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, width, height)

    // 转 JPEG（除非原图是透明 PNG）
    const hasAlpha = file.type === 'image/png'
    const mimeType = hasAlpha ? 'image/png' : 'image/jpeg'
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), mimeType, quality)
    })

    const ext = hasAlpha ? 'png' : 'jpg'
    const newName = file.name.replace(/\.[^.]+$/, '') + '.' + ext
    return new File([blob], newName, { type: mimeType })
  } finally {
    URL.revokeObjectURL(url)
  }
}

// 通用拖拽上传组件：支持拖拽和点击选择，客户端压缩
export function DropZone({ label, onUpload, uploadedPaths, onRemove, maxSize = 1920, quality = 0.85 }: DropZoneProps) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const getCsrf = () => document.cookie.match(/csrf-token=([^;]+)/)?.[1] || ''

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (fileArray.length === 0) {
      setError('请选择图片文件')
      return
    }

    // 检查大小（压缩前）
    const oversized = fileArray.find(f => f.size > 10 * 1024 * 1024)
    if (oversized) {
      setError(`${oversized.name} 超过10MB`)
      return
    }

    setUploading(true)
    setError('')

    try {
      // 并行压缩所有图片
      const compressed = await Promise.all(
        fileArray.map(f => compressImage(f, maxSize, quality))
      )

      const formData = new FormData()
      compressed.forEach(f => formData.append('images', f))

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'X-CSRF-Token': getCsrf() },
        body: formData,
      })

      const data = await res.json()
      if (res.ok && data.paths) {
        onUpload(data.paths)
      } else {
        setError(data.error || '上传失败')
      }
    } catch {
      setError('网络错误')
    } finally {
      setUploading(false)
    }
  }, [onUpload, maxSize, quality])

  return (
    <div>
      {/* 拖拽区域 */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false) }}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all min-h-[120px] flex flex-col items-center justify-center gap-2
          ${dragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'}
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        {uploading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            压缩上传中...
          </div>
        ) : (
          <>
            <Upload className="h-6 w-6 text-muted-foreground" />
            <div className="text-sm font-medium">{label}</div>
            <div className="text-xs text-muted-foreground">拖拽图片到这里或点击选择</div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {/* 错误提示 */}
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}

      {/* 预览缩略图 */}
      {uploadedPaths.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {uploadedPaths.map((path, i) => (
            <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border">
              <Image src={path} alt="" fill sizes="80px" className="object-cover" />
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(i) }}
                className="absolute top-0 right-0 bg-black/60 text-white rounded-bl-lg p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
