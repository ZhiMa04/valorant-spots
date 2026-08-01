import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// GET /api/setup — 初始化数据库（部署后访问一次）
export async function GET() {
  try {
    const userCount = await db.user.count()
    if (userCount > 0) {
      return NextResponse.json({ message: '数据库已初始化，无需重复操作', userCount })
    }

    // ========== 创建管理员（bcrypt 加密）==========
    const passwordHash = await bcrypt.hash('admin123', 10)
    const admin = await db.user.create({
      data: {
        phone: '13800000001',
        nickname: '站长',
        salt: '',
        passwordHash,
        role: 'SUPER_ADMIN',
        status: 'NORMAL',
      }
    })

    // ========== 13 张地图 ==========
    const MAPS = [
      '莲华古城','裂变峡谷','霓虹町','日落之城','森寒冬港',
      '深海明珠','天枢云阙','微风岛屿','亚海悬城','盐海矿镇',
      '隐世修所','幽邃地窟','源工重镇'
    ]
    for (let i = 0; i < MAPS.length; i++) {
      await db.gameMap.create({ data: { name: MAPS[i], sortOrder: i + 1 } })
    }

    // ========== 29 名特工 ==========
    const AGENTS = [
      ['不死鸟','DUELIST'],['捷风','DUELIST'],['芮娜','DUELIST'],['雷兹','DUELIST'],
      ['夜露','DUELIST'],['霓虹','DUELIST'],['壹决','DUELIST'],['禁灭','DUELIST'],
      ['猎枭','INITIATOR'],['铁臂','INITIATOR'],['斯凯','INITIATOR'],['KO','INITIATOR'],
      ['黑梦','INITIATOR'],['盖可','INITIATOR'],['钛狐','INITIATOR'],
      ['贤者','SENTINEL'],['零','SENTINEL'],['奇乐','SENTINEL'],['尚勃勒','SENTINEL'],
      ['维斯','SENTINEL'],['暮蝶','SENTINEL'],['钢锁','SENTINEL'],
      ['幽影','CONTROLLER'],['炼狱','CONTROLLER'],['蝰蛇','CONTROLLER'],['海神','CONTROLLER'],
      ['星礈','CONTROLLER'],['迷核','CONTROLLER'],['幻棱','CONTROLLER'],
    ]
    for (let i = 0; i < AGENTS.length; i++) {
      await db.agent.create({ data: { name: AGENTS[i][0], role: AGENTS[i][1], sortOrder: i + 1 } })
    }

    // ========== 欢迎公告 ==========
    await db.announcement.create({
      data: {
        title: '欢迎来到酷点·无畏契约点位库',
        content: '本站为AI工具生产的非盈利素材站点，与游戏厂商无任何关联，所有内容版权归对应官方所有，仅供学习参考，禁止用于商业用途。',
        images: '[]',
        creatorId: admin.id,
      }
    })

    return NextResponse.json({
      message: '初始化成功！',
      admin: { phone: '13800000001', password: 'admin123' },
      stats: { maps: MAPS.length, agents: AGENTS.length }
    })
  } catch (error) {
    console.error('初始化失败:', error)
    return NextResponse.json({ error: '初始化失败: ' + String(error) }, { status: 500 })
  }
}
