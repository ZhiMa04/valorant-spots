import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/spots/[id] — 获取点位详情
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const spotId = Number(id)

  const spot = await db.spot.findUnique({
    where: { id: spotId },
    include: {
      creator: {
        select: {
          id: true, nickname: true, role: true,
          uploadCount: true, likeCount: true, createdAt: true,
        }
      },
      map: true,
      agent: true,
      reports: {
        where: { status: 'PENDING' },
        select: { id: true },
      },
    },
  })

  if (!spot) {
    return NextResponse.json({ error: '点位不存在' }, { status: 404 })
  }

  // 获取当前用户的态度（如果已登录）
  const currentUser = await getCurrentUser()
  let userAttitude: 'LIKE' | 'DISLIKE' | null = null
  if (currentUser) {
    const attitude = await db.likeDislike.findUnique({
      where: { spotId_userId: { spotId, userId: currentUser.id } },
    })
    userAttitude = attitude?.type ?? null
  }

  return NextResponse.json({
    id: spot.id,
    title: spot.title,
    content: spot.content,
    faction: spot.faction,
    markerImages: JSON.parse(spot.markerImages),
    effectImages: JSON.parse(spot.effectImages),
    status: spot.status,
    rejectReason: spot.rejectReason,
    likeCount: spot.likeCount,
    dislikeCount: spot.dislikeCount,
    createdAt: spot.createdAt,
    creatorId: spot.creatorId,
    mapId: spot.mapId,
    agentId: spot.agentId,
    creator: spot.creator,
    map: spot.map,
    agent: spot.agent,
    isReported: spot.reports.length > 0,
    userAttitude,
    canEdit: currentUser?.id === spot.creatorId || currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN',
  })
}
