'use client'

import { useEffect } from 'react'
import { useStore } from '@/lib/store'
import { MapsView } from '@/components/site/MapsView'
import { AgentsView } from '@/components/site/AgentsView'
import { FactionView } from '@/components/site/FactionView'
import { SpotsView } from '@/components/site/SpotsView'
import { SpotDetail } from '@/components/site/SpotDetail'
import { Leaderboard } from '@/components/site/Leaderboard'
import { Footer } from '@/components/site/Footer'
import { UploadDialog } from '@/components/site/UploadDialog'
import { AuthDialog } from '@/components/site/AuthDialog'
import { AdminView } from '@/components/admin/AdminView'
import { Button } from '@/components/ui/button'
import { Sparkles, ArrowLeft, Home as HomeIcon, Trophy } from 'lucide-react'

export default function Home() {
  const {
    currentView, user, fetchUser,
    authDialogOpen, authMode, setAuthDialog,
    uploadDialogOpen,
  } = useStore()

  const [mobileLeaderboard, setMobileLeaderboard] = useState(false)

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // 渲染当前视图
  const renderView = () => {
    switch (currentView) {
      case 'maps':    return <MapsView />
      case 'agents':  return <AgentsView />
      case 'faction': return <FactionView />
      case 'spots':   return <SpotsView />
      case 'detail':  return <SpotDetail />
      case 'admin':   return <AdminView />
      default:        return <MapsView />
    }
  }

  // 非首页显示返回按钮
  const showBackButtons = currentView !== 'maps' && currentView !== 'admin'

  return (
    <div className="flex flex-col min-h-screen">
      {/* 主体内容 */}
      <div className="flex-1 mx-auto max-w-6xl w-full px-4 py-6">
        <div className="flex gap-6">
          {/* 主内容区 */}
          <main className="flex-1 min-w-0">
            {showBackButtons && (
              <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => useStore.getState().goBack()} className="gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  返回上一页
                </Button>
                <Button variant="ghost" size="sm" onClick={() => useStore.getState().goMaps()} className="gap-1">
                  <HomeIcon className="h-4 w-4" />
                  回到首页
                </Button>
              </div>
            )}
            {renderView()}
          </main>

          {/* 右侧侧栏：贡献榜（桌面端） */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="sticky top-20 space-y-4">
              <Leaderboard />
              {!user && (
                <div className="rounded-xl border bg-card p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    登录后可发布点位、评论和点赞
                  </p>
                  <Button size="sm" className="w-full" onClick={() => setAuthDialog(true, 'register')}>
                    <Sparkles className="h-3 w-3 mr-1" />
                    快速注册
                  </Button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* 移动端贡献榜浮动按钮 */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <Button
          size="sm"
          variant="secondary"
          className="rounded-full shadow-lg gap-1.5"
          onClick={() => setMobileLeaderboard(true)}
        >
          <Trophy className="h-4 w-4" />
          贡献榜
        </Button>
      </div>

      {/* 移动端贡献榜弹窗 */}
      {mobileLeaderboard && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end" onClick={() => setMobileLeaderboard(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative w-full bg-background rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">贡献榜</h3>
              <button onClick={() => setMobileLeaderboard(false)} className="text-muted-foreground">✕</button>
            </div>
            <Leaderboard />
          </div>
        </div>
      )}

      {/* 底部免责声明 */}
      <Footer />

      {/* 弹窗 */}
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={(open) => setAuthDialog(open)}
        mode={authMode}
        onModeChange={(m) => setAuthDialog(true, m)}
      />
      {uploadDialogOpen && <UploadDialog />}
    </div>
  )
}
