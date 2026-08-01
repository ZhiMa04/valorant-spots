'use client'

import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Download, Upload } from 'lucide-react'

export function DataManagement() {
  const getCsrf = () => document.cookie.match(/csrf-token=([^;]+)/)?.[1] || ''

  const handleExport = async () => {
    try {
      const res = await fetch('/api/admin/export')
      if (!res.ok) { toast.error('导出失败'); return }
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `spots-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`导出成功：${data.spots.length} 个点位`)
    } catch {
      toast.error('导出失败')
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!confirm('导入数据将添加不存在的点位，确定继续？')) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrf() },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      toast[result.error ? 'error' : 'success'](result.error || `导入完成：${result.imported.spots} 个点位`)
    } catch {
      toast.error('导入失败，请检查文件格式')
    }
    e.target.value = ''
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">数据导入导出</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border p-6 text-center">
          <Download className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <h3 className="font-medium mb-2">导出数据</h3>
          <p className="text-xs text-muted-foreground mb-4">
            一键导出所有点位信息（文字+图片路径）
          </p>
          <Button onClick={handleExport}>导出 JSON</Button>
        </div>

        <div className="rounded-xl border p-6 text-center">
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <h3 className="font-medium mb-2">导入数据</h3>
          <p className="text-xs text-muted-foreground mb-4">
            从备份文件恢复点位数据（仅高级管理员）
          </p>
          <label>
            <Button variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
              选择文件
            </Button>
            <input id="import-file" type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </div>
    </div>
  )
}
