import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/middleware'

// POST /api/admin/ban — 拉黑/解除拉黑用户（管理员权限）
// 表单：userId、action（ban | unban）
export const POST = withAdmin(async (req, admin) => {
  try {
    const body = await req.json()
    const userId = Number(body.userId)
    const action = body.action // 'ban' | 'unban'

    if (!userId || !action) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 })
    }

    // 不能操作自己
    if (userId === admin.id) {
      return NextResponse.json({ error: '不能拉黑自己' }, { status: 400 })
    }

    const target = await db.user.findUnique({ where: { id: userId } })
    if (!target) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 权限层级检查：管理员不能拉黑高级管理员
    if (target.role === 'SUPER_ADMIN' && admin.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '无权操作高级管理员' }, { status: 403 })
    }

    if (action === 'ban') {
      await db.user.update({
        where: { id: userId },
        data: { status: 'BLOCKED' }
      })
      return NextResponse.json({ message: '用户已被拉黑', userId })
    } else if (action === 'unban') {
      await db.user.update({
        where: { id: userId },
        data: { status: 'NORMAL' }
      })
      return NextResponse.json({ message: '用户已解除拉黑', userId })
    } else {
      return NextResponse.json({ error: '无效操作' }, { status: 400 })
    }
  } catch (error) {
    console.error('拉黑操作失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
})
