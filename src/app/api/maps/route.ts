import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/maps — 获取所有地图 + 各自点位数
export async function GET() {
  const maps = await db.gameMap.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: {
          spots: { where: { status: 'APPROVED' } }
        }
      }
    }
  })

  const result = maps.map(m => ({
    id: m.id,
    name: m.name,
    imageUrl: m.imageUrl,
    sortOrder: m.sortOrder,
    spotCount: m._count.spots,
  }))

  return NextResponse.json(result)
}
