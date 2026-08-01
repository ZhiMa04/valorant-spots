'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { GameMap } from '@/lib/types'
import { MapPin } from 'lucide-react'
import { SkeletonGrid, ErrorState } from './Loading'

// 地图颜色（图片加载失败时的备用色）
const MAP_COLORS = [
  '#c4a0b0', '#6b8fbf', '#e8a0b0', '#e8946b', '#a0c8d8',
  '#7fa8b8', '#b0a8d0', '#e8c97a', '#d4a574', '#c4b090',
  '#7eb8a0', '#6a5e7a', '#c4a35a'
]

// 地图选择页：13个地图网格
export function MapsView() {
  const { goAgents } = useStore()
  const [maps, setMaps] = useState<GameMap[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchMaps = () => {
    setLoading(true)
    setError('')
    fetch('/api/maps')
      .then(res => res.json())
      .then(data => { setMaps(data); setLoading(false) })
      .catch(() => { setError('加载失败'); setLoading(false) })
  }

  useEffect(() => { fetchMaps() }, [])

  if (loading) return (
    <div>
      <h2 className="text-xl font-bold mb-4">选择地图</h2>
      <SkeletonGrid count={13} />
    </div>
  )

  if (error) return <ErrorState message={error} onRetry={fetchMaps} />

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">选择地图</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {maps.map((map, i) => (
          <button
            key={map.id}
            onClick={() => goAgents(map.id, map.name)}
            className="group relative overflow-hidden rounded-lg border hover:border-primary hover:shadow-md transition-all"
          >
            {/* 地图图片 */}
            <div
              className="aspect-[4/3] flex items-center justify-center overflow-hidden"
              style={{ background: MAP_COLORS[i % MAP_COLORS.length] }}
            >
              <img
                src={`/maps/${map.name}.png`}
                alt={map.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>

            {/* 点位数 */}
            <div className="p-2 bg-card">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{map.spotCount} 个点位</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
