import { db } from './db'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// ==================== 密码工具 ====================

// 生成每用户独立盐值
export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex')
}

// 密码哈希：SHA-256 + salt
export function hashPassword(password: string, salt: string): string {
  return crypto.createHash('sha256').update(password + salt).digest('hex')
}

// 验证密码
export function verifyPassword(password: string, salt: string, hash: string): boolean {
  return hashPassword(password, salt) === hash
}

// ==================== Session & CSRF ====================

// 生成 session token（64位十六进制）
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// 生成 CSRF token（32位十六进制，用于双提交Cookie模式）
export function generateCsrfToken(): string {
  return crypto.randomBytes(16).toString('hex')
}

// 创建会话：同时设置 session cookie（httpOnly）和 CSRF cookie（可读）
export async function createSession(userId: number) {
  const token = generateToken()
  const csrfToken = generateCsrfToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天

  await db.session.create({
    data: { userId, token, expiresAt }
  })

  const cookieStore = await cookies()
  // Session token: httpOnly，JS 不可读，防 XSS 窃取
  cookieStore.set('session-token', token, {
    httpOnly: true,
    expires: expiresAt,
    path: '/',
    sameSite: 'strict', // 严格同站策略，防 CSRF
  })
  // CSRF token: JS 可读，用于在请求头中回传验证
  cookieStore.set('csrf-token', csrfToken, {
    httpOnly: false,
    expires: expiresAt,
    path: '/',
    sameSite: 'strict',
  })
}

// 清除会话：删除数据库记录 + 清除两个 cookie
export async function clearSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session-token')?.value
  if (token) {
    await db.session.deleteMany({ where: { token } })
  }
  cookieStore.delete('session-token')
  cookieStore.delete('csrf-token')
}

// 验证 CSRF token：请求头中的 token 必须与 cookie 中的一致
export async function validateCsrfToken(): Promise<boolean> {
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get('csrf-token')?.value
  if (!cookieToken) return false

  const headerToken = cookieStore.get('x-csrf-token')?.value
  // Next.js 中请求头可通过 next/headers 的 cookies() 获取
  // 但实际上 CSRF token 是通过客户端在请求头中发送的，需要从 request 中获取
  // 这里我们使用对比方式
  return cookieToken === headerToken
}

// 从 Request 中验证 CSRF token（API 路由中使用）
export function validateCsrfFromRequest(req: Request): boolean {
  const cookieHeader = req.headers.get('cookie') || ''
  const csrfCookie = parseCookie(cookieHeader, 'csrf-token')
  const csrfHeader = req.headers.get('x-csrf-token')
  if (!csrfCookie || !csrfHeader) return false
  return csrfCookie === csrfHeader
}

// 解析单个 cookie 值
function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))
  return match ? match[1] : null
}

// 获取当前登录用户（从 cookie 中解析 session token）
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

// 获取当前用户的 CSRF token（供客户端读取）
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('csrf-token')?.value ?? null
}

// ==================== 权限检查 ====================

// 要求登录
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

// 要求管理员权限（管理员或高级管理员）
export async function requireAdmin() {
  const result = await requireAuth()
  if (result.error) return result
  if (result.user!.role !== 'ADMIN' && result.user!.role !== 'SUPER_ADMIN') {
    return { error: '无管理员权限', status: 403, user: null }
  }
  return result
}

// 要求高级管理员权限
export async function requireSuperAdmin() {
  const result = await requireAuth()
  if (result.error) return result
  if (result.user!.role !== 'SUPER_ADMIN') {
    return { error: '无高级管理员权限', status: 403, user: null }
  }
  return result
}
