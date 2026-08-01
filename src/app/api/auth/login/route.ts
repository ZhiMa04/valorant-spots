import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createSession } from '@/lib/auth'
import { validate, loginSchema } from '@/lib/validation'

const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 15

// POST /api/auth/login — 用户登录（含限速防护）
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = validate(loginSchema, body)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    const { phone, password } = result.data

    const user = await db.user.findUnique({ where: { phone } })

    // 检查锁定状态（统一返回"手机号或密码错误"防止信息泄露）
    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
      return NextResponse.json(
        { error: `登录尝试过多，请${remaining}分钟后再试` },
        { status: 429 }
      )
    }

    if (!user) {
      return NextResponse.json({ error: '手机号或密码错误' }, { status: 401 })
    }

    if (user.status === 'BLOCKED') {
      return NextResponse.json({ error: '账号已被拉黑，请联系管理员' }, { status: 403 })
    }

    // 验证密码（兼容 bcrypt 和旧版 SHA-256）
    const ok = await verifyPassword(password, user)
    if (!ok) {
      // 登录失败，增加计数
      const attempts = user.loginAttempts + 1
      if (attempts >= MAX_ATTEMPTS) {
        // 锁定 15 分钟
        await db.user.update({
          where: { id: user.id },
          data: { loginAttempts: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60000) }
        })
        return NextResponse.json(
          { error: `密码错误${MAX_ATTEMPTS}次，账号已锁定${LOCK_MINUTES}分钟` },
          { status: 429 }
        )
      } else {
        await db.user.update({
          where: { id: user.id },
          data: { loginAttempts: attempts }
        })
        const left = MAX_ATTEMPTS - attempts
        return NextResponse.json(
          { error: `手机号或密码错误，还可尝试${left}次` },
          { status: 401 }
        )
      }
    }

    // 登录成功，清除计数
    await db.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null }
    })

    await createSession(user.id)

    return NextResponse.json({
      message: '登录成功',
      user: {
        id: user.id, phone: user.phone, nickname: user.nickname,
        role: user.role, status: user.status,
        uploadCount: user.uploadCount, likeCount: user.likeCount,
        lastNicknameChange: user.lastNicknameChange, createdAt: user.createdAt,
      }
    })
  } catch (error) {
    console.error('登录失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
