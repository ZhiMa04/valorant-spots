'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

// 底部免责声明
export function Footer() {
  const { disclaimerAccepted, setDisclaimerAccepted } = useStore()
  const [open, setOpen] = useState(!disclaimerAccepted)

  return (
    <>
      <footer className="border-t mt-auto">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            本站为 AI 工具生产的非盈利素材站点，与游戏厂商无任何关联。<br className="sm:hidden" />
            所有内容版权归对应官方所有，仅供学习参考，禁止用于商业用途。
          </p>
        </div>
      </footer>

      {/* 首次访问免责声明弹窗 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>免责声明</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>本站为 AI 工具生产的非盈利素材站点，与游戏厂商无任何关联。</p>
            <p>所有内容版权归对应官方所有，仅供学习参考，禁止用于商业用途。</p>
            <p>用户上传的内容需经过审核后展示，请遵守社区规范。</p>
          </div>
          <DialogFooter>
            <Button onClick={() => { setDisclaimerAccepted(true); setOpen(false) }}>
              我已了解
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
