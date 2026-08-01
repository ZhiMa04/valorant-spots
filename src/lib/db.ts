import { PrismaClient } from '@prisma/client'

// 如果环境变量 DATABASE_URL 未设置，使用硬编码的连接字符串（Neon Postgres）
// 注意：生产环境建议通过 Vercel 环境变量配置 DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_h7IkqaA3Hsmy@ep-muddy-boat-aw9lrnb7-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: databaseUrl,
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
