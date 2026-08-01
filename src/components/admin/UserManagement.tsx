'use client'

import { useEffect, useState, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Search, Ban, KeyRound, Lock } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'

const ROLE_COLOR: Record<string, string> = { USER: '#6b7280', MEMBER: '#d97706', ADMIN: '#16a34a', SUPER_ADMIN: '#8b5cf6' }
const ROLE_LABEL: Record<string, string> = { USER: '普通用户', MEMBER: '会员', ADMIN: '管理员', SUPER_ADMIN: '高级管理员' }

interface UserRow {
  id: number; phone: string; nickname: string; role: string; status: string
  uploadCount: number; likeCount: number; createdAt: string
}

export function UserManagement() {
  const { user: admin } = useStore()
  const isSuperAdmin = admin?.role === 'SUPER_ADMIN'
  const [users, setUsers] = useState<UserRow[]>([])
  const [search, setSearch] = useState('')
  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [editNickname, setEditNickname] = useState('')
  const [editRole, setEditRole] = useState('USER')
  const [resetUser, setResetUser] = useState<UserRow | null>(null)
  const [newPassword, setNewPassword] = useState('')

  const fetchUsers = useCallback(async () => {
    const url = search ? `/api/admin/users?search=${encodeURIComponent(search)}` : '/api/admin/users'
    const res = await fetch(url)
    if (res.ok) setUsers(await res.json())
  }, [search])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const getCsrf = () => document.cookie.match(/csrf-token=([^;]+)/)?.[1] || ''

  const handleBan = async (userId: number, currentStatus: string) => {
    const action = currentStatus === 'BLOCKED' ? 'unban' : 'ban'
    const res = await fetch(`/api/admin/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrf() },
      body: JSON.stringify({ userId, action }),
    })
    const data = await res.json()
    toast[data.error ? 'error' : 'success'](data.error || (action === 'ban' ? '已拉黑' : '已解除'))
    fetchUsers()
  }

  const handleEditUser = async () => {
    if (!editUser) return
    const res = await fetch(`/api/admin/users?userId=${editUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrf() },
      body: JSON.stringify({ nickname: editNickname, role: editRole }),
    })
    const data = await res.json()
    toast[data.error ? 'error' : 'success'](data.error || '修改成功')
    setEditUser(null)
    fetchUsers()
  }

  const handleResetPassword = async () => {
    if (!resetUser || newPassword.length < 6) return
    const res = await fetch(`/api/admin/users/reset-password?userId=${resetUser.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrf() },
      body: JSON.stringify({ newPassword }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success(`已重置 ${resetUser.nickname} 的密码`)
      setResetUser(null)
      setNewPassword('')
    } else {
      toast.error(data.error || '重置失败')
    }
  }

  // 判断是否可操作（不能操作自己、同级、上级）
  const canOperate = (u: UserRow) => {
    if (!admin) return false
    if (u.id === admin.id) return false
    if (u.role === 'SUPER_ADMIN' && admin.role !== 'SUPER_ADMIN') return false
    if (u.role === 'ADMIN' && admin.role !== 'SUPER_ADMIN') return false
    return true
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">用户管理</h2>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索昵称或ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
          />
        </div>
        <Button onClick={fetchUsers}>搜索</Button>
      </div>

      <div className="rounded-xl border divide-y">
        {users.map(u => (
          <div key={u.id} className="flex items-center gap-2 px-4 py-3 flex-wrap">
            <span className="text-sm font-mono w-14">#{String(u.id).padStart(5, '0')}</span>
            <span className="w-2 h-2 rounded-full" style={{ background: ROLE_COLOR[u.role] }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{u.nickname}</span>
                {u.status === 'BLOCKED' && <Badge variant="destructive" className="text-xs">已拉黑</Badge>}
              </div>
              {isSuperAdmin && (
                <span className="text-xs text-muted-foreground">{u.phone}</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground hidden sm:inline">{ROLE_LABEL[u.role]}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">发布{u.uploadCount}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">赞{u.likeCount}</span>
            <div className="flex gap-1">
              {canOperate(u) && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => { setEditUser(u); setEditNickname(u.nickname); setEditRole(u.role) }} title="编辑">
                    <KeyRound className="h-3 w-3" />
                  </Button>
                  {isSuperAdmin && (
                    <Button size="sm" variant="ghost" onClick={() => { setResetUser(u); setNewPassword('') }} title="重置密码">
                      <Lock className="h-3 w-3" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handleBan(u.id, u.status)} title="拉黑">
                    <Ban className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 编辑用户弹窗 */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>编辑用户 #{String(editUser?.id || 0).padStart(5, '0')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>昵称</Label>
              <Input value={editNickname} onChange={(e) => setEditNickname(e.target.value.slice(0, 6))} maxLength={6} />
            </div>
            <div className="space-y-2">
              <Label>身份</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">普通用户</SelectItem>
                  <SelectItem value="MEMBER">会员</SelectItem>
                  {isSuperAdmin && <SelectItem value="ADMIN">管理员</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>取消</Button>
            <Button onClick={handleEditUser}>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重置密码弹窗 */}
      <Dialog open={!!resetUser} onOpenChange={(o) => !o && setResetUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置密码 — {resetUser?.nickname}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="reset-pwd">新密码（至少6位）</Label>
              <Input
                id="reset-pwd"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="输入新密码"
              />
              {newPassword && newPassword.length >= 6 && (
                <p className="text-xs text-green-600">✓ 密码长度合格</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              重置后请将新密码告知用户，用户下次登录后可自行修改
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetUser(null)}>取消</Button>
            <Button onClick={handleResetPassword} disabled={newPassword.length < 6}>
              确认重置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
