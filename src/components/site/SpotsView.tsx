'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { Spot } from '@/lib/types'
import { ThumbsUp, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
        <div className="flex flex-col gap-3">
          {spots.map(spot => (
            <div
              key={spot.id}
              className="rounded-xl border hover:border-primary hover:shadow-md transition-all cursor-pointer group p-5"
              onClick={() => goDetail(spot.id, spot.title)}
            >
              {/* 举报提示 */}
              {spot.isReported && (
                <div className="flex items-center gap-1 text-xs text-yellow-600 mb-2">
                  <AlertTriangle className="h-3 w-3" />
                  <span>该点位受到用户举报，请等待管理员审核</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                {/* 标题 */}
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
                  {spot.title}
                </h3>

                {/* 底部信息 */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
                  <span>by {spot.creator?.nickname || '未知'}</span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    {spot.likeCount}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
