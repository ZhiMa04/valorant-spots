'use client'

import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home } from 'lucide-react'
import { UserManagement } from './UserManagement'
import { AnnouncementManagement } from './AnnouncementManagement'
import { SpotReview } from './SpotReview'
import { ReportReview } from './ReportReview'
import { AuditHistory } from './AuditHistory'
import { SiteInfo } from './SiteInfo'
import { DataManagement } from './DataManagement'

// 管理后台主容器
export function AdminView() {
  const { adminView, goMaps } = useStore()

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={goMaps} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </Button>
        <Button variant="ghost" size="sm" onClick={goMaps} className="gap-1">
          <Home className="h-4 w-4" />
          回到首页
        </Button>
      </div>

      {adminView === 'users' && <UserManagement />}
      {adminView === 'announcements' && <AnnouncementManagement />}
      {adminView === 'spotReview' && <SpotReview />}
      {adminView === 'reportReview' && <ReportReview />}
      {adminView === 'audit' && <AuditHistory />}
      {adminView === 'siteInfo' && <SiteInfo />}
      {adminView === 'data' && <DataManagement />}
      {!adminView && (
        <div className="text-center py-12 text-muted-foreground">
          请从顶部"管理"菜单选择一个功能
        </div>
      )}
    </div>
  )
}
