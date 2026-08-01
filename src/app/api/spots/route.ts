import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'

// GET /api/spots?mapId=X&agentId=Y&faction=Z — 获取点位列表（按获赞数降序）
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mapId = searchParams.get('mapId')
  const agentId = searchParams.get('agentId')
  const faction = searchParams.get('faction')

  const where: Record<string, unknown> = { status: 'APPROVED' }
  if (mapId) where.mapId = Number(mapId)
  if (agentId) where.agentId = Number(agentId)
  if (faction) where.faction = faction

  const spots = await db.spot.findMany({
    where,
    orderBy: { likeCount: 'desc' },
    include: {
      creator: {
        select: { id: true, nickname: true, role: true }
      },
      reports: {
        where: { status: 'PENDING' },
        select: { id: true },
      },
    },
  })

  const result = spots.map(s => ({
    id: s.id,
    title: s.title,
    faction: s.faction,
    status: s.status,
    likeCount: s.likeCount,
    dislikeCount: s.dislikeCount,
    createdAt: s.createdAt,
    creatorId: s.creatorId,
    creator: s.creator,
    isReported: s.reports.length > 0,
  }))

  return NextResponse.json(result)
}

// POST /api/spots — 创建点位（会员无需审核，普通用户需审核）
export const POST = withAuth(async (req, user) => {
  try {
    const body = await req.json()
    const { mapId, agentId, faction, title, content, markerImages, effectImages } = body

    // ========== 输入校验 ==========
    if (!mapId || !agentId || !faction || !title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }
    if (!['ATTACK', 'DEFENSE'].includes(faction)) {
      return NextResponse.json({ error: '阵营参数无效' }, { status: 400 })
    }
    if (!Array.isArray(markerImages) || markerImages.length === 0) {
      return NextResponse.json({ error: '至少需要一张描点图' }, { status: 400 })
    }
    if (!Array.isArray(effectImages) || effectImages.length === 0) {
      return NextResponse.json({ error: '至少需要一张效果图' }, { status: 400 })
    }

    // ========== 验证地图和特工存在 ==========
    const [map, agent] = await Promise.all([
      db.gameMap.findUnique({ where: { id: Number(mapId) } }),
      db.agent.findUnique({ where: { id: Number(agentId) } }),
    ])
    if (!map) return NextResponse.json({ error: '地图不存在' }, { status: 400 })
    if (!agent) return NextResponse.json({ error: '特工不存在' }, { status: 400 })

    // ========== 会员及以上无需审核 ==========
    const isMember = user.role === 'MEMBER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
    const status = isMember ? 'APPROVED' : 'PENDING'

    // ========== 创建点位 ==========
    const spot = await db.spot.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        faction,
        markerImages: JSON.stringify(markerImages),
        effectImages: JSON.stringify(effectImages),
        status,
        creatorId: user.id,
        mapId: Number(mapId),
        agentId: Number(agentId),
      },
    })

    // ========== 更新用户发布数 ==========
    await db.user.update({
      where: { id: user.id },
      data: { uploadCount: { increment: 1 } },
    })

    return NextResponse.json({
      message: isMember ? '发布成功' : '发布成功，等待审核',
      spotId: spot.id,
      status,
    })
  } catch (error) {
    console.error('创建点位失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
})
