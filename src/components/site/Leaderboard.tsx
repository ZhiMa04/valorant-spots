'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LeaderboardEntry } from '@/lib/types'

// 角色颜色
const ROLE_COLOR: Record<string, string> = {
  USER: '#6b7280',
  MEMBER: '#d97706',
  ADMIN: '#16a34a',
  SUPER_ADMIN: '#8b5cf6',
}

// 贡献榜组件：右侧侧栏，可切换"发布点位数"和"获赞数"
export function Leaderboard() {
  const [type, setType] = useState<'uploads' | 'likes'>('uploads')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    fetch(`/api/leaderboard?type=${type}`)
      .then(res => res.json())
      .then(data => setEntries(data))
      .catch(() => setEntries([]))
  }, [type])

  return (
    <div className="rounded-xl border bg-card">
      <div className="p-3 border-b text-center">
        <h3 className="font-semibold text-sm">贡献榜</h3>
      </div>
      <div className="p-2">
        <Tabs value={type} onValueChange={(v) => setType(v as 'uploads' | 'likes')}>
          <TabsList className="w-full">
            <TabsTrigger value="uploads" className="flex-1 text-xs">发布数</TabsTrigger>
            <TabsTrigger value="likes" className="flex-1 text-xs">获赞数</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="divide-y">
        {entries.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">暂无</div>
        ) : (
          entries.map((entry, i) => (
            <div key={entry.id} className="flex items-center gap-3 px-3 py-2">
              <span className={`w-5 text-center font-bold text-sm ${i < 3 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                {i + 1}
              </span>
              <span className="w-2 h-2 rounded-full" style={{ background: ROLE_COLOR[entry.role] || '#6b7280' }} />
              <span className="flex-1 text-sm truncate">{entry.nickname}</span>
              <span className="text-sm font-semibold tabular-nums">{entry.value}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
