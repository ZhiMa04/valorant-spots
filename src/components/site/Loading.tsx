'use client'

// 加载动画组件
export function Loading({ text, size }: { text?: string; size?: number }) {
  const s = size || 24
  return (
    <div className="flex items-center justify-center py-12 gap-2">
      <div
        className="animate-spin border-2 border-primary border-t-transparent rounded-full"
        style={{ width: s, height: s }}
      />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  )
}

// 骨架屏（列表占位）
export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border overflow-hidden">
          <div className="aspect-[4/3] bg-muted animate-pulse" />
          <div className="p-2 space-y-1">
            <div className="h-3 bg-muted rounded animate-pulse" />
            <div className="h-2 w-1/2 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

// 骨架屏（列表行占位）
export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border p-3 flex items-center gap-3">
          <div className="w-12 h-12 bg-muted rounded animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
            <div className="h-3 bg-muted rounded animate-pulse w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

// 空状态
export function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      {icon && <div className="flex justify-center mb-3 opacity-50">{icon}</div>}
      <p className="text-sm">{message}</p>
    </div>
  )
}

// 错误状态
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="text-center py-12">
      <p className="text-sm text-red-500 mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-primary hover:underline"
        >
          重试
        </button>
      )}
    </div>
  )
}
