import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/leaderboard?type=uploads|likes — 贡献榜
// type=uploads: 按发布点位数排序
// type=likes: 按获赞数排序
// 只返回前10名
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'uploads'

  const users = await db.user.findMany({
    where: { status: 'NORMAL' },
    select: {
      id: true,
      nickname: true,
      role: true,
      uploadCount: true,
      likeCount: true,
    },
    orderBy: type === 'likes' ? { likeCount: 'desc' } : { uploadCount: 'desc' },
    take: 10,
  })

  const result = users
    .filter(u => (type === 'likes' ? u.likeCount : u.uploadCount) > 0)
    .map(u => ({
      id: u.id,
      nickname: u.nickname,
      role: u.role,
      value: type === 'likes' ? u.likeCount : u.uploadCount,
    }))

  return NextResponse.json(result)
}
