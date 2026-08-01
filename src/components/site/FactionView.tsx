'use client'

import { useStore } from '@/lib/store'

// 阵营选择页：进攻方(红) vs 防守方(蓝)
// 红蓝实色背景 + 圆角图标框 + 汉字
export function FactionView() {
  const { goSpots } = useStore()

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">选择阵营</h2>
      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        {/* 进攻方 */}
        <button
          onClick={() => goSpots('ATTACK')}
          className="group rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-all hover:scale-[1.03] hover:shadow-2xl"
          style={{ background: '#dc2626' }}
        >
          <div className="w-16 h-16 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            <span className="text-white font-bold text-2xl">攻</span>
          </div>
          <div className="text-xl font-bold text-white tracking-wide">进攻方</div>
        </button>

        {/* 防守方 */}
        <button
          onClick={() => goSpots('DEFENSE')}
          className="group rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-all hover:scale-[1.03] hover:shadow-2xl"
          style={{ background: '#2563eb' }}
        >
          <div className="w-16 h-16 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            <span className="text-white font-bold text-2xl">守</span>
          </div>
          <div className="text-xl font-bold text-white tracking-wide">防守方</div>
        </button>
      </div>
    </div>
  )
}
