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
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Bell, ChevronRight } from 'lucide-react'
import { AppNotification } from '@/lib/types'

// 通知按钮：显示未读数量红点 + 点击查看详情
export function NotificationButton() {
  const { user } = useStore()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<AppNotification | null>(null)

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

  if (!user) return null

  const handleRead = async (id: number) => {
    const csrf = document.cookie.match(/csrf-token=([^;]+)/)?.[1]
    await fetch(`/api/notifications/read?id=${id}`, { method: 'POST', headers: { 'X-CSRF-Token': csrf || '' } })
    fetchNotifications()
  }

  // 点击通知 → 自动标为已读 + 打开详情弹窗
  const handleClick = (n: AppNotification) => {
    setSelected(n)
    setOpen(false)
    if (!n.isRead) handleRead(n.id)
  }

  // 通知类型图标/颜色
  const typeStyle: Record<string, { icon: string; color: string }> = {
    SPOT_REJECTED: { icon: '⚠️', color: '#dc2626' },
    REPORT_HANDLED: { icon: '✅', color: '#16a34a' },
    ANNOUNCEMENT: { icon: '📢', color: '#2563eb' },
    OTHER: { icon: '🔔', color: '#6b7280' },
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="p-3 border-b flex items-center justify-between">
            <h3 className="font-semibold text-sm">通知</h3>
            {unread > 0 && <span className="text-xs text-blue-600">{unread} 条未读</span>}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">暂无通知</div>
            ) : (
              notifications.map(n => {
                const ts = typeStyle[n.type] || typeStyle.OTHER
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left p-3 hover:bg-muted transition-colors flex items-start gap-2 ${!n.isRead ? 'bg-blue-50/50' : ''}`}
                  >
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                    <span className="text-base flex-shrink-0">{ts.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{n.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.content}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {new Date(n.createdAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-1.5" />
                  </button>
                )
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* 通知详情弹窗 */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <div className="space-y-4">
              {/* 类型标签 */}
              <div className="flex items-center gap-2">
                <span className="text-lg">{(typeStyle[selected.type] || typeStyle.OTHER).icon}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ color: (typeStyle[selected.type] || typeStyle.OTHER).color, backgroundColor: (typeStyle[selected.type] || typeStyle.OTHER).color + '15' }}
                >
                  {selected.type === 'SPOT_REJECTED' ? '点位审核' :
                   selected.type === 'REPORT_HANDLED' ? '举报处理' :
                   selected.type === 'ANNOUNCEMENT' ? '公告' : '通知'}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(selected.createdAt).toLocaleString('zh-CN')}
                </span>
              </div>

              {/* 标题 */}
              <h2 className="text-lg font-bold">{selected.title}</h2>

              {/* 正文 */}
              <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {selected.content}
              </div>

              {/* 关联链接 */}
              {selected.relatedId && (
                <a
                  href={`/api/spots/${selected.relatedId}`}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                  查看关联点位 →
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
