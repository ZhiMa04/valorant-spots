// 共享类型定义

export type View = 'maps' | 'agents' | 'faction' | 'spots' | 'detail' | 'upload' | 'admin'

export type AdminView = 'users' | 'announcements' | 'spotReview' | 'reportReview' | 'audit' | 'siteInfo' | 'data'

export interface User {
  id: number
  phone: string
  nickname: string
  role: string // USER | MEMBER | ADMIN | SUPER_ADMIN
  status: string // NORMAL | BLOCKED
  uploadCount: number
  likeCount: number
  lastNicknameChange: string | null
  createdAt: string
}

export interface GameMap {
  id: number
  name: string
  imageUrl: string | null
  sortOrder: number
}

export interface Agent {
  id: number
  name: string
  role: string | null // DUELIST | SENTINEL | CONTROLLER | INITIATOR
  iconUrl: string | null
  sortOrder: number
}

export interface Spot {
  id: number
  title: string
  content: string
  faction: string // ATTACK | DEFENSE
  markerImages: string   // JSON array
  effectImages: string   // JSON array
  status: string         // PENDING | APPROVED | REJECTED
  rejectReason: string | null
  likeCount: number
  dislikeCount: number
  createdAt: string
  creatorId: number
  mapId: number
  agentId: number
  creator?: User
  map?: GameMap
  agent?: Agent
  // 前端计算字段
  isReported?: boolean
  userAttitude?: 'LIKE' | 'DISLIKE' | null
}

export interface Comment {
  id: number
  content: string
  parentId: number | null
  replyToUserId: number | null
  isDeleted: boolean
  createdAt: string
  spotId: number
  userId: number
  user?: Pick<User, 'id' | 'nickname' | 'role'>
  replyToUser?: Pick<User, 'id' | 'nickname'> | null
  replies?: Comment[]
}

export interface LeaderboardEntry {
  id: number
  nickname: string
  role: string
  value: number  // uploadCount or likeCount
}

export interface AppNotification {
  id: number
  type: string   // SPOT_REJECTED | REPORT_HANDLED | ANNOUNCEMENT | OTHER
  title: string
  content: string
  isRead: boolean
  relatedId: number | null
  createdAt: string
}
