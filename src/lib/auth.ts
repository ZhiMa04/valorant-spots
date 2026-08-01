import { db } from './db'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

// ==================== 密码工具（bcrypt） ====================

const BCRYPT_ROUNDS = 10

// 新密码：用 bcrypt 哈希
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

// 验证密码：兼容 bcrypt 和旧版 SHA-256
// 如果是旧版 SHA-256 密码，验证成功后自动升级为 bcrypt
export async function verifyPassword(password: string, user: { id: number; passwordHash: string; salt: string }): Promise<boolean> {
  // 判断是否为 bcrypt 哈希（以 $2 开头）
  if (user.passwordHash.startsWith('$2')) {
    // bcrypt 密码，直接验证
    return bcrypt.compare(password, user.passwordHash)
  }

  // 旧版 SHA-256 验证
  const sha256Hash = crypto.createHash('sha256').update(password + user.salt).digest('hex')
  if (sha256Hash === user.passwordHash) {
    // 验证成功，自动升级为 bcrypt
    const newHash = await hashPassword(password)
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash, salt: '' },
    })
    return true
  }

  return false
}

// ==================== Session & CSRF ====================

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function generateCsrfToken(): string {
  return crypto.randomBytes(16).toString('hex')
}

export async function createSession(userId: number) {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await db.session.create({ data: { userId, token, expiresAt } })
  const cookieStore = await cookies()
  cookieStore.set('session-token', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
  })
  const csrfToken = generateCsrfToken()
  cookieStore.set('csrf-token', csrfToken, {
    httpOnly: false,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session-token')?.value
  if (token) {
    await db.session.deleteMany({ where: { token } })
  }
  cookieStore.delete('session-token')
  cookieStore.delete('csrf-token')
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session-token')?.value
  if (!token) return null

  const session = await db.session.findUnique({
    where: { token },
    include: { user: true }
  })
  if (!session) return null
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } })
    return null
  }
  return session.user
}

export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('csrf-token')?.value ?? null
}

function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(^|;\\s*)${name}=([^;]+)`))
  return match ? match[2] : null
}

export function validateCsrfFromRequest(req: Request): boolean {
  const cookieHeader = req.headers.get('cookie') || ''
  const csrfCookie = parseCookie(cookieHeader, 'csrf-token')
  const csrfHeader = req.headers.get('x-csrf-token')
  if (!csrfCookie || !csrfHeader) return false
  return csrfCookie === csrfHeader
}

// ==================== 权限检查 ====================

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    return { error: '未登录', status: 401, user: null }
  }
  if (user.status === 'BLOCKED') {
    return { error: '账号已被拉黑', status: 403, user: null }
  }
  return { user, error: null, status: 200 }
}

export async function requireAdmin() {
  const result = await requireAuth()
  if (result.error) return result
  if (result.user!.role !== 'ADMIN' && result.user!.role !== 'SUPER_ADMIN') {
    return { error: '无管理员权限', status: 403, user: null }
  }
  return result
}

export async function requireSuperAdmin() {
  const result = await requireAuth()
  if (result.error) return result
  if (result.user!.role !== 'SUPER_ADMIN') {
    return { error: '无高级管理员权限', status: 403, user: null }
  }
  return result
}
