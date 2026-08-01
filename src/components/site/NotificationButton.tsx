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

interface NotifItem {
  id: number
  type: string
  title: string
  content: string
  isRead: boolean
  createdAt: string
  creator?: { id: number; nickname: string; role: string } | null
}

// 通知按钮：游客也能看公告，登录用户还能看个人通知
export function NotificationButton() {
  const { user } = useStore()
  const [items, setItems] = useState<NotifItem[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<NotifItem | null>(null)

  const fetchData = async () => {
    try {
      // 已登录：拉取个人通知（包含公告）
      // 未登录：拉取公开公告
      const url = user ? '/api/notifications' : '/api/announcements'
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json()

      if (user) {
        // 登录用户的个人通知
        setItems(data.notifications || [])
        setUnread(data.unreadCount || 0)
      } else {
        // 游客的公告列表
        const announcements = (data || []).map((a: any) => ({
          id: a.id,
          type: 'ANNOUNCEMENT',
          title: a.title,
          content: a.content,
          isRead: true,
          createdAt: a.createdAt,
          creator: a.creator,
        }))
        setItems(announcements)
        setUnread(0)
      }
    } catch {}
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [user])

  const handleRead = async (id: number) => {
    if (!user) return
    const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1]
    await fetch(`/api/notifications/read?id=${id}`, {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken || '' },
    })
    setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
  }

  const handleClick = (item: NotifItem) => {
    setSelected(item)
    if (user && !item.isRead) {
      handleRead(item.id)
    }
    setOpen(false)
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="relative p-2 h-9 w-9">
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="p-3 border-b">
            <h3 className="font-semibold text-sm">通知公告</h3>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y">
            {items.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">暂无通知</div>
            ) : (
              items.slice(0, 20).map(n => (
                <div
                  key={`${n.type}-${n.id}`}
                  onClick={() => handleClick(n)}
                  className="p-3 hover:bg-muted cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{n.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.content}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{
                            color: TYPE_COLORS[n.type] || '#6b7280',
                            backgroundColor: (TYPE_COLORS[n.type] || '#6b7280') + '15',
                          }}
                        >
                          {TYPE_LABELS[n.type] || '通知'}
                        </span>
                        {n.creator && (
                          <span className="text-[10px] text-muted-foreground">
                            {n.creator.nickname}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {new Date(n.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* 详情弹窗 */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <div className="space-y-4">
            {/* 类型标签 + 时间 */}
            <div className="flex items-center gap-2">
              <span
                className="text-xs px-2 py-1 rounded-full font-medium"
                style={{
                  color: TYPE_COLORS[selected?.type || 'OTHER'] || '#6b7280',
                  backgroundColor: (TYPE_COLORS[selected?.type || 'OTHER'] || '#6b7280') + '15',
                }}
              >
                {TYPE_LABELS[selected?.type || 'OTHER'] || '通知'}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {selected && new Date(selected.createdAt).toLocaleString('zh-CN')}
              </span>
            </div>

            {/* 标题 */}
            <h2 className="text-lg font-bold">{selected?.title}</h2>

            {/* 正文 */}
            <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {selected?.content}
            </div>

            {/* 创建人信息 */}
            {selected?.creator && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg p-2.5">
                <span>创建人：</span>
                <span className="font-medium text-foreground">{selected.creator.nickname}</span>
                <span className="font-mono">#{String(selected.creator.id).padStart(5, '0')}</span>
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
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setSelected(null)} className="w-full">确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
