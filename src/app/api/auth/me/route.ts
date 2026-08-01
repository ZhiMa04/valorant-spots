import { NextResponse } from 'next/server'
import { getCurrentUser, getCsrfToken } from '@/lib/auth'

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

  return NextResponse.json({
    user: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      role: user.role,
      status: user.status,
      uploadCount: user.uploadCount,
      likeCount: user.likeCount,
      lastNicknameChange: user.lastNicknameChange,
      createdAt: user.createdAt,
    },
    csrfToken,
  })
}
