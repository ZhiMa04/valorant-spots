'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X } from 'lucide-react'

interface DropZoneProps {
  label: string
  onUpload: (paths: string[]) => void
  uploadedPaths: string[]
  onRemove: (index: number) => void
}

// 通用拖拽上传组件：支持拖拽和点击选择
export function DropZone({ label, onUpload, uploadedPaths, onRemove }: DropZoneProps) {
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

    // 检查大小
    const oversized = fileArray.find(f => f.size > 5 * 1024 * 1024)
    if (oversized) {
      setError(`${oversized.name} 超过5MB`)
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      fileArray.forEach(f => formData.append('images', f))

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
  }, [onUpload])

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
            上传中...
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
              <img src={path} alt="" className="w-full h-full object-cover" />
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
