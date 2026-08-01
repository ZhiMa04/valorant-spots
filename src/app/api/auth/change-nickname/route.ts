import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'

// POST /api/auth/change-nickname — 修改昵称（每30天一次）
// 表单：newNickname
export const POST = withAuth(async (req, user) => {
  try {
    const body = await req.json()
    const newNickname = (body.newNickname || '').trim()

    // ========== 输入校验 ==========
    if (!newNickname) {
      return NextResponse.json({ error: '新昵称不能为空' }, { status: 400 })
    }
    if (newNickname.length > 6) {
      return NextResponse.json({ error: '昵称不能超过6个字' }, { status: 400 })
    }
    if (newNickname === user.nickname) {
      return NextResponse.json({ error: '新昵称与当前相同' }, { status: 400 })
    }

    // ========== 30天冷却检查 ==========
    if (user.lastNicknameChange) {
      const daysSince = (Date.now() - user.lastNicknameChange.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSince < 30) {
        const remaining = Math.ceil(30 - daysSince)
        return NextResponse.json(
          { error: `昵称每30天可修改一次，还需等待${remaining}天` },
          { status: 429 }
        )
      }
    }

    // ========== 昵称查重 ==========
    const existing = await db.user.findUnique({ where: { nickname: newNickname } })
    if (existing) {
      return NextResponse.json({ error: '昵称已被占用' }, { status: 409 })
    }

    // ========== 更新昵称 ==========
    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        nickname: newNickname,
        lastNicknameChange: new Date(),
      }
    })

    return NextResponse.json({
      message: '昵称修改成功',
      user: {
        id: updated.id,
        nickname: updated.nickname,
        role: updated.role,
        status: updated.status,
        uploadCount: updated.uploadCount,
        likeCount: updated.likeCount,
        lastNicknameChange: updated.lastNicknameChange,
        createdAt: updated.createdAt,
      }
    })
  } catch (error) {
    console.error('修改昵称失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
})
