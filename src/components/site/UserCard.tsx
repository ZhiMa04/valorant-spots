'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

// ==================== 角色颜色映射 ====================
const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  USER:       { label: '普通用户', color: '#6b7280', bg: '#f3f4f6' },
  MEMBER:     { label: '会员',     color: '#d97706', bg: '#fef3c7' },
  ADMIN:      { label: '管理员',    color: '#16a34a', bg: '#dcfce7' },
  SUPER_ADMIN:{ label: '高级管理员', color: '#7c3aed', bg: '#ede9fe' },
}

// 格式化 ID 为 5 位（如 1 → 00001）
function formatId(id: number): string {
  return id.toString().padStart(5, '0')
}

// ==================== 用户身份卡组件 ====================
export function UserCard() {
  const { user, setUser, fetchUser, setAuthDialog } = useStore()
  const [nicknameDialogOpen, setNicknameDialogOpen] = useState(false)
  const [newNickname, setNewNickname] = useState('')

  // 页面加载时获取用户信息
  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // 未登录：显示注册/登录按钮
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAuthDialog(true, 'login')}
        >
          登录
        </Button>
        <Button
          size="sm"
          onClick={() => setAuthDialog(true, 'register')}
        >
          注册
        </Button>
      </div>
    )
  }

  // 已登录：显示身份卡
  const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.USER
  const canChangeNickname = !user.lastNicknameChange ||
    (Date.now() - new Date(user.lastNicknameChange).getTime()) / (1000 * 60 * 60 * 24) >= 30

  const handleLogout = async () => {
    const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1]
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken || '' },
    })
    setUser(null)
    toast.success('已退出登录')
  }

  const handleNicknameChange = async () => {
    if (!newNickname.trim()) return
    const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1]
    const res = await fetch('/api/auth/change-nickname', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken || '' },
      body: JSON.stringify({ newNickname: newNickname.trim() }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || '修改失败')
      return
    }
    toast.success('昵称修改成功')
    setNicknameDialogOpen(false)
    setNewNickname('')
    fetchUser()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full border px-3 py-1.5 hover:bg-muted transition-colors">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium leading-tight">{user.nickname}</span>
              <span className="text-xs text-muted-foreground leading-tight">#{formatId(user.id)}</span>
            </div>
            <Badge
              variant="secondary"
              className="text-xs"
              style={{ color: roleConfig.color, backgroundColor: roleConfig.bg }}
            >
              {roleConfig.label}
            </Badge>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {/* 身份卡详情 */}
          <div className="px-3 py-3 border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">{user.nickname}</span>
              <Badge
                variant="secondary"
                className="text-xs"
                style={{ color: roleConfig.color, backgroundColor: roleConfig.bg }}
              >
                {roleConfig.label}
              </Badge>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>用户 ID</span>
                <span className="font-mono">{formatId(user.id)}</span>
              </div>
              <div className="flex justify-between">
                <span>发布点位</span>
                <span className="font-mono">{user.uploadCount}</span>
              </div>
              <div className="flex justify-between">
                <span>获赞总数</span>
                <span className="font-mono">{user.likeCount}</span>
              </div>
            </div>
          </div>
          {/* 操作菜单 */}
          <DropdownMenuItem
            onClick={() => setNicknameDialogOpen(true)}
            disabled={!canChangeNickname}
            className={!canChangeNickname ? 'opacity-50' : ''}
          >
            修改昵称
            {!canChangeNickname && (
              <span className="ml-auto text-xs text-muted-foreground">冷却中</span>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600">
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 修改昵称弹窗 */}
      <Dialog open={nicknameDialogOpen} onOpenChange={setNicknameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改昵称</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-nickname">新昵称（0-6个字，每30天可改一次）</Label>
            <Input
              id="new-nickname"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value.slice(0, 6))}
              placeholder="输入新昵称"
              maxLength={6}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNicknameDialogOpen(false)}>取消</Button>
            <Button onClick={handleNicknameChange}>确认修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
