'use client'

import { useStore } from '@/lib/store'
import { ChevronRight, Home } from 'lucide-react'

// 面包屑导航：显示当前路径
export function Breadcrumb() {
  const {
    currentView, selectedMapName, selectedAgentName,
    selectedFaction, selectedSpotTitle, goMaps, goAgents, adminView
  } = useStore()

  const adminLabels: Record<string, string> = {
    users: '用户管理', announcements: '通知编辑', spotReview: '点位审核',
    reportReview: '举报审核', audit: '审核处理', siteInfo: '网站信息', data: '数据导入导出',
  }

  const items: { label: string; onClick?: () => void }[] = [
    { label: '首页', onClick: goMaps }
  ]

  if (currentView === 'admin' && adminView) {
    items.push({ label: adminLabels[adminView] || '管理' })
  }

  if (currentView === 'agents' || currentView === 'faction' || currentView === 'spots' || currentView === 'detail') {
    items.push({ label: selectedMapName || '', onClick: () => selectedMapName && goAgents(useStore.getState().selectedMapId!, selectedMapName) })
  }
  if (currentView === 'faction' || currentView === 'spots' || currentView === 'detail') {
    items.push({ label: selectedAgentName || '' })
  }
  if (currentView === 'spots' || currentView === 'detail') {
    items.push({ label: selectedFaction === 'ATTACK' ? '进攻方' : '防守方' })
  }
  if (currentView === 'detail') {
    items.push({ label: selectedSpotTitle || '' })
  }

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1 whitespace-nowrap">
          {i === 0 && <Home className="h-3 w-3" />}
          <button
            onClick={item.onClick}
            disabled={!item.onClick}
            className={item.onClick ? 'hover:text-foreground transition-colors' : 'text-foreground font-medium cursor-default'}
          >
            {item.label}
          </button>
          {i < items.length - 1 && <ChevronRight className="h-3 w-3" />}
        </div>
      ))}
    </nav>
  )
}
