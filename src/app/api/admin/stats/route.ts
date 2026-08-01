import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/middleware'

// GET /api/admin/stats — 网站信息统计
export const GET = withAdmin(async () => {
  const [totalUsers, normalUsers, members, admins, totalSpots, pendingSpots, approvedSpots, rejectedSpots, pendingReports] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: 'USER', status: 'NORMAL' } }),
    db.user.count({ where: { role: 'MEMBER', status: 'NORMAL' } }),
    db.user.count({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, status: 'NORMAL' } }),
    db.spot.count(),
    db.spot.count({ where: { status: 'PENDING' } }),
    db.spot.count({ where: { status: 'APPROVED' } }),
    db.spot.count({ where: { status: 'REJECTED' } }),
    db.report.count({ where: { status: 'PENDING' } }),
  ])

  // 获取所有会员和管理员，实时计算已通过点位数和获赞数
  const membersAndAdminsRaw = await db.user.findMany({
    where: { role: { in: ['MEMBER', 'ADMIN', 'SUPER_ADMIN'] }, status: 'NORMAL' },
    select: { id: true, nickname: true, role: true },
    orderBy: [{ role: 'desc' }, { id: 'asc' }],
  })

  // 实时统计每个用户的已通过点位数和获赞总数
  const spotStats = await db.spot.groupBy({
    by: ['creatorId'],
    where: { status: 'APPROVED', creatorId: { in: membersAndAdminsRaw.map(u => u.id) } },
    _count: { id: true },
    _sum: { likeCount: true },
  })
  const statMap = new Map(spotStats.map(s => [s.creatorId, s]))

  const membersAndAdmins = membersAndAdminsRaw.map(u => {
    const stat = statMap.get(u.id)
    return {
      ...u,
      uploadCount: stat?._count.id || 0,
      likeCount: stat?._sum.likeCount || 0,
    }
  })

  return NextResponse.json({
    totalUsers,
    normalUsers,
    members,
    admins,
    totalSpots,
    pendingSpots,
    approvedSpots,
    rejectedSpots,
    pendingReports,
    membersAndAdmins,
  })
})
