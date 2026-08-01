import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/announcements — 获取所有公告（公开，无需登录）
// 返回创建人信息：昵称、ID、身份
export async function GET() {
  const list = await db.announcement.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      creator: {
        select: { id: true, nickname: true, role: true }
      },
    },
  })

  return NextResponse.json(list.map(a => ({
    id: a.id,
    title: a.title,
    content: a.content,
    images: JSON.parse(a.images),
    createdAt: a.createdAt,
    creator: a.creator ? {
      id: a.creator.id,
      nickname: a.creator.nickname,
      role: a.creator.role,
    } : null,
  })))
}
