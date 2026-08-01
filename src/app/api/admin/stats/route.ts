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

  // 获取所有会员和管理员的名称和ID
  const membersAndAdmins = await db.user.findMany({
    where: { role: { in: ['MEMBER', 'ADMIN', 'SUPER_ADMIN'] }, status: 'NORMAL' },
    select: { id: true, nickname: true, role: true, uploadCount: true, likeCount: true },
    orderBy: [{ role: 'desc' }, { id: 'asc' }],
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
