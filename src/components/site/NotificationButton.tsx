'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Bell, ChevronRight } from 'lucide-react'
import { AppNotification } from '@/lib/types'

const TYPE_LABELS: Record<string, string> = {
  SPOT_REJECTED: '点位审核',
  REPORT_HANDLED: '举报处理',
  ANNOUNCEMENT: '公告',
  OTHER: '通知',
}

const TYPE_COLORS: Record<string, string> = {
  SPOT_REJECTED: '#dc2626',
  REPORT_HANDLED: '#16a34a',
  ANNOUNCEMENT: '#2563eb',
  OTHER: '#6b7280',
}

const ROLE_LABELS: Record<string, string> = {
  USER: '普通用户', MEMBER: '会员', ADMIN: '管理员', SUPER_ADMIN: '高级管理员',
}

interface NotificationWithCreator extends AppNotification {
  creator?: { id: number; nickname: string; role: string } | null
}

// 通知按钮：显示未读数量红点 + 点击查看详情
export function NotificationButton() {
  const { user } = useStore()
  const [notifications, setNotifications] = useState<NotificationWithCreator[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<NotificationWithCreator | null>(null)

  const fetchNotifications = async () => {
    if (!user) return
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnread(data.unreadCount || 0)
      }
    } catch {}
  }

  useEffect(() => {
    if (user) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const handleRead = async (id: number) => {
    await fetch(`/api/notifications/read?id=${id}`, { method: 'POST' })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
  }

  // 点击通知 → 打开详情弹窗 + 自动标为已读
  const handleClick = (n: NotificationWithCreator) => {
    setSelected(n)
    setOpen(false)
    if (!n.isRead) handleRead(n.id)
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="px-3 py-2 border-b font-semibold text-sm flex items-center justify-between">
            <span>通知</span>
            {unread > 0 && <span className="text-xs text-red-500">{unread} 条未读</span>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">暂无通知</div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-3 py-3 border-b hover:bg-muted transition-colors flex items-start gap-2 ${!n.isRead ? 'bg-blue-50/50' : ''}`}
                >
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{n.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.content}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString('zh-CN')}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* 通知详情弹窗 */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {/* 顶部：类型标签 + 时间 */}
          <div className="flex items-center justify-between mb-4">
            <span
              className="text-xs font-medium px-2 py-1 rounded"
              style={{
                color: TYPE_COLORS[selected?.type || 'OTHER'],
                backgroundColor: (TYPE_COLORS[selected?.type || 'OTHER'] || '#6b7280') + '15',
              }}
            >
              {TYPE_LABELS[selected?.type || 'OTHER']}
            </span>
            <span className="text-xs text-muted-foreground">
              {selected && new Date(selected.createdAt).toLocaleString('zh-CN')}
            </span>
          </div>

          {/* 标题 */}
          <h2 className="text-lg font-bold mb-3">{selected?.title}</h2>

          {/* 正文 */}
          <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed mb-4">
            {selected?.content}
          </div>

          {/* 创建者信息 */}
          {selected?.creator && (
            <div className="rounded-lg bg-muted p-3 space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">创建人：</span>
                <span className="font-medium">{selected.creator.nickname}</span>
                <span className="text-muted-foreground">#{String(selected.creator.id).padStart(5, '0')}</span>
                <span
                  className="px-1.5 py-0.5 rounded text-[10px]"
                  style={{
                    color: TYPE_COLORS[selected.type] || '#6b7280',
                    backgroundColor: (TYPE_COLORS[selected.type] || '#6b7280') + '15',
                  }}
                >
                  {ROLE_LABELS[selected.creator.role] || selected.creator.role}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setSelected(null)} className="w-full">确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
