import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/middleware'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'

// POST /api/admin/users/reset-password?userId=X — 管理员重置用户密码
export const POST = withAdmin(async (req, admin) => {
  try {
    const { searchParams } = new URL(req.url)
    const userId = Number(searchParams.get('userId'))
    if (!userId) return NextResponse.json({ error: '缺少 userId' }, { status: 400 })

    const body = await req.json()
    const result = z.object({
      newPassword: z.string().min(6, '密码至少6位').max(50, '密码不能超过50位'),
    }).safeParse(body)
    if (!result.success) {
      const err = result.error.issues?.[0] || result.error.errors?.[0]
      return NextResponse.json({ error: err?.message || '输入无效' }, { status: 400 })
    }

    const target = await db.user.findUnique({ where: { id: userId } })
    if (!target) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

    // 不能操作自己、同级、上级
    if (userId === admin.id) return NextResponse.json({ error: '不能重置自己的密码' }, { status: 400 })
    if (target.role === 'SUPER_ADMIN' && admin.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '无权操作高级管理员' }, { status: 403 })
    }
    if (target.role === 'ADMIN' && admin.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '无权操作同级管理员' }, { status: 403 })
    }

    // bcrypt 哈希新密码
    const passwordHash = await hashPassword(result.data.newPassword)
    await db.user.update({
      where: { id: userId },
      data: { passwordHash, salt: '', loginAttempts: 0, lockedUntil: null },
    })

    return NextResponse.json({ message: '密码已重置' })
  } catch (error) {
    console.error('重置密码失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
})
