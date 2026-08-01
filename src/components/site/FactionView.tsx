'use client'

import { useStore } from '@/lib/store'
import { Shield } from 'lucide-react'

// 两把剑交叉图标
function CrossedSwords({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* 左剑：剑柄在右上，剑尖在左下 */}
      <path d="M16 3 L21 3 L21 8 L11 18 L8 15 Z" />
      {/* 右剑：剑柄在左上，剑尖在右下 */}
      <path d="M8 3 L3 3 L3 8 L13 18 L16 15 Z" />
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
