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
