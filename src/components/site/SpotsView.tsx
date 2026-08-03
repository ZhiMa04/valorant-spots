'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { Spot } from '@/lib/types'
import { ThumbsUp, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import { BackBar } from './BackBar'

// 点位列表页：按获赞数降序，被举报的显示黄色提示
export function SpotsView() {
  const { selectedMapId, selectedAgentId, selectedFaction, goDetail, goFaction, selectedAgentName, triggerRefresh } = useStore()
  const [spots, setSpots] = useState<Spot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedMapId && selectedAgentId && selectedFaction) {
      setLoading(true)
      fetch(`/api/spots?mapId=${selectedMapId}&agentId=${selectedAgentId}&faction=${selectedFaction}`)
        .then(res => res.json())
        .then(data => setSpots(data))
        .finally(() => setLoading(false))
    }
  }, [selectedMapId, selectedAgentId, selectedFaction, triggerRefresh])

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">加载中...</div>
  }

  return (
    <div>
      <BackBar label="返回阵营" />
      <h2 className="text-xl font-bold mb-4">
        {selectedFaction === 'ATTACK' ? '进攻方' : '防守方'}点位
      </h2>

      {spots.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">该分类下还没有点位</p>
          <p className="text-xs text-muted-foreground">成为第一个贡献者，点击右上角"发布点位"</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {spots.map(spot => {
            const effectImgs: string[] = (() => {
              try { return JSON.parse(spot.effectImages || '[]') } catch { return [] }
            })()
            const thumb = effectImgs[0]
            return (
              <div
                key={spot.id}
                className="rounded-xl border hover:border-primary hover:shadow-lg transition-all cursor-pointer group overflow-hidden flex flex-col"
                onClick={() => goDetail(spot.id, spot.title)}
              >
                {/* 效果图 */}
                <div className="relative w-full aspect-video bg-muted">
                  {thumb ? (
                    <Image
                      src={thumb}
                      alt={spot.title}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-muted-foreground">无图</div>
                  )}
                </div>

                {/* 底部信息 */}
                <div className="p-3 flex flex-col gap-1">
                  {/* 举报提示 */}
                  {spot.isReported && (
                    <div className="flex items-center gap-1 text-[10px] text-yellow-600 mb-1">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      <span>受举报审核中</span>
                    </div>
                  )}
                  <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    {spot.title}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                    <span className="truncate">by {spot.creator?.nickname || '未知'}</span>
                    <span className="flex items-center gap-0.5 flex-shrink-0">
                      <ThumbsUp className="h-3 w-3" />
                      {spot.likeCount}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
