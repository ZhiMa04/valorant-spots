'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'

// 阵营选择页：进攻方(红) vs 防守方(蓝)
// 降饱和度颜色 + 标注点位数量
export function FactionView() {
  const { selectedMapId, selectedAgentId, goSpots } = useStore()
  const [attackCount, setAttackCount] = useState(0)
  const [defenseCount, setDefenseCount] = useState(0)

  useEffect(() => {
    if (!selectedMapId || !selectedAgentId) return
    Promise.all([
      fetch(`/api/spots?mapId=${selectedMapId}&agentId=${selectedAgentId}&faction=ATTACK`).then(r => r.json()),
      fetch(`/api/spots?mapId=${selectedMapId}&agentId=${selectedAgentId}&faction=DEFENSE`).then(r => r.json()),
    ]).then(([attack, defense]) => {
      setAttackCount(Array.isArray(attack) ? attack.length : 0)
      setDefenseCount(Array.isArray(defense) ? defense.length : 0)
    }).catch(() => {})
  }, [selectedMapId, selectedAgentId])

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">选择阵营</h2>
      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        {/* 进攻方 */}
        <button
          onClick={() => goSpots('ATTACK')}
          className="group rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-all hover:scale-[1.03] hover:shadow-2xl"
          style={{ background: 'rgba(239,68,68,0.3)' }}
        >
          <div className="w-16 h-16 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <span className="text-white font-bold text-2xl">攻</span>
          </div>
          <div className="text-xl font-bold text-white tracking-wide">进攻方</div>
          <div className="text-sm text-white/50">{attackCount} 个点位</div>
        </button>

        {/* 防守方 */}
        <button
          onClick={() => goSpots('DEFENSE')}
          className="group rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-all hover:scale-[1.03] hover:shadow-2xl border"
          style={{ background: 'rgba(59,130,246,0.3)', borderColor: 'rgba(59,130,246,0.2)' }}
        >
          <div className="w-16 h-16 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <span className="text-white font-bold text-2xl">守</span>
          </div>
          <div className="text-xl font-bold text-white tracking-wide">防守方</div>
          <div className="text-sm text-white/60">{defenseCount} 个点位</div>
        </button>
      </div>
    </div>
  )
}
