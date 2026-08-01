import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'

// POST /api/likes — 点赞/点踩切换
// 逻辑A：同一用户对同一点位只能有一个态度
// - 无态度 → 点赞/点踩：创建记录，对应计数+1
// - 相同态度 → 取消：删除记录，对应计数-1
// - 不同态度 → 覆盖：更新记录，旧计数-1，新计数+1
export const POST = withAuth(async (req, user) => {
  try {
    const body = await req.json()
    const { spotId, type } = body

    if (!spotId || !type) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 })
    }
    if (!['LIKE', 'DISLIKE'].includes(type)) {
      return NextResponse.json({ error: '类型无效' }, { status: 400 })
    }

    const sid = Number(spotId)

    // 验证点位存在
    const spot = await db.spot.findUnique({ where: { id: sid } })
    if (!spot) {
      return NextResponse.json({ error: '点位不存在' }, { status: 404 })
    }

    // 查找已有态度
    const existing = await db.likeDislike.findUnique({
      where: { spotId_userId: { spotId: sid, userId: user.id } },
    })

    if (!existing) {
      // ========== 无态度 → 新增 ==========
      await db.likeDislike.create({
        data: { spotId: sid, userId: user.id, type }
      })
      if (type === 'LIKE') {
        await db.spot.update({ where: { id: sid }, data: { likeCount: { increment: 1 } } })
        await db.user.update({ where: { id: spot.creatorId }, data: { likeCount: { increment: 1 } } })
      } else {
        await db.spot.update({ where: { id: sid }, data: { dislikeCount: { increment: 1 } } })
      }
    } else if (existing.type === type) {
      // ========== 相同态度 → 取消 ==========
      await db.likeDislike.delete({ where: { id: existing.id } })
      if (type === 'LIKE') {
        await db.spot.update({ where: { id: sid }, data: { likeCount: { decrement: 1 } } })
        await db.user.update({ where: { id: spot.creatorId }, data: { likeCount: { decrement: 1 } } })
      } else {
        await db.spot.update({ where: { id: sid }, data: { dislikeCount: { decrement: 1 } } })
      }
    } else {
      // ========== 不同态度 → 覆盖 ==========
      await db.likeDislike.update({
        where: { id: existing.id },
        data: { type }
      })
      if (type === 'LIKE') {
        // 之前是 DISLIKE → LIKE
        await db.spot.update({ where: { id: sid }, data: { likeCount: { increment: 1 }, dislikeCount: { decrement: 1 } } })
        await db.user.update({ where: { id: spot.creatorId }, data: { likeCount: { increment: 1 } } })
      } else {
        // 之前是 LIKE → DISLIKE
        await db.spot.update({ where: { id: sid }, data: { likeCount: { decrement: 1 }, dislikeCount: { increment: 1 } } })
        await db.user.update({ where: { id: spot.creatorId }, data: { likeCount: { decrement: 1 } } })
      }
    }

    // 返回最新计数
    const updated = await db.spot.findUnique({
      where: { id: sid },
      select: { likeCount: true, dislikeCount: true }
    })

    return NextResponse.json({
      likeCount: updated?.likeCount ?? 0,
      dislikeCount: updated?.dislikeCount ?? 0,
      userAttitude: existing?.type === type ? null : type,
    })
  } catch (error) {
    console.error('点赞/点踩失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
})
