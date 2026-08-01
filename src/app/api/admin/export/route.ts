import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/middleware'

// GET /api/admin/export — 导出所有点位数据（JSON）
export const GET = withAdmin(async () => {
  const spots = await db.spot.findMany({
    include: {
      creator: { select: { id: true, nickname: true, role: true } },
      map: { select: { id: true, name: true } },
      agent: { select: { id: true, name: true } },
    },
    orderBy: { id: 'asc' },
  })

  const maps = await db.gameMap.findMany({ orderBy: { id: 'asc' } })
  const agents = await db.agent.findMany({ orderBy: { id: 'asc' } })

  const data = {
    exportDate: new Date().toISOString(),
    maps: maps.map(m => ({ id: m.id, name: m.name, imageUrl: m.imageUrl, sortOrder: m.sortOrder })),
    agents: agents.map(a => ({ id: a.id, name: a.name, role: a.role, iconUrl: a.iconUrl, sortOrder: a.sortOrder })),
    spots: spots.map(s => ({
      id: s.id,
      title: s.title,
      content: s.content,
      faction: s.faction,
      markerImages: JSON.parse(s.markerImages),
      effectImages: JSON.parse(s.effectImages),
      status: s.status,
      likeCount: s.likeCount,
      dislikeCount: s.dislikeCount,
      createdAt: s.createdAt.toISOString(),
      creator: s.creator,
      map: s.map,
      agent: s.agent,
    })),
  }

  return NextResponse.json(data)
})
