'use client'

import { useStore } from '@/lib/store'
import { Crosshair, ShieldHalf } from 'lucide-react'

// 阵营选择页：进攻方(红) vs 防守方(蓝)
// 渐变背景 + 玻璃拟态卡片 + 大图标动画
export function FactionView() {
  const { goSpots } = useStore()

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">选择阵营</h2>
      <div className="grid grid-cols-2 gap-6 max-w-2xl">
        {/* 进攻方 */}
        <button
          onClick={() => goSpots('ATTACK')}
          className="group relative overflow-hidden rounded-2xl p-10 flex flex-col items-center gap-5 transition-all hover:scale-[1.03] hover:shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #1a0a0a 0%, #3b1414 50%, #7f1d1d 100%)',
            border: '1px solid rgba(239,68,68,0.3)',
          }}
        >
          {/* 光晕效果 */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'radial-gradient(circle at 50% 40%, rgba(239,68,68,0.15), transparent 60%)' }}
          />
          {/* 图标 */}
          <div className="relative w-16 h-16 flex items-center justify-center rounded-xl group-hover:scale-110 transition-transform duration-300"
            style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.05))', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <Crosshair className="h-8 w-8 text-red-400" />
          </div>
          {/* 文字 */}
          <div className="relative text-center">
            <div className="text-2xl font-bold text-red-400 tracking-wide">进攻方</div>
            <div className="text-xs text-red-400/50 mt-1">主动出击 · 先发制人</div>
          </div>
        </button>

        {/* 防守方 */}
        <button
          onClick={() => goSpots('DEFENSE')}
          className="group relative overflow-hidden rounded-2xl p-10 flex flex-col items-center gap-5 transition-all hover:scale-[1.03] hover:shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #0a0f1a 0%, #14253b 50%, #1e3a5f 100%)',
            border: '1px solid rgba(59,130,246,0.3)',
          }}
        >
          {/* 光晕效果 */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'radial-gradient(circle at 50% 40%, rgba(59,130,246,0.15), transparent 60%)' }}
          />
          {/* 图标 */}
          <div className="relative w-16 h-16 flex items-center justify-center rounded-xl group-hover:scale-110 transition-transform duration-300"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.05))', border: '1px solid rgba(59,130,246,0.3)' }}
          >
            <ShieldHalf className="h-8 w-8 text-blue-400" />
          </div>
          {/* 文字 */}
          <div className="relative text-center">
            <div className="text-2xl font-bold text-blue-400 tracking-wide">防守方</div>
            <div className="text-xs text-blue-400/50 mt-1">固守阵地 · 运筹帷幄</div>
          </div>
        </button>
      </div>
    </div>
  )
}
