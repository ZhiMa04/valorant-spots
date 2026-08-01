'use client'

import { useEffect, useState, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'

const ACTION_LABELS: Record<string, string> = {
  SPOT_AUDIT: '点位审核', REPORT_AUDIT: '举报审核'
}

interface AuditLog {
  id: number; handlerId: number; action: string; targetId: number
  result: string; createdAt: string
  handler: { id: number; nickname: string; role: string }
}

export function AuditHistory() {
  const [logs, setLogs] = useState<AuditLog[]>([])

  const fetchLogs = useCallback(async () => {
    const res = await fetch('/api/admin/audit-logs')
    if (res.ok) setLogs(await res.json())
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">审核处理记录（24小时内）</h2>

      {logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">暂无审核记录</div>
      ) : (
        <div className="rounded-xl border divide-y">
          {logs.map(l => (
            <div key={l.id} className="flex items-center gap-3 px-4 py-3">
              <Badge variant="outline" className="text-xs">{ACTION_LABELS[l.action] || l.action}</Badge>
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  <span className="font-medium">{l.handler.nickname}</span>
                  <span className="text-muted-foreground ml-2">处理目标 #{l.targetId}</span>
                </div>
                <div className="text-xs text-muted-foreground">{l.result}</div>
              </div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(l.createdAt).toLocaleString('zh-CN')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
