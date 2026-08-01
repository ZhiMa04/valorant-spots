'use client'

import { useEffect, useState, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Search, Ban, KeyRound } from 'lucide-react'
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
  id: number; nickname: string; role: string; status: string
  uploadCount: number; likeCount: number; createdAt: string
}

export function UserManagement() {
  const { user: admin, triggerRefresh } = useStore()
  const [users, setUsers] = useState<UserRow[]>([])
  const [search, setSearch] = useState('')
  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [editNickname, setEditNickname] = useState('')
  const [editRole, setEditRole] = useState('')

  const fetchUsers = useCallback(async () => {
    const res = await fetch(`/api/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`)
    if (res.ok) setUsers(await res.json())
  }, [search])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const getCsrf = () => document.cookie.match(/csrf-token=([^;]+)/)?.[1] || ''

  const handleBan = async (userId: number, currentStatus: string) => {
    const action = currentStatus === 'NORMAL' ? 'ban' : 'unban'
    const res = await fetch(`/api/admin/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrf() },
      body: JSON.stringify({ userId, action }),
    })
    const data = await res.json()
    toast[data.error ? 'error' : 'success'](data.error || data.message)
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
          />
        </div>
        <Button onClick={fetchUsers}>搜索</Button>
      </div>

      <div className="rounded-xl border divide-y">
        {users.map(u => (
          <div key={u.id} className="flex items-center gap-3 px-4 py-3">
            <span className="text-sm font-mono w-12">#{String(u.id).padStart(5, '0')}</span>
            <span className="w-2 h-2 rounded-full" style={{ background: ROLE_COLOR[u.role] }} />
            <div className="flex-1 min-w-0">
              <span className="font-medium text-sm">{u.nickname}</span>
              {u.status === 'BLOCKED' && <Badge variant="destructive" className="ml-2 text-xs">已拉黑</Badge>}
            </div>
            <span className="text-xs text-muted-foreground hidden sm:inline">{ROLE_LABEL[u.role]}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">发布{u.uploadCount}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">赞{u.likeCount}</span>
            <div className="flex gap-1">
              {u.role !== 'ADMIN' && u.role !== 'SUPER_ADMIN' && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => { setEditUser(u); setEditNickname(u.nickname); setEditRole(u.role) }}>
                    <KeyRound className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleBan(u.id, u.status)}>
                    <Ban className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

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
    </div>
  )
}
