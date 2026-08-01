'use client'

import { useStore } from '@/lib/store'
import { Sword, Shield } from 'lucide-react'

// 阵营选择页：进攻方(红) vs 防守方(蓝)
export function FactionView() {
  const { goSpots } = useStore()

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">选择阵营</h2>
      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        {/* 进攻方 */}
        <button
          onClick={() => goSpots('ATTACK')}
          className="group rounded-xl border-2 border-red-500/50 hover:border-red-500 hover:shadow-lg transition-all p-8 flex flex-col items-center gap-4 bg-red-50/50"
        >
          <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sword className="h-10 w-10 text-white" />
          </div>
          <div>
            <div className="text-xl font-bold text-red-600">进攻方</div>
            <div className="text-sm text-muted-foreground">Attacker</div>
          </div>
        </button>

        {/* 防守方 */}
        <button
          onClick={() => goSpots('DEFENSE')}
          className="group rounded-xl border-2 border-blue-500/50 hover:border-blue-500 hover:shadow-lg transition-all p-8 flex flex-col items-center gap-4 bg-blue-50/50"
        >
          <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <div>
            <div className="text-xl font-bold text-blue-600">防守方</div>
            <div className="text-sm text-muted-foreground">Defender</div>
          </div>
        </button>
      </div>
    </div>
  )
}
