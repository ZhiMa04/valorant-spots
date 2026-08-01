'use client'

import { useStore } from '@/lib/store'
import { Shield } from 'lucide-react'

// 两把剑向下交叉图标
function CrossedSwords({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* 左剑：从右上到左下 */}
      <path d="M19 2 L14 7 M19 2 L19 5 L16 5" />
      <path d="M14 7 L5 16 L4 20 L8 19 L17 10" />
      {/* 右剑：从左上到右下 */}
      <path d="M5 2 L10 7 M5 2 L5 5 L8 5" />
      <path d="M10 7 L19 16 L20 20 L16 19 L7 10" />
    </svg>
  )
}

// 阵营选择页：进攻方(红) vs 防守方(蓝)
export function FactionView() {
  const { goSpots } = useStore()

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">选择阵营</h2>
      <div className="grid grid-cols-2 gap-6 max-w-2xl">
        {/* 进攻方 */}
        <button
          onClick={() => goSpots('ATTACK')}
          className="group relative overflow-hidden rounded-2xl p-10 flex flex-col items-center justify-center gap-4 transition-all hover:scale-[1.03] hover:shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #1a0a0a 0%, #3b1414 50%, #7f1d1d 100%)',
            border: '1px solid rgba(239,68,68,0.3)',
          }}
        >
          <div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <CrossedSwords className="h-10 w-10 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 tracking-wide">进攻方</div>
        </button>

        {/* 防守方 */}
        <button
          onClick={() => goSpots('DEFENSE')}
          className="group relative overflow-hidden rounded-2xl p-10 flex flex-col items-center justify-center gap-4 transition-all hover:scale-[1.03] hover:shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #0a0f1a 0%, #141242 50%, #1e3a5f 100%)',
            border: '1px solid rgba(59,130,246,0.3)',
          }}
        >
          <div className="w-20 h-20 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Shield className="h-10 w-10 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 tracking-wide">防守方</div>
        </button>
      </div>
    </div>
  )
}
