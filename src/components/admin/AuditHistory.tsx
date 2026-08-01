'use client'

import { useEffect, useState, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'

const ACTION_LABELS: Record<string, string> = {
  SPOT_AUDIT: '点位审核', REPORT_AUDIT: '举报审核'
}

const RESULT_STYLES: Record<string, string> = {
  APPROVED: 'bg-green-50 text-green-600 border-green-200',
  REJECTED: 'bg-red-50 text-red-600 border-red-200',
  CONFIRMED: 'bg-blue-50 text-blue-600 border-blue-200',
  DELETED: 'bg-red-50 text-red-600 border-red-200',
}

const RESULT_LABELS: Record<string, string> = {
  APPROVED: '通过',
  REJECTED: '拒绝',
  CONFIRMED: '确认保留',
  DELETED: '删除点位',
}

interface AuditLog {
  id: number; handlerId: number; action: string; targetId: number
  result: string; detail: string; createdAt: string
  handler: { id: number; nickname: string; role: string }
}

export function AuditHistory() {
  const [logs, setLogs] = useState<AuditLog[]>([])

  const fetchLogs = useCallback(async () => {
    const res = await fetch('/api/admin/audit-logs')
    if (res.ok) setLogs(await res.json())
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  // 从 result 提取结果关键词
  const getResultKey = (result: string) => {
    if (result.startsWith('REJECTED')) return 'REJECTED'
    return result
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">审核处理记录（24小时内）</h2>

      {logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">暂无审核记录</div>
      ) : (
        <div className="rounded-xl border divide-y">
          {logs.map(l => {
            const resultKey = getResultKey(l.result)
            const resultLabel = RESULT_LABELS[resultKey] || l.result
            const resultStyle = RESULT_STYLES[resultKey] || 'bg-muted text-muted-foreground border-border'
            // 从 result 中提取拒绝原因
            const rejectReason = l.result.startsWith('REJECTED: ') ? l.result.slice(10) : null

            return (
              <div key={l.id} className="px-4 py-3">
                {/* 第一行：标签 + 处理人 + 时间 */}
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="outline" className="text-xs">{ACTION_LABELS[l.action] || l.action}</Badge>
                  <span className="text-sm font-medium">{l.handler.nickname}</span>
                  <span className="text-xs text-muted-foreground">#{String(l.handler.id).padStart(5, '0')}</span>
                  <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString('zh-CN')}
                  </span>
                </div>
                {/* 第二行：详细描述 */}
                <p className="text-sm text-foreground">
                  {l.detail || `处理目标 #${l.targetId}`}
                </p>
                {/* 第三行：处理结果 */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">结果：</span>
                  <span className={`text-xs px-2 py-0.5 rounded border ${resultStyle}`}>
                    {resultLabel}
                  </span>
                  {rejectReason && (
                    <span className="text-xs text-muted-foreground">（{rejectReason}）</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
