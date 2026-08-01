'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { Agent } from '@/lib/types'
import { SkeletonGrid, ErrorState } from './Loading'

// 特工角色颜色
const ROLE_COLORS: Record<string, string> = {
  DUELIST: '#e8743c',
  SENTINEL: '#5b8aad',
  CONTROLLER: '#6b5e8a',
  INITIATOR: '#7eb87e',
}

// 特工选择页：29个特工，按点位数降序，0置灰
// 苹果风格圆角正方形卡片，只显示名字和点位数
export function AgentsView() {
  const { selectedMapId, goFaction } = useStore()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAgents = () => {
    if (!selectedMapId) return
    setLoading(true)
    setError('')
    fetch(`/api/agents?mapId=${selectedMapId}`)
      .then(res => res.json())
      .then(data => {
        const sorted = [...data].sort((a: any, b: any) => b.spotCount - a.spotCount)
        setAgents(sorted)
        setLoading(false)
      })
      .catch(() => { setError('加载失败'); setLoading(false) })
  }

  useEffect(() => { fetchAgents() }, [selectedMapId])

  if (loading) return (
    <div>
      <h2 className="text-xl font-bold mb-4">选择特工</h2>
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-1.5">
            <div className="aspect-square rounded-lg bg-muted animate-pulse mb-1" />
            <div className="h-2 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )

  if (error) return (
    <div>
      <h2 className="text-xl font-bold mb-4">选择特工</h2>
      <ErrorState message={error} onRetry={fetchAgents} />
    </div>
  )

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">选择特工</h2>
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5">
        {agents.map((agent) => {
          const hasSpots = (agent as any).spotCount > 0
          const color = agent.role ? ROLE_COLORS[agent.role] : '#888888'

          return (
            <button
              key={agent.id}
              onClick={() => goFaction(agent.id, agent.name)}
              className={`rounded-xl border p-1.5 text-center transition-all ${
                hasSpots
                  ? 'hover:border-primary hover:shadow-md cursor-pointer'
                  : 'opacity-40 hover:opacity-60 cursor-pointer'
              }`}
            >
              {/* 特工头像：圆角正方形 */}
              <div
                className="w-full aspect-square rounded-lg flex items-center justify-center mb-1"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
              >
                <span className="text-white font-bold text-sm drop-shadow">
                  {agent.name.charAt(0)}
                </span>
              </div>

              {/* 特工名 */}
              <div className="text-[10px] font-medium truncate leading-tight">{agent.name}</div>

              {/* 点位数 */}
              <div className={`text-[10px] leading-tight ${hasSpots ? 'text-primary' : 'text-muted-foreground'}`}>
                点位数 {(agent as any).spotCount}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
