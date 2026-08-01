'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Check, Trash, Eye } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'

const REASON_LABELS: Record<string, string> = {
  OUTDATED: '版本更新该点位已失效',
  MISLEADING: '该点位描述模糊或错误',
  INAPPROPRIATE: '发布内容违规',
}

function formatReason(reason: string): string {
  if (REASON_LABELS[reason]) return REASON_LABELS[reason]
  if (reason.startsWith('OTHER:')) return '其他：' + reason.slice(6)
  if (reason === 'OTHER') return '其他'
  return reason
}

interface PendingReport {
  id: number; reason: string; status: string; createdAt: string
  reporter: { id: number; nickname: string }
  spotId: number
  spot: {
    id: number; title: string; content: string; faction: string
    markerImages: string[]; effectImages: string[]; status: string
    createdAt: string
    creator: { id: number; nickname: string; role: string }
    map: { id: number; name: string }
    agent: { id: number; name: string }
  } | null
}

export function ReportReview() {
  const [reports, setReports] = useState<PendingReport[]>([])
  const [detail, setDetail] = useState<PendingReport | null>(null)

  const fetchReports = useCallback(async () => {
    const res = await fetch('/api/admin/reports/handle')
    if (res.ok) setReports(await res.json())
  }, [])

  useEffect(() => { fetchReports() }, [fetchReports])

  const getCsrf = () => document.cookie.match(/csrf-token=([^;]+)/)?.[1] || ''

  const handle = async (id: number, action: 'confirm' | 'delete') => {
    const res = await fetch(`/api/admin/reports/handle?id=${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrf() },
      body: JSON.stringify({ action }),
    })
    const data = await res.json()
    toast[data.error ? 'error' : 'success'](data.error || data.message)
    fetchReports()
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">举报审核（{reports.length} 待处理）</h2>

      {reports.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">暂无待处理举报</div>
      ) : (
        <div className="rounded-xl border divide-y">
          {reports.map(r => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{r.spot?.title || '已删除'}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  原因：{formatReason(r.reason)} · 举报人：{r.reporter.nickname}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {new Date(r.createdAt).toLocaleString('zh-CN')}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setDetail(r)}><Eye className="h-3 w-3" /></Button>
                <Button size="sm" variant="outline" className="text-green-600" onClick={() => handle(r.id, 'confirm')}><Check className="h-3 w-3" /></Button>
                <Button size="sm" variant="outline" className="text-red-600" onClick={() => handle(r.id, 'delete')}><Trash className="h-3 w-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>举报详情</DialogTitle></DialogHeader>
          {detail?.spot && (
            <div className="space-y-3">
              <div><span className="text-muted-foreground text-sm">点位标题：</span>{detail.spot.title}</div>
              <div><span className="text-muted-foreground text-sm">创建者：</span>{detail.spot.creator.nickname}</div>
              <div><span className="text-muted-foreground text-sm">地图/特工：</span>{detail.spot.map.name} / {detail.spot.agent.name}</div>
              <div><span className="text-muted-foreground text-sm">举报原因：</span>{formatReason(detail.reason)}</div>
              <div className="text-sm whitespace-pre-wrap bg-muted p-2 rounded">{detail.spot.content}</div>

              {/* 描点图预览 */}
              {detail.spot.markerImages?.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">描点图</div>
                  <div className="flex flex-col gap-2">
                    {detail.spot.markerImages.map((img: string, i: number) => (
                      <img key={i} src={img} alt={`描点图${i+1}`} className="rounded-lg border w-full" loading="lazy" />
                    ))}
                  </div>
                </div>
              )}

              {/* 效果图预览 */}
              {detail.spot.effectImages?.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">效果图</div>
                  <div className="flex flex-col gap-2">
                    {detail.spot.effectImages.map((img: string, i: number) => (
                      <img key={i} src={img} alt={`效果图${i+1}`} className="rounded-lg border w-full" loading="lazy" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
