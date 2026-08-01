'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'login' | 'register'
  onModeChange: (mode: 'login' | 'register') => void
}

export function AuthDialog({ open, onOpenChange, mode, onModeChange }: AuthDialogProps) {
  const { fetchUser } = useStore()
  const [phone, setPhone] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const resetForm = () => {
    setPhone('')
    setNickname('')
    setPassword('')
  }

  const handleClose = (open: boolean) => {
    if (!open) resetForm()
    onOpenChange(open)
  }

  // ========== 注册 ==========
  const handleRegister = async () => {
    if (!phone.trim()) {
      toast.error('手机号不能为空')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      toast.error('请输入有效的手机号')
      return
    }
    if (!nickname.trim()) {
      toast.error('昵称不能为空')
      return
    }
    if (nickname.length > 6) {
      toast.error('昵称不能超过6个字')
      return
    }
    if (password.length < 6) {
      toast.error('密码至少6位')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), nickname: nickname.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || '注册失败')
        return
      }
      toast.success(`注册成功！欢迎 #${String(data.user.id).padStart(5, '0')}`)
      handleClose(false)
      fetchUser()
    } catch {
      toast.error('网络错误')
    } finally {
      setLoading(false)
    }
  }

  // ========== 登录 ==========
  const handleLogin = async () => {
    if (!phone.trim() || !password) {
      toast.error('请填写手机号和密码')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || '登录失败')
        return
      }
      toast.success(`欢迎回来，${data.user.nickname}！`)
      handleClose(false)
      fetchUser()
    } catch {
      toast.error('网络错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            酷点 · 无畏契约点位库
          </DialogTitle>
        </DialogHeader>
        <Tabs value={mode} onValueChange={(v) => onModeChange(v as 'login' | 'register')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">登录</TabsTrigger>
            <TabsTrigger value="register">注册</TabsTrigger>
          </TabsList>

          {/* 登录表单：手机号 + 密码 */}
          <TabsContent value="login" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="login-phone">手机号</Label>
              <Input
                id="login-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="输入手机号"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">密码</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button className="w-full" onClick={handleLogin} disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
          </TabsContent>

          {/* 注册表单：手机号 + 昵称 + 密码 */}
          <TabsContent value="register" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="reg-phone">手机号（登录用，不可更改）</Label>
              <Input
                id="reg-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="11位手机号"
                inputMode="numeric"
                maxLength={11}
                onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-nickname">昵称（0-6个字，可修改）</Label>
              <Input
                id="reg-nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value.slice(0, 6))}
                placeholder="取一个独特的昵称"
                maxLength={6}
                onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
              />
              <p className="text-xs text-muted-foreground">{nickname.length}/6 字</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">密码（至少6位）</Label>
              <Input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="设置密码"
                onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
              />
            </div>
            <Button className="w-full" onClick={handleRegister} disabled={loading}>
              {loading ? '注册中...' : '注册并登录'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
