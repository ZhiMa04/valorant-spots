import { NextResponse } from 'next/server'
import { clearSession } from '@/lib/auth'

// POST /api/auth/logout — 退出登录
export async function POST() {
  await clearSession()
  return NextResponse.json({ message: '已退出登录' })
}
