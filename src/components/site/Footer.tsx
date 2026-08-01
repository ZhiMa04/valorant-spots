'use client'

// 底部免责声明（直接显示在页面上，无弹窗）
export function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          本站为 AI 工具生产的非盈利素材站点，与游戏厂商无任何关联。<br className="sm:hidden" />
          所有内容版权归对应官方所有，仅供学习参考，禁止用于商业用途。
        </p>
      </div>
    </footer>
  )
}
