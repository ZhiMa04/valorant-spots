'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropZone } from './DropZone'
import { toast } from 'sonner'

export function UploadDialog() {
  const { uploadDialogOpen, setUploadDialog, user, selectedMapId, selectedAgentId, selectedFaction, triggerRefresh } = useStore()

  const [maps, setMaps] = useState([])
  const [agents, setAgents] = useState([])
  const [form, setForm] = useState({ mapId: '', agentId: '', faction: '', title: '', content: '' })
  const [markerPaths, setMarkerPaths] = useState<string[]>([])
  const [effectPaths, setEffectPaths] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (uploadDialogOpen) {
      fetch('/api/maps').then(r => r.json()).then(setMaps)
      fetch('/api/agents').then(r => r.json()).then(setAgents)
      setForm(f => ({
        ...f,
        mapId: selectedMapId ? String(selectedMapId) : '',
        agentId: selectedAgentId ? String(selectedAgentId) : '',
        faction: selectedFaction || '',
      }))
    }
  }, [uploadDialogOpen, selectedMapId, selectedAgentId, selectedFaction])

  const handleSubmit = async () => {
    if (!form.mapId || !form.agentId || !form.faction) { toast.error('请选择地图、特工和阵营'); return }
    if (!form.title.trim()) { toast.error('请输入标题'); return }
    if (!form.content.trim()) { toast.error('请输入正文'); return }
    if (markerPaths.length === 0) { toast.error('请上传至少一张描点图'); return }
    if (effectPaths.length === 0) { toast.error('请上传至少一张效果图'); return }

    setSubmitting(true)
    try {
      const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1]
      const res = await fetch('/api/spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken || '' },
        body: JSON.stringify({
          mapId: form.mapId, agentId: form.agentId, faction: form.faction,
          title: form.title, content: form.content,
          markerImages: markerPaths, effectImages: effectPaths,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        // 会员及以上无需审核，普通用户需审核
        const isMember = user.role === 'MEMBER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
        const msg = isMember
          ? '感谢您为本站付出的每一份力量！'
          : '上传成功，请等待管理员审核。感谢您为本站付出的每一份力量！'
        toast.success(msg)
        setUploadDialog(false)
        setForm({ mapId: '', agentId: '', faction: '', title: '', content: '' })
        setMarkerPaths([])
        setEffectPaths([])
        triggerRefresh()
      } else {
        toast.error((await res.json()).error || '发布失败')
      }
    } catch { toast.error('网络错误') }
    setSubmitting(false)
  }

  if (!user) return null

  return (
    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialog}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>发布点位</DialogTitle></DialogHeader>

        <div className="space-y-4">
          {/* 地图 */}
          <div className="space-y-1.5">
            <Label>地图</Label>
            <Select value={form.mapId} onValueChange={v => setForm({ ...form, mapId: v })}>
              <SelectTrigger><SelectValue placeholder="选择地图" /></SelectTrigger>
              <SelectContent>
                {maps.map((m: any) => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* 特工 */}
          <div className="space-y-1.5">
            <Label>特工</Label>
            <Select value={form.agentId} onValueChange={v => setForm({ ...form, agentId: v })}>
              <SelectTrigger><SelectValue placeholder="选择特工" /></SelectTrigger>
              <SelectContent>
                {agents.map((a: any) => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* 阵营 */}
          <div className="space-y-1.5">
            <Label>阵营</Label>
            <div className="flex gap-2">
              <button onClick={() => setForm({ ...form, faction: 'ATTACK' })}
                className={`flex-1 py-2 rounded-lg border text-sm ${form.faction === 'ATTACK' ? 'border-red-500 bg-red-50 text-red-600' : ''}`}>
                进攻方
              </button>
              <button onClick={() => setForm({ ...form, faction: 'DEFENSE' })}
                className={`flex-1 py-2 rounded-lg border text-sm ${form.faction === 'DEFENSE' ? 'border-blue-500 bg-blue-50 text-blue-600' : ''}`}>
                防守方
              </button>
            </div>
          </div>

          {/* 标题 */}
          <div className="space-y-1.5">
            <Label>标题（必填）</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="标题格式:站位+目标位+技能名称,例如:A包点射A大探测箭" maxLength={50} />
          </div>

          {/* 正文 */}
          <div className="space-y-1.5">
            <Label>正文（必填）</Label>
            <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="详细描述点位的使用方法、技巧等" rows={4} />
          </div>

          {/* 描点图 — 拖拽上传 */}
          <div className="space-y-1.5">
            <Label>描点图（必填，可多张）</Label>
            <DropZone
              label="拖拽描点图到这里"
              uploadedPaths={markerPaths}
              onUpload={(paths) => setMarkerPaths([...markerPaths, ...paths])}
              onRemove={(i) => setMarkerPaths(markerPaths.filter((_, j) => j !== i))}
            />
          </div>

          {/* 效果图 — 拖拽上传 */}
          <div className="space-y-1.5">
            <Label>效果图（必填，可多张）</Label>
            <DropZone
              label="拖拽效果图到这里"
              uploadedPaths={effectPaths}
              onUpload={(paths) => setEffectPaths([...effectPaths, ...paths])}
              onRemove={(i) => setEffectPaths(effectPaths.filter((_, j) => j !== i))}
            />
          </div>

          {/* 审核提示 */}
          {user.role === 'USER' && (
            <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
              感谢您为本站付出的每一份力量！
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setUploadDialog(false)}>取消</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? '发布中...' : '发布'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
