'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { toast } from 'sonner'
import { Check, X, Eye } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface PendingSpot {
  id: number; title: string; content: string; faction: string
  markerImages: string[]; effectImages: string[]; status: string
  createdAt: string; creator: { id: number; nickname: string; role: string }
  map: { id: number; name: string }; agent: { id: number; name: string }
}

export function SpotReview() {
  const [spots, setSpots] = useState<PendingSpot[]>([])
  const [detail, setDetail] = useState<PendingSpot | null>(null)
  const [rejectId, setRejectId] = useState<number | null>(null)
  const [reason, setReason] = useState('')

  const fetchSpots = useCallback(async () => {
    const res = await fetch('/api/admin/spots/review')
    if (res.ok) setSpots(await res.json())
  }, [])

  useEffect(() => { fetchSpots() }, [fetchSpots])

  const getCsrf = () => document.cookie.match(/csrf-token=([^;]+)/)?.[1] || ''

  const handleApprove = async (id: number) => {
    const res = await fetch(`/api/admin/spots/review?id=${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrf() },
      body: JSON.stringify({ action: 'approve' }),
    })
    const data = await res.json()
    toast[data.error ? 'error' : 'success'](data.error || '已通过')
    fetchSpots()
  }

  const handleReject = async () => {
    if (!rejectId) return
    const res = await fetch(`/api/admin/spots/review?id=${rejectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrf() },
      body: JSON.stringify({ action: 'reject', reason }),
    })
    const data = await res.json()
    toast[data.error ? 'error' : 'success'](data.error || '已拒绝并通知用户')
    setRejectId(null)
    setReason('')
    fetchSpots()
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">点位审核（{spots.length} 待审核）</h2>

      {spots.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">暂无待审核点位</div>
      ) : (
        <div className="rounded-xl border divide-y">
          {spots.map(s => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{s.title}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {s.map.name} · {s.agent.name} · {s.faction === 'ATTACK' ? '进攻' : '防守'}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  by {s.creator.nickname} · {new Date(s.createdAt).toLocaleString('zh-CN')}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setDetail(s)}><Eye className="h-3 w-3" /></Button>
                <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleApprove(s.id)}><Check className="h-3 w-3" /></Button>
                <Button size="sm" variant="outline" className="text-red-600" onClick={() => setRejectId(s.id)}><X className="h-3 w-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 查看详情 */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-[95vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-xl">{detail?.title}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4">
              {/* 地图/特工/阵营信息 */}
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 border">
                <span>地图：<span className="font-medium text-foreground">{detail.map.name}</span></span>
                <span>·</span>
                <span>特工：<span className="font-medium text-foreground">{detail.agent.name}</span></span>
                <span>·</span>
                <span>阵营：<span className="font-medium text-foreground">{detail.faction === 'ATTACK' ? '进攻方' : '防守方'}</span></span>
                <span>·</span>
                <span>创建者：<span className="font-medium text-foreground">{detail.creator.nickname} #{String(detail.creator.id).padStart(5, '0')}</span></span>
              </div>

              {/* 正文 */}
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{detail.content}</div>

              {/* 描点图 — 全宽展示 */}
              {detail.markerImages.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">描点图</h4>
                  <div className="flex flex-col gap-3">
                    {detail.markerImages.map((img, i) => (
                      <div key={i} className="relative w-full aspect-video rounded-lg border overflow-hidden">
                        <Image src={img} alt={`描点图${i+1}`} fill sizes="(max-width: 768px) 100vw, 800px" className="object-cover rounded-lg" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 效果图 — 全宽展示 */}
              {detail.effectImages.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">效果图</h4>
                  <div className="flex flex-col gap-3">
                    {detail.effectImages.map((img, i) => (
                      <div key={i} className="relative w-full aspect-video rounded-lg border overflow-hidden">
                        <Image src={img} alt={`效果图${i+1}`} fill sizes="(max-width: 768px) 100vw, 800px" className="object-cover rounded-lg" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 拒绝原因 */}
      <Dialog open={!!rejectId} onOpenChange={(o) => !o && setRejectId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>拒绝点位</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>拒绝原因（将通知用户）</Label>
            <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="请说明拒绝原因" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>取消</Button>
            <Button variant="destructive" onClick={handleReject}>确认拒绝</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
