import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'

// DELETE /api/comments/[id] — 删除评论
// 评论者本人或管理员可删除（逻辑删除：isDeleted = true）
export const DELETE = withAuth(async (req, user) => {
  try {
    // 从 URL 提取 id
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const id = Number(pathParts[pathParts.length - 1])

    const comment = await db.comment.findUnique({ where: { id } })
    if (!comment) {
      return NextResponse.json({ error: '评论不存在' }, { status: 404 })
    }

    // 权限检查：本人或管理员
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
    if (comment.userId !== user.id && !isAdmin) {
      return NextResponse.json({ error: '无权删除此评论' }, { status: 403 })
    }

    // 逻辑删除
    await db.comment.update({
      where: { id },
      data: { isDeleted: true },
    })

    return NextResponse.json({ message: '评论已删除' })
  } catch (error) {
    console.error('删除评论失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
})
