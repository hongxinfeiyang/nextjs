# 第十四章：Next.js 15 → 16 迁移指南

本章系统梳理 Next.js 16（16.0 — 16.2）相比 15.x 的全部变更，包括新增 API、破坏性变更、迁移步骤和最佳实践。

---

## 14.1 破坏性变更速览

### 1. Node.js 18 停止支持

```bash
# Next.js 15
node -v   # ≥ 18.18 即可

# Next.js 16
node -v   # ≥ 20.9（强制！18.x 直接报错）
```

### 2. 异步 Dynamic APIs 强制

这是**影响最大的语法变更**。`params`、`searchParams`、`cookies()`、`headers()`、`draftMode()` 必须 `await`。

```tsx
// ❌ Next.js 15 旧写法（16 中直接报错）
export default function Page({ params, searchParams }) {
  const { slug } = params;           // 报错！
  const { q } = searchParams;        // 报错！
  const cookieStore = cookies();     // 报错！
  const headerList = headers();      // 报错！
}

// ✅ Next.js 16 正确写法
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { slug } = await params;
  const { q } = await searchParams;
  const cookieStore = await cookies();
  const headerList = await headers();
}
```

### 3. `middleware.ts` → `proxy.ts`

```bash
# 文件名变更
src/middleware.ts → src/proxy.ts

# 导出函数变更
export function middleware(req) {...}   # 旧
export default proxy(req) {...}         # 新
```

```ts
// src/proxy.ts（Next.js 16）
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

**关键变化：**
- Proxy 默认在 **Node.js 运行时**（不再是 Edge）
- 可以直接访问 `fs`、数据库等 Node.js API
- 不再支持返回 response body — 只能 redirect / rewrite / 修改 headers

### 4. `fetch()` 默认不缓存

```ts
// Next.js 15：自动缓存
const data = await fetch('/api/data');

// Next.js 16：每次请求都从源获取（新默认）
const data = await fetch('/api/data');

// 如需缓存，必须显式声明
const cached = await fetch('/api/data', {
  cache: 'force-cache',
});
```

### 5. 已移除的功能

| 移除项 | 替代方案 |
|--------|---------|
| AMP 支持 | 已完全移除 |
| `next lint` | 使用 ESLint CLI 直接运行 |
| `runtime configs` | 使用环境变量 |
| `experimental.ppr` | 用 `cacheComponents: true` |
| `images.domains` | 用 `images.remotePatterns` |
| `unstable_forceStale` | 已移除 |
| `unstable_noStore` | 用 `cache: 'no-store'` |

---

## 14.2 新增特性详解

### 14.3.1 Turbopack 成为默认打包器

Next.js 16 中 Turbopack 是**新项目的默认打包器**，开发体验大幅提升：

```
开发服务器启动：Webpack ~9.3s  → Turbopack ~1.8s（5× faster）
HMR 刷新：Webpack ~2.4s      → Turbopack ~230ms（10× faster）
生产构建：Webpack ~45s       → Turbopack ~18s（2.5× faster）
```

```bash
# 使用 Turbopack（默认）
next dev

# 如果必须用 Webpack
next dev --webpack
```

```ts
// next.config.ts — 禁用 Turbopack 回退到 Webpack
const nextConfig: NextConfig = {
  turbopack: false,
};
```

### 14.3.2 `"use cache"` 指令与 Cache Components

这是 Next.js 16 最重要的架构变更。从"隐式缓存"变为"显式缓存"。

```ts
// next.config.ts — 开启
const nextConfig: NextConfig = {
  cacheComponents: true,
  // 自定义缓存策略
  cacheLife: {
    transactional: { stale: 15, revalidate: 30, expire: 300 },
    analytical: { stale: 60, revalidate: 300, expire: 3600 },
  },
};
```

```ts
import { cacheLife, cacheTag } from 'next/cache';

export async function getProduct(id: string) {
  "use cache";                      // 编译器指令：标记此函数可缓存
  cacheLife("hours");               // 缓存多久
  cacheTag(`product-${id}`);        // 标签（用于失效）

  return db.product.findUnique({ where: { id } });
}
```

**`"use cache"` 三种模式：**

```ts
// 公开缓存（默认）— 所有用户共享
export async function getPublicData() {
  "use cache";
}

// 私有缓存 — 按用户隔离，允许 cookies() / headers()
export async function getUserData() {
  "use cache: private";
  const session = await auth();
  return db.user.findUnique({ where: { id: session.user.id } });
}

// 远程缓存 — 避免 Vercel Data Cache 标签冲突
export async function getSharedData() {
  "use cache: remote";
}
```

### 14.3.3 新的缓存失效 API

```ts
'use server';

import { revalidateTag, updateTag, refresh } from 'next/cache';

// revalidateTag：Next.js 16 需要第二个参数（缓写策略）
revalidateTag('products', 'max');              // 强制刷新到最新
revalidateTag('products', { expire: 0 });       // 自定义

// updateTag（新！）：立即清理客户端缓存，读你所写
export async function updateProduct(id: string, data: any) {
  "use server";
  await db.product.update({ where: { id }, data });
  updateTag(`product-${id}`); // 客户端立即看到新数据
}

// refresh()（新！）：只刷新未缓存数据，不破坏已有缓存
export async function refreshData() {
  "use server";
  refresh();
}
```

### 14.3.4 React 19.2 集成

Next.js 16 内置 React 19.2+，包含以下新特性：

**View Transitions（页面切换动画）**

```tsx
// next.config.ts
const nextConfig: NextConfig = {
  viewTransition: true,
};
```

```tsx
'use client';

import { useRouter } from 'next/navigation';

export function NavLink({ href, children }) {
  const router = useRouter();

  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        // 使用 startTransition 触发浏览器原生 View Transition
        document.startViewTransition(() => {
          router.push(href);
        });
      }}
    >
      {children}
    </a>
  );
}
```

**`useEffectEvent` — 无需依赖数组的稳定回调**

```tsx
'use client';

import { useEffect, useEffectEvent, useState } from 'react';

export function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState([]);

  // useEffectEvent 总是能读到最新的 roomId
  const onMessage = useEffectEvent((msg: Message) => {
    // 不需要把 roomId 放进依赖数组
    setMessages(prev => [...prev, msg]);
  });

  useEffect(() => {
    const connection = connect(roomId);
    connection.on('message', onMessage);
    return () => connection.disconnect();
  }, [roomId]); // onMessage 不在依赖中，effect 不会无谓重跑

  return <div>{/* 渲染消息 */}</div>;
}
```

**React Compiler（自动 memo 化）**

Next.js 16 中 React Compiler 可作为实验性选项开启，自动为组件和 hooks 插入 `useMemo` / `useCallback`：

```ts
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true, // 自动优化（Beta）
  },
};
```

### 14.3.5 AI 开发工具集成（16.2）

```bash
# create-next-app 现在自动生成 AGENTS.md
npx create-next-app@latest my-app
# 产物中包含 AGENTS.md，帮助 AI 编码助手理解项目结构

# 浏览器日志转发到终端（Agent 调试用）
# 开发模式下，浏览器 console.log 自动出现在终端
```

### 14.3.6 其他新增能力

**SRI（子资源完整性）**

```ts
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    sri: { algorithm: 'sha256' },
  },
};
// 自动为 <script> 和 <link> 添加 integrity 属性
```

**Hydration Diff Indicator**

开发环境下，当服务端/客户端 HTML 不一致时，错误提示会明确标记差异：

```
Server: <div className="dark">
Client: <div className="light">
         ^^^^^^^^^^^^^^^^ 差异在这里
```

**`<Activity />` 组件**

```tsx
import { Activity } from 'react';

export default function Tabs() {
  return (
    <Activity mode="hidden">
      {/* 切换到其他 tab 时不销毁，只隐藏 */}
      <HeavyComponent />
    </Activity>
  );
}
```

---

## 14.3 安全：Reactor2Shell 漏洞

2025 年 12 月发现的影响所有 RSC 框架的关键漏洞：

| CVE | 严重程度 | 影响 |
|-----|---------|------|
| CVE-2025-55182 | CVSS 9.8 | 未认证 RCE（远程代码执行） |
| CVE-2025-55183 | 中 | 源码泄露 |
| CVE-2025-55184 | 高 | 拒绝服务 |

**修复版本：** React ≥ 19.2.4 / Next.js ≥ 16.0.11（或 15.5.10+）

```jsonc
// package.json — 固定版本（不加 ^）
{
  "dependencies": {
    "next": "16.2.6",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  }
}
```

**安全加固建议：**
- 所有 Server Action 入参用 Zod 做白名单校验
- 固定依赖版本（不用 `^`）
- 给 RSC Flight 端点加速率限制
- 不要将服务端环境变量拼接到返回给客户端的 RSC payload 中

---

## 14.4 迁移步骤

### 自动化迁移（推荐）

```bash
# 第一步：运行升级 codemod
npx @next/codemod@latest upgrade

# 第二步：异步 API 迁移
npx @next/codemod@latest migrate-to-async-dynamic-apis

# 第三步：ESLint 配置迁移
npx @next/codemod@latest migrate-eslint-config

# 第四步：升级包版本
npm install next@latest react@latest react-dom@latest
```

### 手动迁移清单

```
□ Node.js ≥ 20.9
□ package.json 版本固定：next → 16.x, react → 19.2.x
□ 所有 params/searchParams 加上 await
□ 所有 cookies()/headers() 加上 await
□ middleware.ts → proxy.ts（导出函数重命名为 proxy）
□ 需要缓存的 fetch 显式加上 cache: 'force-cache'
□ experimental.ppr → cacheComponents: true
□ images.domains → images.remotePatterns
□ lint 脚本改为 eslint . --ext .ts,.tsx（不再用 next lint）
□ 移除所有 AMP 相关代码
□ 移除 runtime configs
□ 部署前完整回归测试
□ React 19.2.4+ / Next.js 16.0.11+（安全修复）
```

### 常见迁移问题

**Q：`params` 不 await 会怎样？**
A：Next.js 16 中会直接报错。同步访问已被移除。

**Q：不想改所有 fetch 加 `cache: 'force-cache'` 怎么办？**
A：可以在 `next.config.ts` 中设置全局 fetch 缓存行为，但不推荐。显式声明更安全。

**Q：还能继续用 `middleware.ts` 吗？**
A：16.x 中仍然可用但会显示废弃警告。17.x 中将彻底移除。

**Q：`revalidateTag` 只传一个参数怎么办？**
A：仍然生效但走旧版缓存路径。16.x 推荐传两个参数（tag + profile）。

---

## 14.5 15 vs 16 对比总表

| 维度 | Next.js 15 | Next.js 16 |
|------|-----------|-----------|
| Node.js | ≥ 18.18 | ≥ 20.9 |
| React | 19.0.x | 19.2.x |
| 打包器 | Webpack（默认） | **Turbopack**（默认） |
| params/searchParams | 同步（已废弃） | **async await 强制** |
| cookies()/headers() | 同步（已废弃） | **async await 强制** |
| fetch 缓存 | 默认缓存 | **默认不缓存** |
| 显式缓存 | 无 | **`"use cache"` 指令** |
| 缓存失效 | `revalidateTag(tag)` | `revalidateTag(tag, profile)` + `updateTag()` + `refresh()` |
| Middleware | `middleware.ts` (Edge) | **`proxy.ts`** (Node.js) |
| PPR | `experimental.ppr` | **`cacheComponents: true`** |
| 页面过渡 | 需第三方库 | **View Transitions** 原生支持 |
| useEffect 回调 | 需放依赖数组中 | **`useEffectEvent`** 免依赖 |
| 图片域名 | `images.domains` (废弃) | `images.remotePatterns` |
| Lint | `next lint` | ESLint CLI |
| AMP | 支持 | **已移除** |

---

## 14.6 学习路径建议

本书前 13 章的核心概念在 Next.js 16 中**仍然完全适用**。16 的变化主要在于：

1. **API 语法更新**（async await 强制、middleware→proxy）— 代码写法变了，思想不变
2. **缓存模型变化**（"use cache"、fetch 默认不缓存）— 需要理解新的显式缓存体系
3. **工具链升级**（Turbopack、View Transitions、AI DevTools）— 开发体验提升
4. **安全强化**（Reactor2Shell 修复）— 必须升级到最新版本

建议按原顺序学习前 13 章，在遇到上述差异项时参考本章的对应说明。

---

## 练习

1. 将一个 Next.js 15 项目用 codemod 升级到 16，记录迁移过程
2. 用 `"use cache"` 重写一个原有 fetch 缓存为显式缓存
3. 配置 `cacheComponents: true` 并体验部分预渲染
4. 将 `middleware.ts` 改为 `proxy.ts`，测试路由保护是否正常
5. 用 `useEffectEvent` 优化一个现有的 `useEffect` 调用
6. 测试 `revalidateTag` 的双参数用法和 `updateTag` 效果
