# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Next.js 16 + Turbopack 环境问题

- **问题**: Next.js 16 默认用 Turbopack，但 `@next/swc-linux-x64-gnu` 在 Debian glibc 环境下可能未安装，导致 `turbo.createProject is not supported by the wasm bindings`
- **解决**: 用 `node node_modules/next/dist/bin/next dev --webpack` 启动 dev（注意 `--no-turbopack` 不存在），build 同理加 `--webpack`
- **生产启动**: `next build --webpack` → `cp -r .next/static .next/standalone/.next/` → `cp -r public .next/standalone/` → `cd .next/standalone && node server.js`
- **绑定地址**: 生产模式 server.js 默认绑定到内网 IP 而非 0.0.0.0，curl localhost 可能 000，需用 `ss -tlnp | grep 3000` 查实际地址

## Agent Browser

- `agent-browser open <url> --timeout 30000` 打开页面
- `agent-browser snapshot -i` 获取可交互元素 ref 列表（只抓语义角色，非语义 div 不会出现）
- 非语义内容用 `agent-browser read` 获取纯文本
- `agent-browser screenshot --full` 截全页
- `agent-browser fill @ref "text"` 填输入框；`agent-browser click @ref` 点击

## send_file 交付 web_project

- ext='web_project' 时 file_path 必须是 .html/.jsx/.tsx/.vue
- **Next.js .tsx 入口在 AgentMore 平台会显示为代码预览而非运行网站**——对非技术用户不可用
- **纯单文件 HTML 是唯一可靠的可预览交付格式**——所有 CSS/JS 内联，数据存 localStorage/IndexedDB，零后端依赖

## Vercel 部署经验

- **Vercel + GitHub 自动部署**: 推代码到 GitHub main 分支 → Vercel 自动检测并构建
- **Vercel 构建缓存**: `prisma generate` 在 `postinstall` 运行；构建脚本 `prisma generate && prisma db push --accept-data-loss && next build` 确保 schema 推送到 Neon
- **环境变量冲突**: Vercel Blob 存储的 `BLOB_STORE_ID` 被 managed connection 锁住无法删除，解决方式：在代码里 hardcode `storeId` 和 `token` 绕过
- **Blob 存储必须选 Public**: Private 存储上传时报 "Cannot use public access on a private store"
- **Neon Postgres**: 免费版够用，Singapore 节点国内访问最快
- **构建失败排查**: 看 Vercel Deployments → 最新记录 → Build Logs，红色错误行有具体原因
- **部署 URL**: 每次 push 生成新 URL，生产域名固定在 Vercel Domains 页面配置
- **自定义域名**: 阿里云买域名 → DNS 加 A 记录(216.198.79.1) + CNAME(cname.vercel-dns.com) → Vercel Settings→Domains 添加
- **`.env` 文件**: 可以提交到仓库让 Prisma 在构建时读取 DATABASE_URL，但安全起见应通过 Vercel 环境变量配置
- **`useState` 导入**: page.tsx 用 `'use client'` + `useState` 时必须 `import { useState } from 'react'`，否则 Vercel 构建报 `ReferenceError: useState is not defined`

## 图片优化

- 用 `sharp` 压缩 PNG → WebP：地图 800px/70%质量 → 500px/70%质量，特工 200px → 120px
- 13 张地图 + 29 张特工从 56MB 压到 316KB
- `SmartImage` 组件：骨架占位 + `decoding="async"` + `loading="lazy"` + 渐显动画
- Vercel Blob 上传图片时 `put(filename, file, { access: 'public', token, storeId })`
