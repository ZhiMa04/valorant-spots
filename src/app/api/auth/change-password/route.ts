import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'
import { verifyPassword, hashPassword } from '@/lib/auth'
import { z } from 'zod'

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, '请输入旧密码'),
  newPassword: z.string()
    .min(6, '新密码至少6位')
    .max(50, '新密码不能超过50位'),
})

// POST /api/auth/change-password — 修改密码（需登录）
export const POST = withAuth(async (req, user) => {
  try {
    const body = await req.json()

    const result = changePasswordSchema.safeParse(body)
    if (!result.success) {
      const err = result.error.issues?.[0] || result.error.errors?.[0]
      return NextResponse.json({ error: err?.message || '输入无效' }, { status: 400 })
    }
    const { oldPassword, newPassword } = result.data

    if (oldPassword === newPassword) {
      return NextResponse.json({ error: '新密码不能与旧密码相同' }, { status: 400 })
    }

    // 验证旧密码
    const valid = await verifyPassword(oldPassword, user)
    if (!valid) {
      return NextResponse.json({ error: '旧密码错误' }, { status: 401 })
    }

    // bcrypt 哈希新密码
    const newHash = await hashPassword(newPassword)

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash, salt: '' },
    })

    return NextResponse.json({ message: '密码修改成功' })
  } catch (error) {
    console.error('修改密码失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
})
