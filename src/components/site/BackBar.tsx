'use client'

import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home } from 'lucide-react'

// 通用返回栏：返回上一页 + 返回首页
export function BackBar({ label = '返回' }: { label?: string }) {
  const { goBack, goMaps } = useStore()

  return (
    <div className="flex items-center gap-2 mb-4">
      <Button variant="ghost" size="sm" onClick={goBack} className="gap-1">
        <ArrowLeft className="h-4 w-4" />
        {label}
      </Button>
      <Button variant="ghost" size="sm" onClick={goMaps} className="gap-1">
        <Home className="h-4 w-4" />
        首页
      </Button>
    </div>
  )
}
