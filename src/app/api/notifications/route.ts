import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'

// GET /api/notifications — 获取当前用户的通知列表（含创建者信息）
export const GET = withAuth(async (req, user) => {
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      creator: {
        select: { id: true, nickname: true, role: true }
      },
    },
  })

  // 对 ANNOUNCEMENT 类型，批量查关联公告的图片
  const annIds = notifications
    .filter(n => n.type === 'ANNOUNCEMENT' && n.relatedId)
    .map(n => n.relatedId as number)

  const announcements = annIds.length > 0
    ? await db.announcement.findMany({
        where: { id: { in: annIds } },
        select: { id: true, images: true },
      })
    : []

  const annImageMap = new Map(
    announcements.map(a => [a.id, JSON.parse(a.images) as string[]])
  )

  const unreadCount = await db.notification.count({
    where: { userId: user.id, isRead: false },
  })

  return NextResponse.json({
    notifications: notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      content: n.content,
      isRead: n.isRead,
      relatedId: n.relatedId,
      images: n.type === 'ANNOUNCEMENT' && n.relatedId
        ? (annImageMap.get(n.relatedId) || [])
        : [],
      createdAt: n.createdAt,
      creator: n.creator ? {
        id: n.creator.id,
        nickname: n.creator.nickname,
        role: n.creator.role,
      } : null,
    })),
    unreadCount,
  })
})
