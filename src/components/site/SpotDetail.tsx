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
import { ThumbsUp, ThumbsDown, Flag, ArrowLeft, Trash2, Reply } from 'lucide-react'
import { toast } from 'sonner'

// 举报原因
const REPORT_REASONS = [
  { value: 'SPAM', label: '垃圾内容' },
  { value: 'INAPPROPRIATE', label: '不当内容' },
  { value: 'MISLEADING', label: '误导信息' },
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
  const { selectedSpotId, goSpots, user, refreshTrigger } = useStore()
  const [spot, setSpot] = useState<any>(null)
  const [comments, setComments] = useState<CommentData[]>([])
  const [loading, setLoading] = useState(true)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')

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
    if (!csrfToken) return
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      body: JSON.stringify({ spotId: selectedSpotId, reason: reportReason }),
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

  // ========== 删除评论 ==========
  const handleDeleteComment = async (commentId: number) => {
    if (!csrfToken) return
    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrfToken },
    })
    if (res.ok) {
      fetchComments()
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
                  onClick={() => handleDeleteComment(comment.id)}
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
      {/* 返回按钮 */}
      <Button variant="ghost" size="sm" onClick={goSpots} className="mb-4">
        <ArrowLeft className="h-4 w-4" /> 返回点位列表
      </Button>

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

        {/* ========== 创建者信息 ========== */}
        <div className="flex items-center gap-3 text-sm border-l-4 pl-3" style={{ borderColor: ROLE_COLOR[spot.creator?.role] || '#6b7280' }}>
          <div>
            <span className="font-medium">{spot.creator?.nickname}</span>
            <span className="text-muted-foreground ml-2">#{String(spot.creatorId).padStart(5, '0')}</span>
            {spot.creator?.role && spot.creator.role !== 'USER' && (
              <Badge variant="secondary" className="ml-2 text-xs" style={{ color: ROLE_COLOR[spot.creator.role], background: 'transparent' }}>
                {ROLE_LABEL[spot.creator.role]}
              </Badge>
            )}
            <span className="text-muted-foreground ml-2">
              {new Date(spot.createdAt).toLocaleString('zh-CN')}
            </span>
          </div>
        </div>

        {/* ========== 正文 ========== */}
        <div className="text-sm leading-relaxed whitespace-pre-wrap">{spot.content}</div>

        {/* ========== 描点图 ========== */}
        {spot.markerImages?.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-2">描点图</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {spot.markerImages.map((img: string, i: number) => (
                <img key={i} src={img} alt={`描点图${i+1}`} className="rounded-lg border w-full" />
              ))}
            </div>
          </div>
        )}

        {/* ========== 效果图 ========== */}
        {spot.effectImages?.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-2">效果图</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {spot.effectImages.map((img: string, i: number) => (
                <img key={i} src={img} alt={`效果图${i+1}`} className="rounded-lg border w-full" />
              ))}
            </div>
          </div>
        )}

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
            <Button variant="ghost" size="sm">
              编辑点位
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>取消</Button>
            <Button onClick={handleReport}>提交举报</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
