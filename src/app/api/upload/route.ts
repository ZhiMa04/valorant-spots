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

    // 验证所有文件
    for (const file of files) {
      if (!(file instanceof File)) continue
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: '只能上传图片文件' }, { status: 400 })
      }
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: '图片大小不能超过5MB' }, { status: 400 })
      }
    }

    // 并行上传所有文件
    const uploadResults = await Promise.all(
      files.filter((f): f is File => f instanceof File).map(async (file) => {
        const ext = file.name.split('.').pop() || 'png'
        const filename = `${user.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

        const blob = await put(filename, file, {
          access: 'public',
          contentType: file.type,
          token: 'vercel_blob_rw_XnZFo3R5kxDwbWzR_2asS4naFd1IsCISHNu8MnDDY4YCuoe',
          storeId: 'store_XnZFo3R5kxDwbWzR',
        })

        return blob.url
      })
    )

    return NextResponse.json({ paths: uploadResults })
  } catch (error) {
    console.error('上传失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
})
