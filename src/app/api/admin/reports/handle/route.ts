import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/middleware'

// GET /api/admin/reports/pending — 获取待处理举报
export const GET = withAdmin(async () => {
  const reports = await db.report.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    include: {
      reporter: { select: { id: true, nickname: true } },
      spot: {
        select: {
          id: true, title: true, content: true, faction: true,
          markerImages: true, effectImages: true, status: true,
          createdAt: true,
          creator: { select: { id: true, nickname: true, role: true } },
          map: { select: { id: true, name: true } },
          agent: { select: { id: true, name: true } },
        }
      },
    },
  })

  return NextResponse.json(reports.map(r => ({
    id: r.id,
    reason: r.reason,
    status: r.status,
    createdAt: r.createdAt,
    reporterId: r.reporterId,
    reporter: r.reporter,
    spotId: r.spotId,
    spot: r.spot ? {
      ...r.spot,
      markerImages: JSON.parse(r.spot.markerImages as string),
      effectImages: JSON.parse(r.spot.effectImages as string),
    } : null,
  })))
})

// POST /api/admin/reports/handle?id=X — 处理举报（确认/删除点位）
export const POST = withAdmin(async (req, admin) => {
  const { searchParams } = new URL(req.url)
  const id = Number(searchParams.get('id'))
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  const body = await req.json()
  const { action } = body // action: 'confirm' | 'delete'

  const report = await db.report.findUnique({ where: { id }, include: { spot: true } })
  if (!report) return NextResponse.json({ error: '举报不存在' }, { status: 404 })
  if (report.status !== 'PENDING') return NextResponse.json({ error: '该举报已处理' }, { status: 400 })

  if (action === 'confirm') {
    // 确认无误，保留点位
    await db.report.update({
      where: { id },
      data: { status: 'CONFIRMED', handlerId: admin.id, handledAt: new Date() },
    })
    await db.auditLog.create({
      data: { handlerId: admin.id, action: 'REPORT_AUDIT', targetId: id, result: 'CONFIRMED' }
    })
    return NextResponse.json({ message: '举报已确认，点位保留' })
  } else if (action === 'delete') {
    // 删除点位
    if (report.spot) {
      await db.spot.update({ where: { id: report.spotId }, data: { status: 'REJECTED', rejectReason: '因举报被删除' } })
    }
    await db.report.update({
      where: { id },
      data: { status: 'DELETED', handlerId: admin.id, handledAt: new Date() },
    })
    await db.auditLog.create({
      data: { handlerId: admin.id, action: 'REPORT_AUDIT', targetId: id, result: 'DELETED' }
    })
    return NextResponse.json({ message: '点位已删除' })
  }

  return NextResponse.json({ error: '无效操作' }, { status: 400 })
})
