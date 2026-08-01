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
import { toast } from 'sonner'
import { Upload, X } from 'lucide-react'

export function UploadDialog() {
  const { uploadDialogOpen, setUploadDialog, user, selectedMapId, selectedAgentId, selectedFaction, triggerRefresh } = useStore()

  const [maps, setMaps] = useState([])
  const [agents, setAgents] = useState([])
  const [form, setForm] = useState({
    mapId: '',
    agentId: '',
    faction: '',
    title: '',
    content: '',
  })
  const [markerFiles, setMarkerFiles] = useState<File[]>([])
  const [effectFiles, setEffectFiles] = useState<File[]>([])
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // 获取地图和特工列表
  useEffect(() => {
    if (uploadDialogOpen) {
      fetch('/api/maps').then(r => r.json()).then(setMaps)
      fetch('/api/agents').then(r => r.json()).then(setAgents)
      fetch('/api/auth/me').then(r => r.json()).then(d => setCsrfToken(d.csrfToken))

      // 预填充当前选中的地图/特工/阵营
      setForm(f => ({
        ...f,
        mapId: selectedMapId ? String(selectedMapId) : '',
        agentId: selectedAgentId ? String(selectedAgentId) : '',
        faction: selectedFaction || '',
      }))
    }
  }, [uploadDialogOpen, selectedMapId, selectedAgentId, selectedFaction])

  const handleSubmit = async () => {
    // ========== 验证 ==========
    if (!form.mapId || !form.agentId || !form.faction) {
      toast.error('请选择地图、特工和阵营'); return
    }
    if (!form.title.trim()) { toast.error('请输入标题'); return }
    if (!form.content.trim()) { toast.error('请输入正文'); return }
    if (markerFiles.length === 0) { toast.error('请上传至少一张描点图'); return }
    if (effectFiles.length === 0) { toast.error('请上传至少一张效果图'); return }
    if (!csrfToken) { toast.error('请先登录'); return }

    setSubmitting(true)

    try {
      // ========== 上传描点图 ==========
      const markerFormData = new FormData()
      markerFiles.forEach(f => markerFormData.append('images', f))
      const markerRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
        body: markerFormData,
      })
      if (!markerRes.ok) { toast.error('描点图上传失败'); setSubmitting(false); return }
      const markerData = await markerRes.json()

      // ========== 上传效果图 ==========
      const effectFormData = new FormData()
      effectFiles.forEach(f => effectFormData.append('images', f))
      const effectRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
        body: effectFormData,
      })
      if (!effectRes.ok) { toast.error('效果图上传失败'); setSubmitting(false); return }
      const effectData = await effectRes.json()

      // ========== 创建点位 ==========
      const res = await fetch('/api/spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({
          mapId: form.mapId,
          agentId: form.agentId,
          faction: form.faction,
          title: form.title,
          content: form.content,
          markerImages: markerData.paths,
          effectImages: effectData.paths,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(data.message)
        setUploadDialog(false)
        setForm({ mapId: '', agentId: '', faction: '', title: '', content: '' })
        setMarkerFiles([])
        setEffectFiles([])
        triggerRefresh()
      } else {
        const data = await res.json()
        toast.error(data.error || '发布失败')
      }
    } catch (err) {
      toast.error('网络错误')
    }
    setSubmitting(false)
  }

  if (!user) return null

  return (
    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialog}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>发布点位</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 地图选择 */}
          <div className="space-y-1.5">
            <Label>地图</Label>
            <Select value={form.mapId} onValueChange={v => setForm({ ...form, mapId: v })}>
              <SelectTrigger><SelectValue placeholder="选择地图" /></SelectTrigger>
              <SelectContent>
                {maps.map((m: any) => (
                  <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 特工选择 */}
          <div className="space-y-1.5">
            <Label>特工</Label>
            <Select value={form.agentId} onValueChange={v => setForm({ ...form, agentId: v })}>
              <SelectTrigger><SelectValue placeholder="选择特工" /></SelectTrigger>
              <SelectContent>
                {agents.map((a: any) => (
                  <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 阵营选择 */}
          <div className="space-y-1.5">
            <Label>阵营</Label>
            <div className="flex gap-2">
              <button
                onClick={() => setForm({ ...form, faction: 'ATTACK' })}
                className={`flex-1 py-2 rounded-lg border text-sm ${form.faction === 'ATTACK' ? 'border-red-500 bg-red-50 text-red-600' : ''}`}
              >
                进攻方
              </button>
              <button
                onClick={() => setForm({ ...form, faction: 'DEFENSE' })}
                className={`flex-1 py-2 rounded-lg border text-sm ${form.faction === 'DEFENSE' ? 'border-blue-500 bg-blue-50 text-blue-600' : ''}`}
              >
                防守方
              </button>
            </div>
          </div>

          {/* 标题 */}
          <div className="space-y-1.5">
            <Label>标题（必填）</Label>
            <Input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="简明扼要描述点位用途"
              maxLength={50}
            />
          </div>

          {/* 正文 */}
          <div className="space-y-1.5">
            <Label>正文（必填）</Label>
            <Textarea
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              placeholder="详细描述点位的使用方法、技巧等"
              rows={4}
            />
          </div>

          {/* 描点图 */}
          <div className="space-y-1.5">
            <Label>描点图（必填，可多张）</Label>
            <div className="flex flex-wrap gap-2">
              {markerFiles.map((f, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                  <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                  <button
                    onClick={() => setMarkerFiles(markerFiles.filter((_, j) => j !== i))}
                    className="absolute top-0.5 right-0.5 bg-black/50 rounded-full p-0.5 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => e.target.files && setMarkerFiles([...markerFiles, ...Array.from(e.target.files)])}
                />
              </label>
            </div>
          </div>

          {/* 效果图 */}
          <div className="space-y-1.5">
            <Label>效果图（必填，可多张）</Label>
            <div className="flex flex-wrap gap-2">
              {effectFiles.map((f, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                  <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                  <button
                    onClick={() => setEffectFiles(effectFiles.filter((_, j) => j !== i))}
                    className="absolute top-0.5 right-0.5 bg-black/50 rounded-full p-0.5 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => e.target.files && setEffectFiles([...effectFiles, ...Array.from(e.target.files)])}
                />
              </label>
            </div>
          </div>

          {/* 审核提示 */}
          {user.role === 'USER' && (
            <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
              普通用户发布的点位需要管理员审核通过后才会显示
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
