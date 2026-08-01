// prisma/seed.ts — 初始化种子数据：13张地图 + 29名特工 + 高级管理员账号
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

// 密码哈希：bcrypt

// ========== 13 张预设地图 ==========
const MAPS = [
  { name: '莲华古城', color: '#c4a0b0', sortOrder: 1 },
  { name: '裂变峡谷', color: '#6b8fbf', sortOrder: 2 },
  { name: '霓虹町',   color: '#e8a0b0', sortOrder: 3 },
  { name: '日落之城', color: '#e8946b', sortOrder: 4 },
  { name: '森寒冬港', color: '#a0c8d8', sortOrder: 5 },
  { name: '深海明珠', color: '#7fa8b8', sortOrder: 6 },
  { name: '天枢云阙', color: '#b0a8d0', sortOrder: 7 },
  { name: '微风岛屿', color: '#e8c97a', sortOrder: 8 },
  { name: '亚海悬城', color: '#d4a574', sortOrder: 9 },
  { name: '盐海矿镇', color: '#c4b090', sortOrder: 10 },
  { name: '隐世修所', color: '#7eb8a0', sortOrder: 11 },
  { name: '幽邃地窟', color: '#6a5e7a', sortOrder: 12 },
  { name: '源工重镇', color: '#c4a35a', sortOrder: 13 },
]

// ========== 29 名预设特工 ==========
const AGENTS = [
  // 决斗者 (Duelist) - 8名
  { name: '不死鸟', color: '#f5a623', role: 'DUELIST',    sortOrder: 1 },
  { name: '捷风',   color: '#7ec8e3', role: 'DUELIST',    sortOrder: 2 },
  { name: '芮娜',   color: '#c47cd8', role: 'DUELIST',    sortOrder: 3 },
  { name: '雷兹',   color: '#e8743c', role: 'DUELIST',    sortOrder: 4 },
  { name: '夜露',   color: '#5b7ec2', role: 'DUELIST',    sortOrder: 5 },
  { name: '霓虹',   color: '#4df0c0', role: 'DUELIST',    sortOrder: 6 },
  { name: '壹决',   color: '#b08060', role: 'DUELIST',    sortOrder: 7 },
  { name: '禁灭',   color: '#4a3a5a', role: 'DUELIST',    sortOrder: 8 },
  // 先锋 (Initiator) - 7名
  { name: '猎枭',   color: '#4a90d9', role: 'INITIATOR',  sortOrder: 9 },
  { name: '铁臂',   color: '#d4a040', role: 'INITIATOR',  sortOrder: 10 },
  { name: '斯凯',   color: '#7eb87e', role: 'INITIATOR',  sortOrder: 11 },
  { name: 'KO',     color: '#6b8db5', role: 'INITIATOR',  sortOrder: 12 },
  { name: '黑梦',   color: '#5c4a7a', role: 'INITIATOR',  sortOrder: 13 },
  { name: '盖可',   color: '#8cc84b', role: 'INITIATOR',  sortOrder: 14 },
  { name: '钛狐',   color: '#c0a060', role: 'INITIATOR',  sortOrder: 15 },
  // 哨位 (Sentinel) - 7名
  { name: '贤者',   color: '#6bbf8a', role: 'SENTINEL',   sortOrder: 16 },
  { name: '零',     color: '#5b8aad', role: 'SENTINEL',   sortOrder: 17 },
  { name: '奇乐',   color: '#d4c040', role: 'SENTINEL',   sortOrder: 18 },
  { name: '尚勃勒', color: '#d4a878', role: 'SENTINEL',   sortOrder: 19 },
  { name: '维斯',   color: '#6a8c9a', role: 'SENTINEL',   sortOrder: 20 },
  { name: '暮蝶',   color: '#c8a0d0', role: 'SENTINEL',   sortOrder: 21 },
  { name: '钢锁',   color: '#7a8a9a', role: 'SENTINEL',   sortOrder: 22 },
  // 控场 (Controller) - 7名
  { name: '幽影',   color: '#3c3c6e', role: 'CONTROLLER', sortOrder: 23 },
  { name: '炼狱',   color: '#d4783c', role: 'CONTROLLER', sortOrder: 24 },
  { name: '蝰蛇',   color: '#4a8c3f', role: 'CONTROLLER', sortOrder: 25 },
  { name: '海神',   color: '#4aada8', role: 'CONTROLLER', sortOrder: 26 },
  { name: '星礈',   color: '#6b5e8a', role: 'CONTROLLER', sortOrder: 27 },
  { name: '迷核',   color: '#8a7ab0', role: 'CONTROLLER', sortOrder: 28 },
  { name: '幻棱',   color: '#d890c0', role: 'CONTROLLER', sortOrder: 29 },
]

async function main() {
  console.log('🌱 开始初始化种子数据...\n')

  // 1. 创建高级管理员账号
  const existingAdmin = await db.user.findFirst({ where: { role: 'SUPER_ADMIN' } })
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 10)
    await db.user.create({
      data: {
        phone: '13800000001',
        nickname: '站长',
        salt: '',
        passwordHash,
        role: 'SUPER_ADMIN',
        status: 'NORMAL',
      }
    })
    console.log('✅ 高级管理员账号已创建')
    console.log('   手机号: 13800000001')
    console.log('   昵称: 站长')
    console.log('   密码: admin123\n')
  } else {
    console.log('⏭  高级管理员已存在，跳过\n')
  }

  // 2. 初始化地图
  const mapCount = await db.gameMap.count()
  if (mapCount === 0) {
    for (const m of MAPS) {
      await db.gameMap.create({ data: m })
    }
    console.log(`✅ ${MAPS.length} 张地图已创建`)
  } else {
    console.log(`⏭  地图已有 ${mapCount} 条，跳过`)
  }

  // 3. 初始化特工
  const agentCount = await db.agent.count()
  if (agentCount === 0) {
    for (const a of AGENTS) {
      await db.agent.create({ data: a })
    }
    console.log(`✅ ${AGENTS.length} 名特工已创建`)
  } else {
    console.log(`⏭  特工已有 ${agentCount} 条，跳过`)
  }

  // 4. 创建欢迎公告
  const annCount = await db.announcement.count()
  if (annCount === 0) {
    const admin = await db.user.findFirst({ where: { role: 'SUPER_ADMIN' } })
    if (admin) {
      await db.announcement.create({
        data: {
          title: '欢迎来到酷点·无畏契约点位库',
          content: '本站为AI工具生产的非盈利素材站点，与游戏厂商无任何关联，所有内容版权归对应官方所有，仅供学习参考，禁止用于商业用途。',
          images: '[]',
          creatorId: admin.id,
        }
      })
      console.log('✅ 欢迎公告已创建')
    }
  } else {
    console.log(`⏭  公告已有 ${annCount} 条，跳过`)
  }

  // 汇总
  const counts = {
    users: await db.user.count(),
    maps: await db.gameMap.count(),
    agents: await db.agent.count(),
    spots: await db.spot.count(),
    announcements: await db.announcement.count(),
  }
  console.log('\n📊 数据库统计:')
  console.log(JSON.stringify(counts, null, 2))
}

main()
  .then(() => db.$disconnect())
  .catch((e) => { console.error(e); db.$disconnect(); process.exit(1) })
