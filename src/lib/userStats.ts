import { db } from './db'

// 实时计算用户的已通过点位数和获赞总数（被删除/拒绝的点位不计入）
export async function getUserStats(userId: number): Promise<{ uploadCount: number; likeCount: number }> {
  const stats = await db.spot.aggregate({
    where: { creatorId: userId, status: 'APPROVED' },
    _count: { id: true },
    _sum: { likeCount: true },
  })
  return {
    uploadCount: stats._count.id || 0,
    likeCount: stats._sum.likeCount || 0,
  }
}

// 批量计算多个用户的统计（减少查询次数）
export async function getBatchUserStats(userIds: number[]): Promise<Map<number, { uploadCount: number; likeCount: number }>> {
  if (userIds.length === 0) return new Map()
  const stats = await db.spot.groupBy({
    by: ['creatorId'],
    where: { creatorId: { in: userIds }, status: 'APPROVED' },
    _count: { id: true },
    _sum: { likeCount: true },
  })
  const map = new Map<number, { uploadCount: number; likeCount: number }>()
  for (const s of stats) {
    map.set(s.creatorId, {
      uploadCount: s._count.id || 0,
      likeCount: s._sum.likeCount || 0,
    })
  }
  return map
}
