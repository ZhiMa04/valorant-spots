'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

// ErrorBoundary：捕获客户端渲染错误，显示友好提示
interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">页面出错了</h1>
            <p className="text-sm text-muted-foreground mb-4">
              {this.state.error?.message || '发生了未知错误'}
            </p>
            <Button onClick={() => window.location.reload()}>
              刷新页面
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
