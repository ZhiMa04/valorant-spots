'use client'

import { useEffect, useState, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'

interface Announcement {
  id: number; title: string; content: string; images: string[]
  creator: { id: number; nickname: string; role: string }; createdAt: string
}

export function AnnouncementManagement() {
  const { user } = useStore()
  const [list, setList] = useState<Announcement[]>([])
  const [editId, setEditId] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', images: '' })

  const fetchList = useCallback(async () => {
    const res = await fetch('/api/admin/announcements')
    if (res.ok) setList(await res.json())
  }, [])

  useEffect(() => { fetchList() }, [fetchList])

  const getCsrf = () => document.cookie.match(/csrf-token=([^;]+)/)?.[1] || ''

  const openCreate = () => {
    setEditId(null)
    setForm({ title: '', content: '', images: '' })
    setOpen(true)
  }

  const openEdit = (a: Announcement) => {
    setEditId(a.id)
    setForm({ title: a.title, content: a.content, images: a.images.join('\n') })
    setOpen(true)
  }

  const handleSave = async () => {
    const images = form.images.split('\n').map(s => s.trim()).filter(Boolean)
    const body = { title: form.title, content: form.content, images }
    const url = editId ? `/api/admin/announcements?id=${editId}` : '/api/admin/announcements'
    const method = editId ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrf() },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    toast[data.error ? 'error' : 'success'](data.error || '操作成功')
    setOpen(false)
    fetchList()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？')) return
    const res = await fetch(`/api/admin/announcements?id=${id}`, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': getCsrf() },
    })
    const data = await res.json()
    toast[data.error ? 'error' : 'success'](data.error || '已删除')
    fetchList()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">通知编辑</h2>
        <Button size="sm" onClick={openCreate} className="gap-1">
          <Plus className="h-4 w-4" /> 发布公告
        </Button>
      </div>

      <div className="rounded-xl border divide-y">
        {list.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">暂无公告</div>
        ) : list.map(a => (
          <div key={a.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{a.title}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.content}</div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  by {a.creator.nickname} · {new Date(a.createdAt).toLocaleString('zh-CN')}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => openEdit(a)}><Edit2 className="h-3 w-3" /></Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(a.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? '编辑公告' : '发布公告'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>标题</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>正文</Label>
              <Textarea rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>图片路径（每行一个）</Label>
              <Textarea rows={2} value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} placeholder="/uploads/xxx.png" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
