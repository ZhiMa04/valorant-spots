// 输入验证 Schema（使用 Zod）
import { z } from 'zod'

// 用户注册：手机号 + 昵称 + 密码
export const registerSchema = z.object({
  phone: z.string()
    .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号'),
  nickname: z.string()
    .min(1, '昵称不能为空')
    .max(6, '昵称不能超过6个字')
    .regex(/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/, '昵称只能包含中文、英文、数字和下划线'),
  password: z.string()
    .min(6, '密码至少6位')
    .max(50, '密码不能超过50位'),
})

// 用户登录：手机号 + 密码
export const loginSchema = z.object({
  phone: z.string().min(1, '手机号不能为空'),
  password: z.string().min(1, '密码不能为空'),
})

// 修改昵称
export const changeNicknameSchema = z.object({
  newNickname: z.string()
    .min(1, '昵称不能为空')
    .max(6, '昵称不能超过6个字')
    .regex(/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/, '昵称只能包含中文、英文、数字和下划线'),
})

// 创建点位
export const createSpotSchema = z.object({
  mapId: z.number().int().positive(),
  agentId: z.number().int().positive(),
  faction: z.enum(['ATTACK', 'DEFENSE']),
  title: z.string().min(1, '标题不能为空').max(50, '标题不能超过50字'),
  content: z.string().min(1, '正文不能为空').max(2000, '正文不能超过2000字'),
  markerImages: z.array(z.string()).min(1, '至少上传一张描点图'),
  effectImages: z.array(z.string()).min(1, '至少上传一张效果图'),
})

// 创建评论
export const createCommentSchema = z.object({
  spotId: z.number().int().positive(),
  content: z.string().min(1, '评论不能为空').max(500, '评论不能超过500字'),
  parentId: z.number().int().positive().optional(),
  replyToUserId: z.number().int().positive().optional(),
})

// 点赞/点踩
export const likeSchema = z.object({
  spotId: z.number().int().positive(),
  type: z.enum(['LIKE', 'DISLIKE']),
})

// 举报
export const reportSchema = z.object({
  spotId: z.number().int().positive(),
  reason: z.enum(['SPAM', 'INAPPROPRIATE', 'MISLEADING', 'OTHER']),
})

// XSS 防护：转义 HTML 特殊字符
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// 验证并返回错误信息
export function validate<T>(schema: { safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: { errors: { message: string }[] } | { issues: { message: string }[] } } }, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const errors = (result.error as any).errors || (result.error as any).issues || []
  const firstError = errors[0]
  return { success: false, error: firstError?.message || '输入无效' }
}
