import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/middleware'

// GET /api/admin/announcements — 获取所有公告
export const GET = withAdmin(async () => {
  const list = await db.announcement.findMany({
    orderBy: { createdAt: 'desc' },
    include: { creator: { select: { id: true, nickname: true, role: true } } },
  })
  return NextResponse.json(list.map(a => ({
    id: a.id,
    title: a.title,
    content: a.content,
    images: JSON.parse(a.images),
    creatorId: a.creatorId,
    creator: a.creator,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  })))
})

// POST /api/admin/announcements — 创建公告
export const POST = withAdmin(async (req, admin) => {
  const body = await req.json()
  const { title, content, images } = body

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: '标题和内容不能为空' }, { status: 400 })
  }

  const ann = await db.announcement.create({
    data: {
      title: title.trim(),
      content: content.trim(),
      images: JSON.stringify(images || []),
      creatorId: admin.id,
    },
  })

  // 给所有正常用户创建通知
  const users = await db.user.findMany({ where: { status: 'NORMAL' }, select: { id: true } })
  await db.notification.createMany({
    data: users.map(u => ({
      userId: u.id,
      type: 'ANNOUNCEMENT',
      title: title.trim(),
      content: content.trim().slice(0, 100),
      relatedId: ann.id,
    }))
  })

  return NextResponse.json({ message: '公告已发布', id: ann.id })
})

// PUT /api/admin/announcements?id=X — 编辑公告
export const PUT = withAdmin(async (req, admin) => {
  const { searchParams } = new URL(req.url)
  const id = Number(searchParams.get('id'))
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  const body = await req.json()
  const { title, content, images } = body

  const ann = await db.announcement.findUnique({ where: { id } })
  if (!ann) return NextResponse.json({ error: '公告不存在' }, { status: 404 })

  // 普通管理员只能编辑自己的
  if (ann.creatorId !== admin.id && admin.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: '无权编辑他人公告' }, { status: 403 })
  }

  const data: Record<string, unknown> = {}
  if (title?.trim()) data.title = title.trim()
  if (content?.trim()) data.content = content.trim()
  if (images) data.images = JSON.stringify(images)

  await db.announcement.update({ where: { id }, data })
  return NextResponse.json({ message: '修改成功' })
})

// DELETE /api/admin/announcements?id=X — 删除公告
export const DELETE = withAdmin(async (req, admin) => {
  const { searchParams } = new URL(req.url)
  const id = Number(searchParams.get('id'))
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  const ann = await db.announcement.findUnique({ where: { id } })
  if (!ann) return NextResponse.json({ error: '公告不存在' }, { status: 404 })

  if (ann.creatorId !== admin.id && admin.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: '无权删除他人公告' }, { status: 403 })
  }

  await db.announcement.delete({ where: { id } })
  return NextResponse.json({ message: '已删除' })
})
