'use client'

import { useStore } from '@/lib/store'
import { Sword, Shield } from 'lucide-react'

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
            <Sword className="h-10 w-10 text-red-400" />
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
