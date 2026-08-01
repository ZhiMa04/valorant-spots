'use client'

import { useEffect } from 'react'
import { useStore } from '@/lib/store'
import { UserCard } from './UserCard'
import { Breadcrumb } from './Breadcrumb'
import { NotificationButton } from './NotificationButton'
import { AdminButton } from '@/components/admin/AdminButton'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

// 顶部导航栏：Logo + 面包屑 + 发布 + 管理 + 通知 + 用户身份卡
export function Navbar() {
  const { user, fetchUser, goUpload } = useStore()

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        {/* Logo */}
        <button onClick={() => useStore.getState().goMaps()} className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-lg font-bold tracking-tight">酷点</span>
          <span className="text-sm text-muted-foreground hidden sm:inline">· 无畏契约点位库</span>
        </button>

        {/* 分隔线 */}
        <div className="h-6 w-px bg-border hidden sm:block" />

        {/* 面包屑 */}
        <div className="flex-1 overflow-hidden">
          <Breadcrumb />
        </div>

        {/* 发布按钮 */}
        {user && (
          <Button size="sm" variant="default" onClick={goUpload} className="gap-1">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">发布点位</span>
          </Button>
        )}

        {/* 管理按钮 */}
        <AdminButton />

        {/* 通知按钮 */}
        {user && <NotificationButton />}

        {/* 用户身份卡 */}
        <UserCard />
      </div>
    </header>
  )
}
