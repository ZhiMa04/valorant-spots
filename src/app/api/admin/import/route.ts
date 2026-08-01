import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withSuperAdmin } from '@/lib/middleware'

// POST /api/admin/import — 导入备份数据（仅高级管理员）
export const POST = withSuperAdmin(async (req) => {
  try {
    const data = await req.json()

    let imported = { maps: 0, agents: 0, spots: 0 }

    // 导入地图
    if (Array.isArray(data.maps)) {
      for (const m of data.maps) {
        const existing = await db.gameMap.findUnique({ where: { id: m.id } })
        if (!existing) {
          await db.gameMap.create({
            data: { id: m.id, name: m.name, imageUrl: m.imageUrl, sortOrder: m.sortOrder }
          })
          imported.maps++
        }
      }
    }

    // 导入特工
    if (Array.isArray(data.agents)) {
      for (const a of data.agents) {
        const existing = await db.agent.findUnique({ where: { id: a.id } })
        if (!existing) {
          await db.agent.create({
            data: { id: a.id, name: a.name, role: a.role, iconUrl: a.iconUrl, sortOrder: a.sortOrder }
          })
          imported.agents++
        }
      }
    }

    // 导入点位
    if (Array.isArray(data.spots)) {
      for (const s of data.spots) {
        const existing = await db.spot.findUnique({ where: { id: s.id } })
        if (!existing) {
          await db.spot.create({
            data: {
              id: s.id,
              title: s.title,
              content: s.content,
              faction: s.faction,
              markerImages: JSON.stringify(s.markerImages || []),
              effectImages: JSON.stringify(s.effectImages || []),
              status: s.status || 'APPROVED',
              likeCount: s.likeCount || 0,
              dislikeCount: s.dislikeCount || 0,
              creatorId: s.creator?.id || 1,
              mapId: s.map?.id || 1,
              agentId: s.agent?.id || 1,
            }
          })
          imported.spots++
        }
      }
    }

    return NextResponse.json({ message: '导入完成', imported })
  } catch (error) {
    console.error('导入失败:', error)
    return NextResponse.json({ error: '导入失败，请检查数据格式' }, { status: 500 })
  }
})
