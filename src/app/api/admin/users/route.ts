import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/middleware'
import { getBatchUserStats } from '@/lib/userStats'

// GET /api/admin/users?search=X — 获取所有用户列表（支持搜索）
export const GET = withAdmin(async (req) => {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''

  const where = search
    ? {
        OR: [
          { nickname: { contains: search } },
        ]
      }
    : {}

  // 如果搜索是数字，也按 ID 搜索
  if (search && /^\d+$/.test(search)) {
    const users = await db.user.findMany({
      where: { OR: [{ id: Number(search) }, { nickname: { contains: search } }] },
      orderBy: { id: 'asc' },
    })
    return NextResponse.json(users.map(formatUser))
  }

  const users = await db.user.findMany({
    where,
    orderBy: { id: 'asc' },
  })

  // 实时计算每个用户的已通过点位数和获赞数
  const statsMap = await getBatchUserStats(users.map(u => u.id))

  return NextResponse.json(users.map(u => {
    const stats = statsMap.get(u.id) || { uploadCount: 0, likeCount: 0 }
    return {
      id: u.id,
      phone: u.phone,
      nickname: u.nickname,
      role: u.role,
      status: u.status,
      uploadCount: stats.uploadCount,
      likeCount: stats.likeCount,
      lastNicknameChange: u.lastNicknameChange,
      createdAt: u.createdAt,
    }
  }))
})

// PATCH /api/admin/users?userId=X — 修改用户（昵称/身份/状态）
export const PATCH = withAdmin(async (req, admin) => {
  const { searchParams } = new URL(req.url)
  const userId = Number(searchParams.get('userId'))

  if (!userId) {
    return NextResponse.json({ error: '缺少 userId' }, { status: 400 })
  }

  const body = await req.json()
  const { nickname, role, status } = body

  // 不能操作自己（高级管理员除外）
  if (userId === admin.id && admin.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: '不能修改自身' }, { status: 400 })
  }

  const target = await db.user.findUnique({ where: { id: userId } })
  if (!target) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 })
  }

  // 权限层级检查（高级管理员可以改自己）
  if (userId !== admin.id) {
    const levelMap: Record<string, number> = { USER: 0, MEMBER: 1, ADMIN: 2, SUPER_ADMIN: 3 }
    const adminLevel = levelMap[admin.role]
    const targetLevel = levelMap[target.role]

    if (targetLevel >= adminLevel) {
      return NextResponse.json({ error: '不能修改同级或上级' }, { status: 403 })
    }
  }

  // 角色权限：普通管理员只能设 USER/MEMBER，高级管理员可设全部
  if (role) {
    // 安全保护：不能降自己的身份（防止误操作导致无人管理）
    if (userId === admin.id && role !== admin.role) {
      return NextResponse.json({ error: '不能修改自己的身份，请让其他管理员操作' }, { status: 400 })
    }
    const allowedRoles = admin.role === 'SUPER_ADMIN'
      ? ['USER', 'MEMBER', 'ADMIN', 'SUPER_ADMIN']
      : ['USER', 'MEMBER']
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: '无权设置该身份' }, { status: 400 })
    }
  }

  // 昵称查重
  if (nickname && nickname !== target.nickname) {
    if (nickname.length > 6) {
      return NextResponse.json({ error: '昵称不能超过6个字' }, { status: 400 })
    }
    const existing = await db.user.findUnique({ where: { nickname } })
    if (existing) {
      return NextResponse.json({ error: '该昵称已被注册，请换一个' }, { status: 409 })
    }
  }

  const data: Record<string, unknown> = {}
  if (nickname) data.nickname = nickname
  if (role) data.role = role
  if (status) data.status = status

  const updated = await db.user.update({ where: { id: userId }, data })
  return NextResponse.json({ message: '修改成功', user: formatUser(updated) })
})

function formatUser(u: any) {
  return {
    id: u.id,
    nickname: u.nickname,
    role: u.role,
    status: u.status,
    uploadCount: u.uploadCount,
    likeCount: u.likeCount,
    lastNicknameChange: u.lastNicknameChange,
    createdAt: u.createdAt,
  }
}
