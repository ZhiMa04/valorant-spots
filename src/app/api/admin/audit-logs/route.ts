import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/middleware'

// GET /api/admin/audit-logs — 获取审核操作记录（24小时内）
export const GET = withAdmin(async () => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const logs = await db.auditLog.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    include: {
      handler: { select: { id: true, nickname: true, role: true } },
    },
  })

  return NextResponse.json(logs.map(l => ({
    id: l.id,
    handlerId: l.handlerId,
    handler: l.handler,
    action: l.action,
    targetId: l.targetId,
    result: l.result,
    createdAt: l.createdAt,
  })))
})
