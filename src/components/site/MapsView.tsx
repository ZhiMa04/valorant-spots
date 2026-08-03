'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { GameMap } from '@/lib/types'
import { MapPin } from 'lucide-react'
import { SkeletonGrid, ErrorState } from './Loading'
import { SmartImage } from './SmartImage'

// 地图选择页：13个地图网格，使用 WebP 图片
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

  // 排序：点位数降序 → 名称首字母升序
  const sortedMaps = [...maps].sort((a, b) => {
    if (b.spotCount !== a.spotCount) return b.spotCount - a.spotCount
    return a.name.localeCompare(b.name, 'zh-Hans')
  })

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
        {sortedMaps.map((map, i) => (
          <button
            key={map.id}
            onClick={() => goAgents(map.id, map.name)}
            className="group relative overflow-hidden rounded-lg border hover:border-primary hover:shadow-md transition-all"
          >
            {/* 地图图片（透明底色） */}
            <div className="aspect-[4/3] overflow-hidden bg-muted">
              <SmartImage
                src={`/maps/${map.name}.webp`}
                alt={map.name}
                className="group-hover:scale-105 transition-transform duration-300"
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
