import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { withAuth, withSuperAdmin } from '@/lib/middleware'
import { getUserStats } from '@/lib/userStats'

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

  const currentUser = await getCurrentUser()
  let userAttitude: 'LIKE' | 'DISLIKE' | null = null
  if (currentUser) {
    const attitude = await db.likeDislike.findUnique({
      where: { spotId_userId: { spotId, userId: currentUser.id } },
    })
    userAttitude = attitude?.type ?? null
  }

  const creatorStats = await getUserStats(spot.creatorId)

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
    creator: {
      ...spot.creator,
      uploadCount: creatorStats.uploadCount,
      likeCount: creatorStats.likeCount,
    },
    map: spot.map,
    agent: spot.agent,
    isReported: spot.reports.length > 0,
    userAttitude,
    canEdit: currentUser?.id === spot.creatorId || currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN',
    canDelete: currentUser?.role === 'SUPER_ADMIN',
  })
}

// PATCH /api/spots/[id] — 编辑点位（创建者或管理员）
export const PATCH = withAuth(async (req, user) => {
  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const id = Number(pathParts[pathParts.length - 1])

    const body = await req.json()
    const { title, content, markerImages, effectImages, mapId, agentId, faction } = body

    const spot = await db.spot.findUnique({ where: { id } })
    if (!spot) return NextResponse.json({ error: '点位不存在' }, { status: 404 })

    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
    if (spot.creatorId !== user.id && !isAdmin) {
      return NextResponse.json({ error: '无权编辑此点位' }, { status: 403 })
    }

    const data: Record<string, unknown> = {}
    if (title?.trim()) data.title = title.trim()
    if (content !== undefined) data.content = content?.trim() || spot.content
    if (markerImages !== undefined) data.markerImages = JSON.stringify(markerImages)
    if (effectImages !== undefined) data.effectImages = JSON.stringify(effectImages)
    if (mapId) data.mapId = Number(mapId)
    if (agentId) data.agentId = Number(agentId)
    if (faction === 'ATTACK' || faction === 'DEFENSE') data.faction = faction

    await db.spot.update({ where: { id }, data })
    return NextResponse.json({ message: '修改成功' })
  } catch (error) {
    console.error('编辑点位失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
})

// DELETE /api/spots/[id] — 删除点位（仅高级管理员，硬删除，不计入统计）
export const DELETE = withSuperAdmin(async (req, admin) => {
  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const id = Number(pathParts[pathParts.length - 1])

    const spot = await db.spot.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, nickname: true } },
        map: { select: { name: true } },
        agent: { select: { name: true } },
      },
    })
    if (!spot) return NextResponse.json({ error: '点位不存在' }, { status: 404 })

    // 事务：先删关联数据，再删点位
    await db.$transaction([
      db.comment.deleteMany({ where: { spotId: id } }),
      db.likeDislike.deleteMany({ where: { spotId: id } }),
      db.report.deleteMany({ where: { spotId: id } }),
      db.notification.deleteMany({ where: { relatedId: id, type: 'SPOT_REJECTED' } }),
      db.spot.delete({ where: { id } }),
    ])

    // 审核日志
    await db.auditLog.create({
      data: {
        handlerId: admin.id,
        action: 'SPOT_AUDIT',
        targetId: id,
        result: 'DELETED',
        detail: `删除点位「${spot.title}」(创建者：${spot.creator.nickname} #${spot.creator.id}，地图：${spot.map.name}，特工：${spot.agent.name})`,
      }
    })

    return NextResponse.json({ message: '点位已删除' })
  } catch (error) {
    console.error('删除点位失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
})
