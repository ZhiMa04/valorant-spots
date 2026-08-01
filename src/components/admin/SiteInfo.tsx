'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'

const ROLE_COLOR: Record<string, string> = { USER: '#6b7280', MEMBER: '#d97706', ADMIN: '#16a34a', SUPER_ADMIN: '#8b5cf6' }
const ROLE_LABEL: Record<string, string> = { USER: '普通用户', MEMBER: '会员', ADMIN: '管理员', SUPER_ADMIN: '高级管理员' }

interface Stats {
  totalUsers: number; normalUsers: number; members: number; admins: number
  totalSpots: number; pendingSpots: number; approvedSpots: number; rejectedSpots: number
  pendingReports: number
  membersAndAdmins: { id: number; nickname: string; role: string; uploadCount: number; likeCount: number }[]
}

export function SiteInfo() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats').then(res => res.json()).then(setStats)
  }, [])

  if (!stats) return <div className="text-center py-12 text-muted-foreground">加载中...</div>

  const cards = [
    { label: '注册用户', value: stats.totalUsers },
    { label: '普通用户', value: stats.normalUsers },
    { label: '会员', value: stats.members },
    { label: '管理员', value: stats.admins },
    { label: '总点位', value: stats.totalSpots },
    { label: '待审核', value: stats.pendingSpots },
    { label: '已通过', value: stats.approvedSpots },
    { label: '待处理举报', value: stats.pendingReports },
  ]

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">网站信息</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {cards.map(c => (
          <div key={c.label} className="rounded-xl border p-4 text-center">
            <div className="text-2xl font-bold tabular-nums">{c.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-3">会员与管理员名单</h3>
        <div className="rounded-xl border divide-y">
          {stats.membersAndAdmins.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">暂无</div>
          ) : stats.membersAndAdmins.map(u => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-2">
              <span className="text-sm font-mono w-12">#{String(u.id).padStart(5, '0')}</span>
              <span className="w-2 h-2 rounded-full" style={{ background: ROLE_COLOR[u.role] }} />
              <span className="flex-1 text-sm">{u.nickname}</span>
              <Badge variant="outline" className="text-xs">{ROLE_LABEL[u.role]}</Badge>
              <span className="text-xs text-muted-foreground">发布{u.uploadCount}</span>
              <span className="text-xs text-muted-foreground">赞{u.likeCount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
