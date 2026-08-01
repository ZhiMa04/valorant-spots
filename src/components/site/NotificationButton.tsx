'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'
import { AppNotification } from '@/lib/types'

// 通知按钮：显示未读数量红点
export function NotificationButton() {
  const { user } = useStore()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)

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

  return (
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
        <div className="p-3 border-b">
          <h3 className="font-semibold text-sm">通知</h3>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">暂无通知</div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`p-3 ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
                <div className="flex items-start gap-2">
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{n.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{n.content}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {new Date(n.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => handleRead(n.id)}
                    className="mt-2 text-xs text-blue-600 hover:underline"
                  >
                    标为已读
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
