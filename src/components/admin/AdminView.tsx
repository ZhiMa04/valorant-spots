'use client'

import { useStore } from '@/lib/store'
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
        <button
          onClick={goMaps}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </button>
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
