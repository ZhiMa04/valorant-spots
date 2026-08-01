import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/agents?mapId=X — 获取所有特工 + 在指定地图下的点位数
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mapId = searchParams.get('mapId')

  const agents = await db.agent.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  // 如果有 mapId，查询每个特工在该地图下的已通过点位数
  let spotCounts: Record<number, number> = {}
  if (mapId) {
    const mid = Number(mapId)
    const counts = await db.spot.groupBy({
      by: ['agentId'],
      where: {
        mapId: mid,
        status: 'APPROVED',
      },
      _count: { id: true },
    })
    spotCounts = Object.fromEntries(counts.map(c => [c.agentId, c._count.id]))
  }

  const result = agents.map(a => ({
    id: a.id,
    name: a.name,
    role: a.role,
    iconUrl: a.iconUrl,
    sortOrder: a.sortOrder,
    spotCount: spotCounts[a.id] ?? 0,
  }))

  return NextResponse.json(result)
}
