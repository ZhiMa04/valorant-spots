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

const ROLE_LABELS: Record<string, string> = {
  DUELIST: '决斗者',
  SENTINEL: '哨位',
  CONTROLLER: '控场',
  INITIATOR: '先锋',
}

// 特工选择页：29个特工，按点位数降序，0置灰
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
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-2">
            <div className="aspect-square rounded-full bg-muted animate-pulse mb-1" />
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
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {agents.map((agent) => {
          const hasSpots = (agent as any).spotCount > 0
          const color = agent.role ? ROLE_COLORS[agent.role] : '#888888'

          return (
            <button
              key={agent.id}
              onClick={() => goFaction(agent.id, agent.name)}
              className={`rounded-lg border p-2 text-center transition-all ${
                hasSpots
                  ? 'hover:border-primary hover:shadow-md cursor-pointer'
                  : 'opacity-40 hover:opacity-60 cursor-pointer'
              }`}
            >
              {/* 特工头像（色块+名字首字） */}
              <div
                className="w-full aspect-square rounded-full flex items-center justify-center mb-1"
                style={{ background: color }}
              >
                <span className="text-white font-bold text-lg">
                  {agent.name.charAt(0)}
                </span>
              </div>

              {/* 特工名 */}
              <div className="text-xs font-medium truncate">{agent.name}</div>

              {/* 角色 */}
              {agent.role && (
                <div className="text-[10px] text-muted-foreground">
                  {ROLE_LABELS[agent.role] || agent.role}
                </div>
              )}

              {/* 点位数 */}
              <div className={`text-[10px] ${hasSpots ? 'text-primary' : 'text-muted-foreground'}`}>
                {(agent as any).spotCount} 点位
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
