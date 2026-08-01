import { create } from 'zustand'
import type { View, User, AdminView } from './types'

interface NavState {
  view: View
  mapId: number | null
  mapName: string | null
  agentId: number | null
  agentName: string | null
  faction: string | null
  spotId: number | null
  spotTitle: string | null
}

interface AppState {
  // 导航
  currentView: View
  setCurrentView: (v: View) => void
  navHistory: NavState[]

  // 选中状态
  selectedMapId: number | null
  selectedMapName: string | null
  selectedAgentId: number | null
  selectedAgentName: string | null
  selectedFaction: string | null
  selectedSpotId: number | null
  selectedSpotTitle: string | null

  // 导航到各级页面
  goMaps: () => void
  goAgents: (mapId: number, mapName: string) => void
  goFaction: (agentId: number, agentName: string) => void
  goSpots: (faction: string) => void
  goDetail: (spotId: number, spotTitle: string) => void
  goUpload: () => void
  goBack: () => void

  // 管理后台
  adminView: AdminView | null
  setAdminView: (v: AdminView | null) => void
  goAdmin: (view: AdminView) => void

  // 用户
  user: User | null
  setUser: (u: User | null) => void
  fetchUser: () => Promise<void>

  // 免责声明
  disclaimerAccepted: boolean
  setDisclaimerAccepted: (v: boolean) => void

  // Auth 弹窗
  authDialogOpen: boolean
  authMode: 'login' | 'register'
  setAuthDialog: (open: boolean, mode?: 'login' | 'register') => void

  // 发布弹窗
  uploadDialogOpen: boolean
  setUploadDialog: (open: boolean) => void

  // 通知面板
  notificationOpen: boolean
  setNotificationOpen: (open: boolean) => void

  // 刷新触发器
  refreshTrigger: number
  triggerRefresh: () => void
}

export const useStore = create<AppState>((set, get) => ({
  currentView: 'maps',
  setCurrentView: (v) => set({ currentView: v }),
  navHistory: [],

  selectedMapId: null,
  selectedMapName: null,
  selectedAgentId: null,
  selectedAgentName: null,
  selectedFaction: null,
  selectedSpotId: null,
  selectedSpotTitle: null,

  // 返回上一页：从历史栈弹出上一个状态
  goBack: () => {
    const history = get().navHistory
    if (history.length === 0) {
      get().goMaps()
      return
    }
    const prev = history[history.length - 1]
    set({
      currentView: prev.view,
      selectedMapId: prev.mapId, selectedMapName: prev.mapName,
      selectedAgentId: prev.agentId, selectedAgentName: prev.agentName,
      selectedFaction: prev.faction,
      selectedSpotId: prev.spotId, selectedSpotTitle: prev.spotTitle,
      navHistory: history.slice(0, -1),
    })
  },

  goMaps: () => set({
    currentView: 'maps',
    selectedMapId: null, selectedMapName: null,
    selectedAgentId: null, selectedAgentName: null,
    selectedFaction: null, selectedSpotId: null, selectedSpotTitle: null,
    adminView: null, navHistory: [],
  }),
  goAgents: (mapId, mapName) => {
    const s = get()
    set({
      currentView: 'agents',
      selectedMapId: mapId, selectedMapName: mapName,
      selectedAgentId: null, selectedAgentName: null,
      selectedFaction: null, selectedSpotId: null, selectedSpotTitle: null,
      adminView: null,
      navHistory: [...s.navHistory, {
        view: s.currentView,
        mapId: s.selectedMapId, mapName: s.selectedMapName,
        agentId: s.selectedAgentId, agentName: s.selectedAgentName,
        faction: s.selectedFaction,
        spotId: s.selectedSpotId, spotTitle: s.selectedSpotTitle,
      }],
    })
  },
  goFaction: (agentId, agentName) => {
    const s = get()
    set({
      currentView: 'faction',
      selectedAgentId: agentId, selectedAgentName: agentName,
      selectedFaction: null, selectedSpotId: null, selectedSpotTitle: null,
      adminView: null,
      navHistory: [...s.navHistory, {
        view: s.currentView,
        mapId: s.selectedMapId, mapName: s.selectedMapName,
        agentId: s.selectedAgentId, agentName: s.selectedAgentName,
        faction: s.selectedFaction,
        spotId: s.selectedSpotId, spotTitle: s.selectedSpotTitle,
      }],
    })
  },
  goSpots: (faction) => {
    const s = get()
    set({
      currentView: 'spots',
      selectedFaction: faction,
      selectedSpotId: null, selectedSpotTitle: null,
      adminView: null,
      navHistory: [...s.navHistory, {
        view: s.currentView,
        mapId: s.selectedMapId, mapName: s.selectedMapName,
        agentId: s.selectedAgentId, agentName: s.selectedAgentName,
        faction: s.selectedFaction,
        spotId: s.selectedSpotId, spotTitle: s.selectedSpotTitle,
      }],
    })
  },
  goDetail: (spotId, spotTitle) => {
    const s = get()
    set({
      currentView: 'detail',
      selectedSpotId: spotId, selectedSpotTitle: spotTitle,
      adminView: null,
      navHistory: [...s.navHistory, {
        view: s.currentView,
        mapId: s.selectedMapId, mapName: s.selectedMapName,
        agentId: s.selectedAgentId, agentName: s.selectedAgentName,
        faction: s.selectedFaction,
        spotId: s.selectedSpotId, spotTitle: s.selectedSpotTitle,
      }],
    })
  },
  goUpload: () => set({ uploadDialogOpen: true }),

  adminView: null,
  setAdminView: (v) => set({ adminView: v }),
  goAdmin: (view) => set({ currentView: 'admin', adminView: view }),

  user: null,
  setUser: (u) => set({ user: u }),
  fetchUser: async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        set({ user: data.user })
      } else {
        set({ user: null })
      }
    } catch {
      set({ user: null })
    }
  },

  disclaimerAccepted: false,
  setDisclaimerAccepted: (v) => set({ disclaimerAccepted: v }),

  authDialogOpen: false,
  authMode: 'login',
  setAuthDialog: (open, mode) => set({
    authDialogOpen: open,
    authMode: mode ?? get().authMode
  }),

  uploadDialogOpen: false,
  setUploadDialog: (open) => set({ uploadDialogOpen: open }),

  notificationOpen: false,
  setNotificationOpen: (open) => set({ notificationOpen: open }),

  refreshTrigger: 0,
  triggerRefresh: () => set({ refreshTrigger: get().refreshTrigger + 1 }),
}))
