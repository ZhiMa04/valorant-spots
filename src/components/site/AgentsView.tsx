'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { Agent } from '@/lib/types'
import { SkeletonGrid, ErrorState } from './Loading'

// 特工选择页：29个特工，按点位数降序，0置灰
// 苹果风格圆角正方形卡片，使用 WebP 图片，只显示名字和点位数
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
      <SkeletonGrid count={12} />
    </div>
  )
  if (error) return <ErrorState message={error} onRetry={fetchAgents} />

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">选择特工</h2>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
        {agents.map((agent: any) => {
          const hasSpots = agent.spotCount > 0
          return (
            <button
              key={agent.id}
              onClick={() => goFaction(agent.id, agent.name)}
              className={`rounded-lg border p-1.5 text-center transition-all ${
                hasSpots
                  ? 'hover:border-primary hover:shadow-md cursor-pointer'
                  : 'opacity-40 hover:opacity-60 cursor-pointer'
              }`}
            >
              {/* 特工图片：圆角正方形（透明底色） */}
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-muted mb-1">
                <img
                  src={`/agents/${agent.name}.webp`}
                  alt={agent.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 特工名 */}
              <div className="text-[10px] font-medium truncate leading-tight">{agent.name}</div>

              {/* 点位数 */}
              <div className={`text-[10px] leading-tight ${hasSpots ? 'text-primary' : 'text-muted-foreground'}`}>
                点位数 {agent.spotCount}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
