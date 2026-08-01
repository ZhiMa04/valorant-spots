import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { put } from '@vercel/blob'

// POST /api/upload — 上传图片到 Vercel Blob 云存储
export const POST = withAuth(async (req, user) => {
  try {
    const formData = await req.formData()
    const files = formData.getAll('images')

    if (files.length === 0) {
      return NextResponse.json({ error: '请选择至少一张图片' }, { status: 400 })
    }

    const savedPaths: string[] = []

    for (const file of files) {
      if (!(file instanceof File)) continue
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: '只能上传图片文件' }, { status: 400 })
      }

      // 限制 5MB
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: '图片大小不能超过5MB' }, { status: 400 })
      }

      // 生成唯一文件名
      const ext = file.name.split('.').pop() || 'png'
      const filename = `${user.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

      // 上传到 Vercel Blob
      const blob = await put(filename, file, {
        access: 'public',
        contentType: file.type,
      })

      savedPaths.push(blob.url)
    }

    return NextResponse.json({ paths: savedPaths })
  } catch (error) {
    console.error('上传失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
})
