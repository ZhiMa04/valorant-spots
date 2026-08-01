import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'

// GET /api/comments?spotId=X — 获取评论树（无限嵌套）
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const spotId = Number(searchParams.get('spotId'))

  if (!spotId) {
    return NextResponse.json({ error: '缺少 spotId' }, { status: 400 })
  }

  // 查询该点位的所有评论
  const comments = await db.comment.findMany({
    where: { spotId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: { id: true, nickname: true, role: true }
      },
      replyToUser: {
        select: { id: true, nickname: true }
      },
    },
  })

  // 构建评论树（parentId 为 null 的是一级评论）
  const commentMap = new Map<number, any>()
  const roots: any[] = []

  // 先建索引
  for (const c of comments) {
    commentMap.set(c.id, {
      id: c.id,
      content: c.content,
      parentId: c.parentId,
      replyToUserId: c.replyToUserId,
      replyToUser: c.replyToUser,
      isDeleted: c.isDeleted,
      createdAt: c.createdAt,
      spotId: c.spotId,
      userId: c.userId,
      user: c.user,
      replies: [],
    })
  }

  // 再建父子关系
  for (const c of comments) {
    const node = commentMap.get(c.id)!
    if (c.parentId && commentMap.has(c.parentId)) {
      commentMap.get(c.parentId)!.replies.push(node)
    } else {
      roots.push(node)
    }
  }

  return NextResponse.json(roots)
}

// POST /api/comments — 创建评论
export const POST = withAuth(async (req, user) => {
  try {
    const body = await req.json()
    const { spotId, content, parentId, replyToUserId } = body

    if (!spotId || !content?.trim()) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    // 验证点位存在
    const spot = await db.spot.findUnique({ where: { id: Number(spotId) } })
    if (!spot) {
      return NextResponse.json({ error: '点位不存在' }, { status: 404 })
    }

    // 如果有 parentId，验证父评论存在且属于同一点位
    if (parentId) {
      const parent = await db.comment.findUnique({ where: { id: Number(parentId) } })
      if (!parent || parent.spotId !== Number(spotId)) {
        return NextResponse.json({ error: '父评论无效' }, { status: 400 })
      }
    }

    const comment = await db.comment.create({
      data: {
        spotId: Number(spotId),
        userId: user.id,
        content: content.trim(),
        parentId: parentId ? Number(parentId) : null,
        replyToUserId: replyToUserId ? Number(replyToUserId) : null,
      },
      include: {
        user: { select: { id: true, nickname: true, role: true } },
        replyToUser: { select: { id: true, nickname: true } },
      },
    })

    return NextResponse.json({
      id: comment.id,
      content: comment.content,
      parentId: comment.parentId,
      replyToUserId: comment.replyToUserId,
      replyToUser: comment.replyToUser,
      isDeleted: comment.isDeleted,
      createdAt: comment.createdAt,
      spotId: comment.spotId,
      userId: comment.userId,
      user: comment.user,
      replies: [],
    })
  } catch (error) {
    console.error('创建评论失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
})
