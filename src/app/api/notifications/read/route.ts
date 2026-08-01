import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'

// POST /api/notifications/read?id=X — 标记通知为已读
export const POST = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url)
  const id = Number(searchParams.get('id'))
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  const notif = await db.notification.findUnique({ where: { id } })
  if (!notif) return NextResponse.json({ error: '通知不存在' }, { status: 404 })
  if (notif.userId !== user.id) return NextResponse.json({ error: '无权操作' }, { status: 403 })

  await db.notification.update({ where: { id }, data: { isRead: true } })
  return NextResponse.json({ message: '已标为已读' })
})
