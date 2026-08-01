'use client'

import { useStore } from '@/lib/store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Shield, Users, Bell, CheckSquare, Flag, History, Info, Database } from 'lucide-react'
import type { AdminView } from '@/lib/types'

const MENU_ITEMS: { view: AdminView; label: string; icon: any }[] = [
  { view: 'users',          label: '用户管理', icon: Users },
  { view: 'announcements',  label: '通知编辑', icon: Bell },
  { view: 'spotReview',     label: '点位审核', icon: CheckSquare },
  { view: 'reportReview',   label: '举报审核', icon: Flag },
  { view: 'audit',          label: '审核处理', icon: History },
  { view: 'siteInfo',       label: '网站信息', icon: Info },
  { view: 'data',           label: '数据导入导出', icon: Database },
]

// 管理按钮：仅管理员及以上可见
export function AdminButton() {
  const { user, goAdmin } = useStore()

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Shield className="h-4 w-4" />
          <span className="hidden sm:inline">管理</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {MENU_ITEMS.map((item, i) => (
          <div key={item.view}>
            {i > 0 && i === 5 && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={() => goAdmin(item.view)} className="gap-2 cursor-pointer">
              <item.icon className="h-4 w-4" />
              {item.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
