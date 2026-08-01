'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Check, Trash, Eye } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'

const REASON_LABELS: Record<string, string> = {
  SPAM: '垃圾内容', INAPPROPRIATE: '不当内容', MISLEADING: '误导信息', OTHER: '其他'
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
                  原因：{REASON_LABELS[r.reason] || r.reason} · 举报人：{r.reporter.nickname}
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
              <div><span className="text-muted-foreground text-sm">举报原因：</span>{REASON_LABELS[detail.reason]}</div>
              <div className="text-sm whitespace-pre-wrap bg-muted p-2 rounded">{detail.spot.content}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
