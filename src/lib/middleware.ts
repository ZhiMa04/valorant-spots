import { NextResponse } from 'next/server'
import { getCurrentUser, validateCsrfFromRequest } from './auth'

// ==================== 权限中间件 ====================
// 用法：export const POST = withAuth(async (req, user) => { ... })
// 用法：export const POST = withAdmin(async (req, user) => { ... })

type AuthenticatedHandler = (
  req: Request,
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>
) => Promise<Response | NextResponse>

// 验证 CSRF token（仅 POST/PUT/DELETE 请求需要）
function checkCsrf(req: Request): NextResponse | null {
  const method = req.method.toUpperCase()
  if (method === 'GET') return null // GET 请求不需要 CSRF
  if (!validateCsrfFromRequest(req)) {
    return NextResponse.json({ error: 'CSRF 验证失败' }, { status: 403 })
  }
  return null
}

// 检查用户状态
function checkUserStatus(user: { status: string } | null): NextResponse | null {
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }
  if (user.status === 'BLOCKED') {
    return NextResponse.json({ error: '账号已被拉黑' }, { status: 403 })
  }
  return null
}

// withAuth：要求登录
export function withAuth(handler: AuthenticatedHandler) {
  return async (req: Request): Promise<Response> => {
    // CSRF 验证
    const csrfError = checkCsrf(req)
    if (csrfError) return csrfError

    // 身份验证
    const user = await getCurrentUser()
    const statusError = checkUserStatus(user)
    if (statusError) return statusError

    return handler(req, user!)
  }
}

// withAdmin：要求管理员（ADMIN 或 SUPER_ADMIN）
export function withAdmin(handler: AuthenticatedHandler) {
  return async (req: Request): Promise<Response> => {
    const csrfError = checkCsrf(req)
    if (csrfError) return csrfError

    const user = await getCurrentUser()
    const statusError = checkUserStatus(user)
    if (statusError) return statusError

    if (user!.role !== 'ADMIN' && user!.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '无管理员权限' }, { status: 403 })
    }

    return handler(req, user!)
  }
}

// withSuperAdmin：要求高级管理员（SUPER_ADMIN）
export function withSuperAdmin(handler: AuthenticatedHandler) {
  return async (req: Request): Promise<Response> => {
    const csrfError = checkCsrf(req)
    if (csrfError) return csrfError

    const user = await getCurrentUser()
    const statusError = checkUserStatus(user)
    if (statusError) return statusError

    if (user!.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '无高级管理员权限' }, { status: 403 })
    }

    return handler(req, user!)
  }
}
