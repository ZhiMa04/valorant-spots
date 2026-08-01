import { NextResponse } from 'next/server'
import { getCurrentUser, getCsrfToken } from '@/lib/auth'
import { getUserStats } from '@/lib/userStats'

// GET /api/auth/me — 获取当前登录用户信息 + CSRF token
export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ user: null, csrfToken: null })
  }

  if (user.status === 'BLOCKED') {
    return NextResponse.json({ user: null, csrfToken: null, error: '账号已被拉黑' })
  }

  const csrfToken = await getCsrfToken()
  const stats = await getUserStats(user.id)

  return NextResponse.json({
    user: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      role: user.role,
      status: user.status,
      uploadCount: stats.uploadCount,
      likeCount: stats.likeCount,
      lastNicknameChange: user.lastNicknameChange,
      createdAt: user.createdAt,
    },
    csrfToken,
  })
}
