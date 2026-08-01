import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createSession } from '@/lib/auth'
import { validate, registerSchema } from '@/lib/validation'

// POST /api/auth/register — 用户注册（bcrypt 加密）
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = validate(registerSchema, body)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    const { phone, nickname, password } = result.data

    // 手机号查重
    const phoneExists = await db.user.findUnique({ where: { phone } })
    if (phoneExists) {
      return NextResponse.json({ error: '该手机号已注册' }, { status: 409 })
    }

    // 昵称查重
    const nicknameExists = await db.user.findUnique({ where: { nickname } })
    if (nicknameExists) {
      return NextResponse.json({ error: '昵称已被占用' }, { status: 409 })
    }

    // bcrypt 哈希密码
    const passwordHash = await hashPassword(password)
    const user = await db.user.create({
      data: { phone, nickname, passwordHash, salt: '', role: 'USER', status: 'NORMAL' }
    })

    await createSession(user.id)

    return NextResponse.json({
      message: '注册成功',
      user: {
        id: user.id, phone: user.phone, nickname: user.nickname,
        role: user.role, status: user.status,
        uploadCount: user.uploadCount, likeCount: user.likeCount,
        lastNicknameChange: user.lastNicknameChange, createdAt: user.createdAt,
      }
    })
  } catch (error) {
    console.error('注册失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
