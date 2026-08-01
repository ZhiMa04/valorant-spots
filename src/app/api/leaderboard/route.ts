import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/leaderboard?type=uploads|likes — 贡献榜
// 实时从已通过(APPROVED)的点位计算，被删除/拒绝的点位不计入
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'uploads'

  // 按创建者分组统计已通过的点位
  const stats = await db.spot.groupBy({
    by: ['creatorId'],
    where: { status: 'APPROVED' },
    _count: { id: true },
    _sum: { likeCount: true },
  })

  // 获取用户信息
  const userIds = stats.map(s => s.creatorId)
  const users = await db.user.findMany({
    where: { id: { in: userIds }, status: 'NORMAL' },
    select: { id: true, nickname: true, role: true },
  })

  const userMap = new Map(users.map(u => [u.id, u]))

  const result = stats
    .map(s => {
      const u = userMap.get(s.creatorId)
      if (!u) return null
      const value = type === 'likes'
        ? (s._sum.likeCount || 0)
        : s._count.id
      return {
        id: u.id,
        nickname: u.nickname,
        role: u.role,
        value,
      }
    })
    .filter((x): x is { id: number; nickname: string; role: string; value: number } => x !== null && x.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  return NextResponse.json(result)
}
