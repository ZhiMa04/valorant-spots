import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/middleware'

// GET /api/admin/spots/pending — 获取待审核点位
export async function GET_handler(req: Request) {
  const spots = await db.spot.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    include: {
      creator: { select: { id: true, nickname: true, role: true } },
      map: true,
      agent: true,
    },
  })

  return NextResponse.json(spots.map(s => ({
    id: s.id,
    title: s.title,
    content: s.content,
    faction: s.faction,
    markerImages: JSON.parse(s.markerImages),
    effectImages: JSON.parse(s.effectImages),
    status: s.status,
    createdAt: s.createdAt,
    creatorId: s.creatorId,
    creator: s.creator,
    map: s.map,
    agent: s.agent,
  })))
}

export const GET = withAdmin(GET_handler)

// POST /api/admin/spots/review?id=X — 审核点位（通过/拒绝）
export const POST = withAdmin(async (req, admin) => {
  const { searchParams } = new URL(req.url)
  const id = Number(searchParams.get('id'))
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  const body = await req.json()
  const { action, reason } = body // action: 'approve' | 'reject'

  const spot = await db.spot.findUnique({ where: { id } })
  if (!spot) return NextResponse.json({ error: '点位不存在' }, { status: 404 })

  // 只能审核待审核的
  if (spot.status !== 'PENDING' && spot.status !== 'REJECTED') {
    return NextResponse.json({ error: '该点位不在待审核状态' }, { status: 400 })
  }

  if (action === 'approve') {
    await db.spot.update({ where: { id }, data: { status: 'APPROVED', rejectReason: null } })
    await db.auditLog.create({
      data: { handlerId: admin.id, action: 'SPOT_AUDIT', targetId: id, result: 'APPROVED' }
    })
    return NextResponse.json({ message: '审核通过' })
  } else if (action === 'reject') {
    if (!reason?.trim()) {
      return NextResponse.json({ error: '请填写拒绝原因' }, { status: 400 })
    }
    await db.spot.update({ where: { id }, data: { status: 'REJECTED', rejectReason: reason.trim() } })
    await db.auditLog.create({
      data: { handlerId: admin.id, action: 'SPOT_AUDIT', targetId: id, result: `REJECTED: ${reason.trim()}` }
    })
    // 通知用户
    await db.notification.create({
      data: {
        userId: spot.creatorId,
        type: 'SPOT_REJECTED',
        title: '点位未通过审核',
        content: `您的点位"${spot.title}"未通过审核，原因：${reason.trim()}`,
        relatedId: id,
      }
    })
    return NextResponse.json({ message: '已拒绝并通知用户' })
  }

  return NextResponse.json({ error: '无效操作' }, { status: 400 })
})
