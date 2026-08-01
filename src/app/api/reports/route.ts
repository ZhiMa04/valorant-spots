import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'

// POST /api/reports — 举报点位
// 24小时内不可重复举报同一点位
export const POST = withAuth(async (req, user) => {
  try {
    const body = await req.json()
    const { spotId, reason } = body

    if (!spotId || !reason) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 })
    }

    const validReasons = ['OUTDATED', 'MISLEADING', 'INAPPROPRIATE', 'OTHER']
    // OTHER 类型可以带自定义原因（格式：OTHER:用户填写的内容）
    const isValidReason = validReasons.some(r => reason.startsWith(r))
    if (!isValidReason) {
      return NextResponse.json({ error: '举报原因无效' }, { status: 400 })
    }

    const sid = Number(spotId)

    // 验证点位存在
    const spot = await db.spot.findUnique({ where: { id: sid } })
    if (!spot) {
      return NextResponse.json({ error: '点位不存在' }, { status: 404 })
    }

    // 不能举报自己的点位
    if (spot.creatorId === user.id) {
      return NextResponse.json({ error: '不能举报自己的点位' }, { status: 400 })
    }

    // ========== 24小时去重 ==========
    const recentReport = await db.report.findFirst({
      where: {
        reporterId: user.id,
        spotId: sid,
        createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    })
    if (recentReport) {
      return NextResponse.json(
        { error: '24小时内已举报过此点位，请等待处理' },
        { status: 429 }
      )
    }

    // ========== 创建举报 ==========
    await db.report.create({
      data: {
        reporterId: user.id,
        spotId: sid,
        reason,
      }
    })

    return NextResponse.json({ message: '举报已提交，等待管理员处理' })
  } catch (error) {
    console.error('举报失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
})
