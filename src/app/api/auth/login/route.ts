import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createSession } from '@/lib/auth'
import { validate, loginSchema } from '@/lib/validation'

// POST /api/auth/login — 用户登录
// 表单：phone（手机号）+ password
export async function POST(req: Request) {
  try {
    const body = await req.json()

    // ========== Zod 输入验证 ==========
    const result = validate(loginSchema, body)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    const { phone, password } = result.data

    // ========== 按手机号查找用户 ==========
    const user = await db.user.findUnique({ where: { phone } })
    if (!user) {
      return NextResponse.json({ error: '手机号或密码错误' }, { status: 401 })
    }

    // ========== 检查拉黑状态 ==========
    if (user.status === 'BLOCKED') {
      return NextResponse.json({ error: '账号已被拉黑，请联系管理员' }, { status: 403 })
    }

    // ========== 验证密码 ==========
    if (!verifyPassword(password, user.salt, user.passwordHash)) {
      return NextResponse.json({ error: '手机号或密码错误' }, { status: 401 })
    }

    // ========== 创建会话 ==========
    await createSession(user.id)

    return NextResponse.json({
      message: '登录成功',
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
      }
    })
  } catch (error) {
    console.error('登录失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
