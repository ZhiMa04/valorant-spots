'use client'

import { useEffect, useState, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { DropZone } from './DropZone'
import { ThumbsUp, ThumbsDown, Flag, Trash2, Reply, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { BackBar } from './BackBar'
import Image from 'next/image'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// 举报原因
const REPORT_REASONS = [
  { value: 'OUTDATED', label: '版本更新该点位已失效' },
  { value: 'MISLEADING', label: '该点位描述模糊或错误' },
  { value: 'INAPPROPRIATE', label: '发布内容违规' },
  { value: 'OTHER', label: '其他' },
]

// 角色颜色
const ROLE_COLOR: Record<string, string> = {
  USER: '#6b7280', MEMBER: '#d97706', ADMIN: '#16a34a', SUPER_ADMIN: '#8b5cf6',
}
const ROLE_LABEL: Record<string, string> = {
  USER: '普通用户', MEMBER: '会员', ADMIN: '管理员', SUPER_ADMIN: '高级管理员',
}

interface CommentData {
  id: number
  content: string
  parentId: number | null
  replyToUserId: number | null
  replyToUser: { id: number; nickname: string } | null
  isDeleted: boolean
  createdAt: string
  spotId: number
  userId: number
  user: { id: number; nickname: string; role: string }
  replies: CommentData[]
}

export function SpotDetail() {
  const { selectedSpotId, goSpots, goBack, user, refreshTrigger } = useStore()
  const [spot, setSpot] = useState<any>(null)
  const [comments, setComments] = useState<CommentData[]>([])
  const [loading, setLoading] = useState(true)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetail, setReportDetail] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editMarkerPaths, setEditMarkerPaths] = useState<string[]>([])
  const [editEffectPaths, setEditEffectPaths] = useState<string[]>([])
  const [editMapId, setEditMapId] = useState('')
  const [editAgentId, setEditAgentId] = useState('')
  const [editFaction, setEditFaction] = useState('ATTACK')
  const [maps, setMaps] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null)
  const [deleteSpotOpen, setDeleteSpotOpen] = useState(false)
  const [lightboxImgs, setLightboxImgs] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [zoom, setZoom] = useState(1)

  // 评论相关
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<{ commentId: number; userId: number; nickname: string } | null>(null)
  const [replyContent, setReplyContent] = useState('')

  const fetchSpot = useCallback(async () => {
    if (!selectedSpotId) return
    setLoading(true)
    const res = await fetch(`/api/spots/${selectedSpotId}`)
    if (res.ok) {
      const data = await res.json()
      setSpot(data)
    }
    setLoading(false)
  }, [selectedSpotId])

  const fetchComments = useCallback(async () => {
    if (!selectedSpotId) return
    const res = await fetch(`/api/comments?spotId=${selectedSpotId}`)
    if (res.ok) {
      const data = await res.json()
      setComments(data)
    }
  }, [selectedSpotId])

  useEffect(() => {
    fetchSpot()
    fetchComments()
    // 获取 CSRF token
    fetch('/api/auth/me').then(r => r.json()).then(d => setCsrfToken(d.csrfToken))
  }, [fetchSpot, fetchComments, refreshTrigger])

  // ========== 点赞/点踩 ==========
  const handleAttitude = async (type: 'LIKE' | 'DISLIKE') => {
    if (!user) { toast.error('请先登录'); return }
    if (!csrfToken) return
    const res = await fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      body: JSON.stringify({ spotId: selectedSpotId, type }),
    })
    if (res.ok) {
      const data = await res.json()
      setSpot((s: any) => ({ ...s, likeCount: data.likeCount, dislikeCount: data.dislikeCount, userAttitude: data.userAttitude }))
    }
  }

  // ========== 举报 ==========
  const handleReport = async () => {
    if (!reportReason) { toast.error('请选择举报原因'); return }
    if (reportReason === 'OTHER' && !reportDetail.trim()) { toast.error('请填写举报原因'); return }
    if (!csrfToken) return
    const reason = reportReason === 'OTHER' ? `OTHER:${reportDetail.trim()}` : reportReason
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      body: JSON.stringify({ spotId: selectedSpotId, reason }),
    })
    if (res.ok) {
      toast.success('举报已提交')
      setReportOpen(false)
      setReportReason('')
    } else {
      const data = await res.json()
      toast.error(data.error || '举报失败')
    }
  }

  // ========== 发表评论 ==========
  const handleComment = async () => {
    if (!newComment.trim()) return
    if (!csrfToken) return
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      body: JSON.stringify({ spotId: selectedSpotId, content: newComment }),
    })
    if (res.ok) {
      setNewComment('')
      fetchComments()
    } else {
      toast.error('评论失败')
    }
  }

  // ========== 回复评论 ==========
  const handleReply = async () => {
    if (!replyContent.trim() || !replyingTo) return
    if (!csrfToken) return
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      body: JSON.stringify({
        spotId: selectedSpotId,
        content: replyContent,
        parentId: replyingTo.commentId,
        replyToUserId: replyingTo.userId,
      }),
    })
    if (res.ok) {
      setReplyContent('')
      setReplyingTo(null)
      fetchComments()
    }
  }

  // ========== 删除评论（直接从列表移除） ==========
  const handleDeleteComment = async (commentId: number) => {
    if (!csrfToken) return
    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrfToken },
    })
    if (res.ok) {
      // 直接从列表移除，不显示"已删除"
      setComments(prev => prev.filter(c => c.id !== commentId).map(c => ({
        ...c,
        replies: c.replies?.filter(r => r.id !== commentId)
      })))
    }
  }

  // ========== 渲染评论树 ==========
  const renderComment = (comment: CommentData, depth: number = 0): React.ReactNode => {
    const isOwner = user?.id === comment.userId
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
    const canDelete = isOwner || isAdmin

    return (
      <div key={comment.id} className={depth > 0 ? `ml-${Math.min(depth * 4, 16)} border-l pl-3` : ''}>
        <div className="py-2">
          {/* 用户信息 */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: ROLE_COLOR[comment.user.role] || '#6b7280' }}
            />
            <span className="text-sm font-medium">{comment.user.nickname}</span>
            <span className="text-xs text-muted-foreground">
              #{String(comment.user.id).padStart(5, '0')}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(comment.createdAt).toLocaleString('zh-CN')}
            </span>
          </div>

          {/* 评论内容 */}
          {comment.isDeleted ? (
            <p className="text-sm text-muted-foreground italic">[评论已删除]</p>
          ) : (
            <p className="text-sm">
              {comment.replyToUser && depth > 0 && (
                <span className="text-blue-500 mr-1">@{comment.replyToUser.nickname}</span>
              )}
              {comment.content}
            </p>
          )}

          {/* 操作按钮 */}
          {!comment.isDeleted && (
            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={() => setReplyingTo({ commentId: comment.id, userId: comment.user.id, nickname: comment.user.nickname })}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <Reply className="h-3 w-3" /> 回复
              </button>
              {canDelete && (
                <button
                  onClick={() => setDeleteCommentId(comment.id)}
                  className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" /> 删除
                </button>
              )}
            </div>
          )}
        </div>

        {/* 子评论 */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-4 border-l">
            {comment.replies.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) return <div className="text-center py-12">加载中...</div>
  if (!spot) return <div className="text-center py-12 text-muted-foreground">点位不存在</div>

  return (
    <div>
      {/* 返回栏 */}
      <BackBar label="返回点位列表" />

      <div className="space-y-6">
        {/* ========== 标题 ========== */}
        <h1 className="text-2xl font-bold">{spot.title}</h1>

        {/* 举报提示 */}
        {spot.isReported && (
          <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <Flag className="h-4 w-4" />
            <span>该点位受到用户举报，请等待管理员审核</span>
          </div>
        )}

        {/* ========== 正文 ========== */}
        <div className="text-sm leading-relaxed whitespace-pre-wrap">{spot.content}</div>

        {/* ========== 描点图 ========== */}
        {spot.markerImages?.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-2">描点图</h3>
            <div className="flex flex-col gap-3">
              {spot.markerImages.map((img: string, i: number) => (
                <div key={i} className="relative">
                  <span className="absolute -left-6 top-2 text-xs text-muted-foreground font-mono">{i + 1}</span>
                  <div className="relative w-full aspect-video rounded-lg border overflow-hidden cursor-zoom-in hover:opacity-90 transition-opacity">
                    <Image
                      src={img}
                      alt={`描点图${i+1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 800px"
                      className="object-cover"
                      onClick={() => { setLightboxImgs([...spot.markerImages, ...(spot.effectImages || [])]); setLightboxIndex(i); setZoom(1) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== 效果图 ========== */}
        {spot.effectImages?.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-2">效果图</h3>
            <div className="flex flex-col gap-3">
              {spot.effectImages.map((img: string, i: number) => (
                <div key={i} className="relative">
                  <span className="absolute -left-6 top-2 text-xs text-muted-foreground font-mono">{(spot.markerImages?.length || 0) + i + 1}</span>
                  <div className="relative w-full aspect-video rounded-lg border overflow-hidden cursor-zoom-in hover:opacity-90 transition-opacity">
                    <Image
                      src={img}
                      alt={`效果图${i+1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 800px"
                      className="object-cover"
                      onClick={() => { setLightboxImgs([...(spot.markerImages || []), ...spot.effectImages]); setLightboxIndex((spot.markerImages?.length || 0) + i); setZoom(1) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== 创建者信息 ========== */}
        <div className="flex items-center gap-3 text-sm bg-muted/50 rounded-lg p-3 border">
          <span className="text-muted-foreground">创建人：</span>
          <span className="font-medium">{spot.creator?.nickname}</span>
          <span className="text-muted-foreground font-mono">#{String(spot.creatorId).padStart(5, '0')}</span>
          {spot.creator?.role && (
            <span
              className="px-1.5 py-0.5 rounded text-xs"
              style={{
                color: ROLE_COLOR[spot.creator.role] || '#6b7280',
                backgroundColor: (ROLE_COLOR[spot.creator.role] || '#6b7280') + '15',
              }}
            >
              {ROLE_LABEL[spot.creator.role] || '普通用户'}
            </span>
          )}
          <span className="text-muted-foreground ml-auto">
            {new Date(spot.createdAt).toLocaleString('zh-CN')}
          </span>
        </div>

        {/* ========== 操作栏 ========== */}
        <div className="flex items-center gap-3 border-t pt-4">
          {/* 点赞 */}
          <button
            onClick={() => handleAttitude('LIKE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
              spot.userAttitude === 'LIKE' ? 'bg-green-50 border-green-500 text-green-600' : 'hover:bg-muted'
            }`}
          >
            <ThumbsUp className="h-4 w-4" />
            <span className="text-sm font-medium">{spot.likeCount}</span>
          </button>

          {/* 点踩 */}
          <button
            onClick={() => handleAttitude('DISLIKE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
              spot.userAttitude === 'DISLIKE' ? 'bg-red-50 border-red-500 text-red-600' : 'hover:bg-muted'
            }`}
          >
            <ThumbsDown className="h-4 w-4" />
            <span className="text-sm font-medium">{spot.dislikeCount}</span>
          </button>

          {/* 举报 */}
          {user && spot.creatorId !== user.id && (
            <Button variant="ghost" size="sm" onClick={() => setReportOpen(true)}>
              <Flag className="h-4 w-4" /> 举报
            </Button>
          )}

          {/* 编辑（创建者或管理员） */}
          {spot.canEdit && (
            <Button variant="ghost" size="sm" onClick={() => {
              setEditTitle(spot.title)
              setEditContent(spot.content)
              setEditMarkerPaths(spot.markerImages || [])
              setEditEffectPaths(spot.effectImages || [])
              setEditMapId(String(spot.mapId))
              setEditAgentId(String(spot.agentId))
              setEditFaction(spot.faction)
              // 懒加载地图和特工列表
              if (maps.length === 0) fetch('/api/maps').then(r => r.json()).then(setMaps).catch(() => {})
              if (agents.length === 0) fetch('/api/agents?mapId=0').then(r => r.json()).then(setAgents).catch(() => {})
              setEditOpen(true)
            }}>
              编辑点位
            </Button>
          )}

          {/* 删除（仅高级管理员） */}
          {spot.canDelete && (
            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteSpotOpen(true)}>
              <Trash2 className="h-4 w-4" /> 删除点位
            </Button>
          )}
        </div>

        {/* ========== 评论区 ========== */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-sm mb-4">评论 ({comments.length})</h3>

          {/* 评论输入 */}
          {user ? (
            <div className="flex gap-2 mb-4">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="发表评论..."
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              />
              <Button onClick={handleComment} size="sm">发送</Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">登录后可发表评论</p>
          )}

          {/* 回复输入 */}
          {replyingTo && (
            <div className="flex gap-2 mb-4 ml-4 items-center">
              <span className="text-xs text-muted-foreground">
                回复 @{replyingTo.nickname}:
              </span>
              <Input
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`回复 @${replyingTo.nickname}`}
                onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                className="flex-1"
                autoFocus
              />
              <Button onClick={handleReply} size="sm">回复</Button>
              <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>取消</Button>
            </div>
          )}

          {/* 评论列表 */}
          <div className="space-y-2">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">暂无评论</p>
            ) : (
              comments.map(c => renderComment(c))
            )}
          </div>
        </div>
      </div>

      {/* ========== 举报弹窗 ========== */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>举报点位</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">请选择举报原因：</p>
            {REPORT_REASONS.map(r => (
              <label key={r.value} className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted cursor-pointer">
                <input
                  type="radio"
                  name="report-reason"
                  value={r.value}
                  checked={reportReason === r.value}
                  onChange={(e) => setReportReason(e.target.value)}
                />
                <span className="text-sm">{r.label}</span>
              </label>
            ))}
            {/* "其他"选中时显示输入框 */}
            {reportReason === 'OTHER' && (
              <Textarea
                rows={3}
                value={reportDetail}
                onChange={(e) => setReportDetail(e.target.value)}
                placeholder="请填写举报原因"
                className="mt-2"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>取消</Button>
            <Button
              onClick={handleReport}
              disabled={reportReason === 'OTHER' && !reportDetail.trim()}
            >提交举报</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== 编辑弹窗 ========== */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑点位</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* 地图 */}
            <div className="space-y-2">
              <Label>地图</Label>
              <Select value={editMapId} onValueChange={setEditMapId}>
                <SelectTrigger><SelectValue placeholder="选择地图" /></SelectTrigger>
                <SelectContent>
                  {maps.map((m: any) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      <div className="flex items-center gap-2">
                        <img src={`/maps/${m.name}.webp`} alt={m.name} className="w-8 h-6 rounded object-cover" />
                        <span>{m.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 特工 */}
            <div className="space-y-2">
              <Label>特工</Label>
              <Select value={editAgentId} onValueChange={setEditAgentId}>
                <SelectTrigger><SelectValue placeholder="选择特工" /></SelectTrigger>
                <SelectContent>
                  {agents.map((a: any) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      <div className="flex items-center gap-2">
                        <img src={`/agents/${a.name}.webp`} alt={a.name} className="w-6 h-6 rounded object-cover" />
                        <span>{a.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 阵营 */}
            <div className="space-y-2">
              <Label>阵营</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditFaction('ATTACK')}
                  className={`flex-1 py-2 rounded-lg border text-sm ${editFaction === 'ATTACK' ? 'border-red-500 bg-red-50 text-red-600' : ''}`}
                >
                  进攻方
                </button>
                <button
                  onClick={() => setEditFaction('DEFENSE')}
                  className={`flex-1 py-2 rounded-lg border text-sm ${editFaction === 'DEFENSE' ? 'border-blue-500 bg-blue-50 text-blue-600' : ''}`}
                >
                  防守方
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-title">标题</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content">正文</Label>
              <Textarea
                id="edit-content"
                rows={4}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                maxLength={2000}
              />
            </div>
            <div className="space-y-1.5">
              <Label>描点图</Label>
              <DropZone
                label="拖拽描点图到这里"
                uploadedPaths={editMarkerPaths}
                onUpload={(paths) => setEditMarkerPaths([...editMarkerPaths, ...paths])}
                onRemove={(i) => setEditMarkerPaths(editMarkerPaths.filter((_, j) => j !== i))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>效果图</Label>
              <DropZone
                label="拖拽效果图到这里"
                uploadedPaths={editEffectPaths}
                onUpload={(paths) => setEditEffectPaths([...editEffectPaths, ...paths])}
                onRemove={(i) => setEditEffectPaths(editEffectPaths.filter((_, j) => j !== i))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
            <Button onClick={async () => {
              if (!csrfToken) return
              if (editMarkerPaths.length === 0) { toast.error('至少需要一张描点图'); return }
              if (editEffectPaths.length === 0) { toast.error('至少需要一张效果图'); return }
              const res = await fetch(`/api/spots/${selectedSpotId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
                body: JSON.stringify({
                  title: editTitle,
                  content: editContent,
                  markerImages: editMarkerPaths,
                  effectImages: editEffectPaths,
                  mapId: Number(editMapId),
                  agentId: Number(editAgentId),
                  faction: editFaction,
                }),
              })
              const data = await res.json()
              if (res.ok) {
                toast.success('修改成功')
                setEditOpen(false)
                fetchSpot()
              } else {
                toast.error(data.error || '修改失败')
              }
            }}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== 删除评论确认弹窗 ========== */}
      <AlertDialog open={!!deleteCommentId} onOpenChange={(open) => !open && setDeleteCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除评论？</AlertDialogTitle>
            <AlertDialogDescription>删除后评论将不再显示，此操作不可撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => { if (deleteCommentId) handleDeleteComment(deleteCommentId); setDeleteCommentId(null) }}
            >确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========== 删除点位确认弹窗 ========== */}
      <AlertDialog open={deleteSpotOpen} onOpenChange={setDeleteSpotOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除点位？</AlertDialogTitle>
            <AlertDialogDescription>
              点位「{spot?.title}」将被永久删除，包括所有评论、点赞和举报记录。此操作不可撤销，且不计入任何统计。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={async () => {
                if (!csrfToken) return
                const res = await fetch(`/api/spots/${selectedSpotId}`, {
                  method: 'DELETE',
                  headers: { 'X-CSRF-Token': csrfToken },
                })
                const data = await res.json()
                if (res.ok) {
                  toast.success('点位已删除')
                  setDeleteSpotOpen(false)
                  // 返回上一页
                  goBack()
                } else {
                  toast.error(data.error || '删除失败')
                }
              }}
            >确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========== 图片查看器（支持缩放+左右切换） ========== */}
      <Dialog open={lightboxImgs.length > 0} onOpenChange={(open) => { if (!open) { setLightboxImgs([]); setZoom(1) } }}>
        <DialogContent className="sm:max-w-[95vw] max-h-[95vh] p-0 overflow-hidden flex flex-col items-center justify-center gap-0">
          {lightboxImgs.length > 0 && (
            <>
              <div className="flex items-center justify-center w-full flex-1 relative">
                {/* 左箭头 */}
                {lightboxImgs.length > 1 && (
                  <button
                    onClick={() => { setLightboxIndex(i => (i - 1 + lightboxImgs.length) % lightboxImgs.length); setZoom(1) }}
                    className="absolute left-2 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}

                <div
                  className="overflow-auto flex-1 flex items-center justify-center max-h-[75vh]"
                  onWheel={(e) => {
                    e.preventDefault()
                    const delta = e.deltaY > 0 ? -0.2 : 0.2
                    setZoom(z => Math.min(Math.max(z + delta, 0.5), 5))
                  }}
                >
                  <img
                    src={lightboxImgs[lightboxIndex]}
                    alt={`图片${lightboxIndex + 1}`}
                    className="max-w-full max-h-[75vh] object-contain transition-transform"
                    style={{ transform: `scale(${zoom})` }}
                    draggable={false}
                  />
                </div>

                {/* 右箭头 */}
                {lightboxImgs.length > 1 && (
                  <button
                    onClick={() => { setLightboxIndex(i => (i + 1) % lightboxImgs.length); setZoom(1) }}
                    className="absolute right-2 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}
              </div>

              {/* 底部控制条 */}
              <div className="flex items-center gap-4 py-2 px-4 bg-muted/80 rounded-t-lg w-full">
                {lightboxImgs.length > 1 && (
                  <span className="text-xs text-muted-foreground font-mono">
                    {lightboxIndex + 1} / {lightboxImgs.length}
                  </span>
                )}
                <button
                  onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
                  className="text-lg font-bold hover:text-primary w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                >−</button>
                <span className="text-sm font-mono w-16 text-center">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom(z => Math.min(z + 0.25, 5))}
                  className="text-lg font-bold hover:text-primary w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                >+</button>
                <button
                  onClick={() => setZoom(1)}
                  className="text-xs hover:text-primary px-2 py-1 rounded bg-muted"
                >重置</button>
              </div>

              {/* 正文（显示在图片下方） */}
              {spot?.content && (
                <div className="w-full max-h-[15vh] overflow-y-auto px-6 py-2 bg-background border-t">
                  <div className="text-xs text-muted-foreground mb-0.5 font-medium">正文</div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{spot.content}</div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
