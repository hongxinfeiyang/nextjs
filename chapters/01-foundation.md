# 第一章：Next.js 基础 — 项目搭建与核心概念

> **适用版本：** Next.js 16.x (App Router)，React 19.2+
> **前置要求：** Node.js 20.9+

---

## 1.1 Next.js 是什么？

Next.js 是一个构建在 React 之上的**全栈 Web 框架**，由 Vercel 公司维护。它解决了纯 React 应用的几个核心痛点：

- **路由**：React 本身没有路由，需要 react-router 等第三方库；Next.js 基于文件系统自动生成路由
- **渲染**：React 默认 CSR（客户端渲染），SEO 差、首屏慢；Next.js 提供 SSR/SSG/ISR 多种渲染策略
- **数据获取**：React 中数据获取通常写在 `useEffect` 中，导致请求瀑布流；Next.js 支持服务端直接获取
- **构建**：React 需要手动配置 Webpack/Vite；Next.js 开箱即用，零配置

### 核心设计理念

```核心设计理念
┌─────────────────────────────────────────────┐
│                  Next.js                      │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │  React   │  │  Router  │  │   Builder   │ │
│  │ Server   │  │  (FS)    │  │  (Turbopack)│ │
│  │ Component│  │          │  │             │ │
│  └──────────┘  └──────────┘  └────────────┘ │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │  Image   │  │   Font   │  │ Middleware  │ │
│  │  Optimize│  │   Optimize│  │             │ │
│  └──────────┘  └──────────┘  └────────────┘ │
└─────────────────────────────────────────────┘
```

---

## 1.2 环境准备与项目创建

### 系统要求

- **Node.js 20.9+**（Next.js 16 不再支持 Node.js 18）
- npm / yarn / pnpm / bun 任一包管理器

```bash
# 检查版本
node -v   # ≥ 20.9
npm -v    # ≥ 10.0
```

### 创建项目

```bash
# 推荐方式：使用 create-next-app
npx create-next-app@latest my-next-app

# 交互式选项说明：
# ✔ TypeScript?               → Yes（强烈推荐）
# ✔ ESLint?                   → Yes
# ✔ Tailwind CSS?             → Yes（推荐）
# ✔ `src/` directory?         → Yes（推荐，结构更清晰）
# ✔ App Router?               → Yes（默认，本文基于 App Router）
# ✔ Turbopack for dev?        → Yes（**Next.js 16 起 Turbopack 已是默认打包器，不再询问**）
# ✔ Import alias (@/*)?       → Yes（默认，路径更简洁）
# ✔ Customize default import alias? → No
```

---

## 1.3 目录结构详解

```
my-next-app/
├── src/
│   ├── app/                    # App Router 核心目录
│   │   ├── layout.tsx          # 根布局（必须存在）
│   │   ├── page.tsx            # 首页 /
│   │   ├── globals.css         # 全局样式
│   │   ├── favicon.ico         # 网站图标
│   │   └── (routes)/           # 你的路由放在这里
│   ├── components/             # 公共组件
│   ├── lib/                    # 工具函数、SDK 封装
│   └── styles/                 # 额外样式文件
├── public/                     # 静态资源（图片、字体等）
│   └── images/
├── next.config.ts              # Next.js 配置文件
├── tailwind.config.ts          # Tailwind CSS 配置
├── tsconfig.json               # TypeScript 配置
├── package.json
└── .env.local                  # 环境变量（不提交到 Git）
```

### 关键文件约定

| 文件名 | 作用 | 说明 |
|--------|------|------|
| `page.tsx` | 页面 | 该路由下对外可访问的 UI |
| `layout.tsx` | 布局 | 包裹子页面的共享 UI，切换页面时**保留状态** |
| `loading.tsx` | 加载态 | 页面数据加载时的 Suspense fallback |
| `error.tsx` | 错误边界 | 捕获该路由下组件的错误 |
| `not-found.tsx` | 404 | 未匹配路由时的 UI |
| `route.ts` | API 路由 | 处理 HTTP 请求（不能与 page.tsx 共存） |
| `template.tsx` | 模板 | 类似 layout，但切换时**重新挂载** |

---

## 1.4 开发与构建命令

```bash
# 开发服务器（热更新，Turbopack 加速）
npm run dev
# 默认 http://localhost:3000

# 生产构建
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint
```

### `next dev` 的底层流程

```
npm run dev
  │
  ├─ 1. 启动 Turbopack/Webpack 开发服务器
  ├─ 2. 编译所有页面和路由
  ├─ 3. 开启 HMR (Hot Module Replacement)
  ├─ 4. 监听文件变化，按需重新编译
  └─ 5. 在 http://localhost:3000 提供服务
```

### `next build` 做了什么？

```
npm run build
  │
  ├─ 1. TypeScript 类型检查
  ├─ 2. ESLint 检查
  ├─ 3. 编译和打包（代码分割、Tree-shaking）
  ├─ 4. 静态页面预渲染（SSG）
  ├─ 5. 生成构建清单（路由表、chunk 映射）
  └─ 6. 输出到 .next/ 目录
```

构建输出解读：

```
.next/
├── static/           # 静态资源（JS/CSS chunks）
├── server/           # 服务端代码
│   ├── app/          # App Router 页面
│   └── pages/        # Pages Router（如使用）
├── cache/            # 构建缓存
├── types/            # TypeScript 类型
└── BUILD_ID          # 构建唯一标识
```

---

## 1.5 TypeScript 配置

```jsonc
// tsconfig.json — 推荐配置
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,                     // 开启严格模式
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",      // Next.js 15+ 推荐
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]                // 路径别名
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

> **重要：** `strict: true` 能帮你提前发现大量潜在 bug，Next.js 官方强烈推荐。

---

## 1.6 第一个页面

### Hello World

```tsx
// src/app/page.tsx
export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-4xl font-bold">Hello, Next.js!</h1>
    </main>
  );
}
```

访问 `http://localhost:3000` 即可看到效果。

### 带动态数据的页面

```tsx
// src/app/page.tsx
// 默认是 Server Component，可以直接 async
export default async function HomePage() {
  // 直接在组件中 fetch，Next.js 会自动缓存和去重
  const res = await fetch('https://api.github.com/repos/vercel/next.js');
  const repo = await res.json();

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">{repo.full_name}</h1>
      <p className="mt-2 text-gray-600">{repo.description}</p>
      <div className="mt-4 flex gap-4">
        <span>⭐ {repo.stargazers_count.toLocaleString()}</span>
        <span>🍴 {repo.forks_count.toLocaleString()}</span>
      </div>
    </main>
  );
}
```

### 客户端交互页面

```tsx
// src/app/counter/page.tsx
'use client'; // ← 这行标记为客户端组件

import { useState } from 'react';

export default function CounterPage() {
  const [count, setCount] = useState(0);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">计数器</h1>
      <p className="text-6xl font-mono">{count}</p>
      <div className="flex gap-2">
        <button
          onClick={() => setCount(c => c - 1)}
          className="rounded bg-red-500 px-4 py-2 text-white"
        >
          -1
        </button>
        <button
          onClick={() => setCount(c => c + 1)}
          className="rounded bg-blue-500 px-4 py-2 text-white"
        >
          +1
        </button>
      </div>
    </main>
  );
}
```

---

---

:::demo counter
:::

:::demo data-fetching
:::

## 本章关键概念回顾

| 概念 | 一句话总结 |
|------|-----------|
| App Router | 基于文件系统的路由方案，`app/` 目录下的每个文件夹 = 一个路由 |
| Server Component | 默认组件类型，在服务端运行，可直接 `async/await` |
| Client Component | 用 `'use client'` 声明，可用的 hooks 和浏览器 API |
| `layout.tsx` | 持久布局，切换页面时不重新挂载 |
| `page.tsx` | 路由对应的页面内容 |

## 练习

1. 创建一个新的 Next.js 项目，尝试修改 `layout.tsx` 的标题和描述
2. 创建 `/about` 路由，编写一个静态的关于页面
3. 使用 `'use client'` 创建一个带有计数器和表单输入的交互页面
4. 尝试在 Server Component 中用 `fetch` 获取一个公开 API 的数据并展示
