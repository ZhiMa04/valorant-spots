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

## fullstack-dev skill

- 初始化: `curl https://z-cdn.chatglm.cn/fullstack/init-fullstack.sh | bash`
- 项目结构: Next.js 16 + Prisma + SQLite + shadcn/ui + Tailwind CSS 4
- Prisma 推送: `node node_modules/prisma/build/index.js db push --accept-data-loss`（prisma CLI 可能不在 PATH）
- Prisma 关系字段需要双向声明，否则 `db push` 报 P1012
