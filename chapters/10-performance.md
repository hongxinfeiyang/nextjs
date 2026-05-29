# 第十章：性能优化与部署最佳实践

---

## 10.1 Core Web Vitals 与 Lighthouse

### 三大核心指标

| 指标 | 含义 | 良好阈值 |
|------|------|---------|
| **LCP** (Largest Contentful Paint) | 最大内容绘制时间 | ≤ 2.5s |
| **INP** (Interaction to Next Paint) | 交互响应延迟 | ≤ 200ms |
| **CLS** (Cumulative Layout Shift) | 累积布局偏移 | ≤ 0.1 |

### Next.js 中的测量方式

```tsx
// src/app/_components/web-vitals.tsx
'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // 发送到分析服务（如 Google Analytics、Vercel Analytics）
    console.log(metric);

    // 或发送到自定义端点
    if (metric.name === 'LCP' && metric.value > 2500) {
      // 告警：LCP 超标
    }
  });

  return null;
}
```

```tsx
// src/app/layout.tsx
import { WebVitalsReporter } from './_components/web-vitals';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <WebVitalsReporter />
        {children}
      </body>
    </html>
  );
}
```

---

## 10.2 Bundle Analysis

```bash
npm install @next/bundle-analyzer
```

```ts
// next.config.ts
import withBundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzerConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // ...
};

export default withBundleAnalyzerConfig(nextConfig);
```

```bash
# 分析打包结果
ANALYZE=true npm run build
```

### 解读打包报告

```
重点关注的指标：
├─ First Load JS（首次加载 JS 大小）
├─ Shared chunks（所有页面共享的代码）
├─ 单个页面是否过大（>200KB 需要关注）
└─ 是否有重复打包的库
```

### 常见优化方向

```tsx
// ❌ 坏：导入整个库
import { debounce, throttle, cloneDeep } from 'lodash'; // ~70KB

// ✅ 好：按需导入
import debounce from 'lodash/debounce'; // ~5KB
```

---

## 10.3 代码分割策略

### 动态导入组件

```tsx
import dynamic from 'next/dynamic';

// 基础用法：延迟加载
const HeavyChart = dynamic(() => import('@/components/heavy-chart'), {
  loading: () => <div className="h-64 animate-pulse bg-gray-100 rounded" />,
  ssr: false, // 仅在客户端渲染（适合依赖浏览器 API 的库）
});

export default function DashboardPage() {
  return (
    <div>
      <h1>仪表盘</h1>
      <HeavyChart data={...} />
    </div>
  );
}
```

### 按路由自动分割

Next.js 自动按路由分割代码 —— 用户访问 `/about` 时，不会下载 `/dashboard` 的 JavaScript。

### 按组件手动分割

```tsx
// 条件加载：用户点击后才加载
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const Modal = dynamic(() => import('@/components/modal'));

export function Page() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <button onClick={() => setShowModal(true)}>打开</button>
      {showModal && <Modal onClose={() => setShowModal(false)} />}
    </div>
  );
}
```

### 第三方库的 Tree-shaking

```tsx
// ❌ 坏：导入整个图标库（~500KB gzipped）
import { FaHome, FaUser, FaCog } from 'react-icons/fa';

// ✅ 好：使用支持 tree-shaking 的图标库如 lucide-react
import { Home, User, Settings } from 'lucide-react';

// ✅ 或者：动态导入图标
import dynamic from 'next/dynamic';
const FaHome = dynamic(() => import('react-icons/fa').then(m => m.FaHome));
```

---

## 10.4 图片性能最佳实践

### `next/image` 全面优化

```tsx
import Image from 'next/image';

// 首屏大图：priority（禁用懒加载）
export function HeroImage() {
  return (
    <Image
      src="/hero.jpg"
      alt="首屏横幅"
      fill
      priority           // 立即加载，不等待 JS
      sizes="100vw"
      quality={85}       // 质量 85%（平衡质量和大小）
      className="object-cover"
    />
  );
}

// 正文插图：标准用法
export function ContentImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={450}
      sizes="(max-width: 768px) 100vw, 800px"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  );
}

// 头像类小图：指定小尺寸
export function Avatar({ src }: { src: string }) {
  return (
    <Image
      src={src}
      alt="头像"
      width={48}
      height={48}
      className="rounded-full"
      sizes="48px"       // 固定尺寸，不需要更大
    />
  );
}
```

### 图片格式优先级

```
AVIF > WebP > JPEG/PNG
```

Next.js 通过 `next/image` 自动检测浏览器支持并选择最优格式。

### 响应式图片 — 使用 `<picture>`

```tsx
// 艺术方向：不同屏幕使用不同比例/裁切的图片
export function ResponsiveHero() {
  return (
    <picture>
      <source srcSet="/hero-desktop.jpg" media="(min-width: 1024px)" />
      <source srcSet="/hero-tablet.jpg" media="(min-width: 640px)" />
      <Image
        src="/hero-mobile.jpg"
        alt="Hero"
        width={640}
        height={360}
        className="w-full"
      />
    </picture>
  );
}
```

---

## 10.5 字体加载与 CLS 优化

### 字体引起的 CLS 问题

```
没有 fallback 字体：
  [空白] → [系统字体] → [Web 字体加载完成，字体大小不同导致页面跳动]
                       ↑ 布局偏移 (CLS)

使用 next/font + fallback：
  [先用系统字体占位] → [Web 字体无缝替换]
  ↑ 有 font-size-adjust / size-adjust 确保占位字体与 Web 字体尺寸一致
```

### `next/font` 自动优化

```tsx
import { Inter } from 'next/font/google';

// next/font 自动做的事：
// 1. 字体子集化（只包含页面用到的字符）
// 2. 自托管（无需 Google 服务器，减少 DNS 查询）
// 3. 生成后备字体尺寸调整
// 4. 使用 font-display: swap（先显示系统字体）
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,         // 预加载（默认）
});

export default function Layout({ children }) {
  return <html className={inter.className}>{children}</html>;
}
```

---

## 10.6 缓存策略调优

### 四层缓存的调优

```tsx
// 1. Data Cache — 给 fetch 设置合理的 revalidate
export default async function ProductsPage() {
  const products = await fetch('https://api.example.com/products', {
    next: {
      revalidate: 60,     // 60 秒后过期
      tags: ['products'], // 可按需失效
    },
  }).then(r => r.json());

  return <ProductList products={products} />;
}
```

```tsx
// 2. 页面级 revalidate
export const revalidate = 3600; // 1 小时后重新生成
```

```ts
// 3. 手动缓存控制 — 使用 unstable_cache（Next.js 14+）
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';

// 包装数据库查询，使用 Data Cache
const getProducts = unstable_cache(
  async (category: string) => {
    return db.product.findMany({ where: { category } });
  },
  ['products-by-category'], // cache key
  { revalidate: 3600, tags: ['products'] },
);
```

```tsx
// 4. 客户端 Router Cache — 不需要手动调优，Next.js 自动处理
// 但可以通过以下方式手动失效：
import { useRouter } from 'next/navigation';

export function RefreshButton() {
  const router = useRouter();
  return (
    <button onClick={() => router.refresh()}>
      刷新数据（使当前路由的 RSC 缓存失效）
    </button>
  );
}
```

---

## 10.7 服务端性能优化

### 数据库查询优化

```ts
// ✅ 使用索引
// prisma/schema.prisma
model Post {
  // ...
  @@index([published, createdAt])  // 复合索引
}

// ✅ 只查询需要的字段
const posts = await db.post.findMany({
  select: { id: true, title: true, createdAt: true }, // 不要 select *
  where: { published: true },
});

// ✅ 批量操作
await db.post.updateMany({
  where: { authorId: oldAuthorId },
  data: { authorId: newAuthorId },
});

// ❌ 避免在循环中查询
for (const post of posts) {
  const author = await db.user.findUnique(...); // N+1
}
// ✅ 使用 IN 查询一次搞定
const authorIds = [...new Set(posts.map(p => p.authorId))]; // 去重
const authors = await db.user.findMany({
  where: { id: { in: authorIds } },
});
```

### 边缘计算

```ts
// 将轻量级 API 放到边缘运行，减少延迟
// src/app/api/edge-geo/route.ts
export const runtime = 'edge'; // 在 Edge Runtime 中运行

export async function GET(request: Request) {
  // Edge 可直接访问 geolocation
  const country = request.headers.get('x-vercel-ip-country') ?? 'unknown';
  return Response.json({ country });
}
```

### 避免服务端性能陷阱

```
❌ 大循环中的同步阻塞操作
❌ 未设索引的数据库查询
❌ 跨请求共享的可变状态
❌ 在每个请求中创建新的数据库连接
❌ 忘记 await → 导致 Promise 泄漏
```

---

## 10.8 部署方案

### Vercel（推荐，零配置）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel

# 生产部署
vercel --prod
```

Vercel 自动提供：
- 全球 CDN 分发
- 边缘函数
- 自动 HTTPS
- 预览部署（每个 PR 独立 URL）

### Docker 部署

```dockerfile
# Dockerfile — 多阶段构建
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

```ts
// next.config.ts — 开启 standalone 输出（Docker 必需）
const nextConfig: NextConfig = {
  output: 'standalone',
};
```

```bash
# 构建与运行
docker build -t my-next-app .
docker run -p 3000:3000 -e DATABASE_URL=... my-next-app
```

### 自托管（Node.js 服务器）

```bash
npm run build
npm run start   # 默认端口 3000，可通过 PORT=8080 修改
```

---

## 10.9 CI/CD 流水线

### GitHub Actions 示例

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports: ['5432:5432']

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci
      - run: npx prisma generate
      - run: npx prisma migrate deploy
      - run: npm run lint
      - run: npm run type-check
      - run: npm test
      - run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
```

### 部署流水线（Vercel）

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 性能自查清单

```
构建与打包：
□ 打包大小 < 200KB (首次加载 JS)
□ 没有重复打包的依赖
□ 大组件使用 dynamic import 懒加载
□ 第三方库支持 tree-shaking

图片与字体：
□ 使用 next/image（不要用原生 img）
□ 首屏图片设置 priority
□ 远程图片配置 remotePatterns
□ 使用 next/font（不要用 CDN link）

渲染：
□ 静态页面尽量 SSG/ISR
□ 动态内容使用 Suspense + Streaming
□ 'use client' 边界尽可能低
□ 列表使用 key 且 key 稳定

数据：
□ 数据库查询有索引
□ fetch 设置合理的 revalidate
□ 避免 N+1 查询
□ 并行请求使用 Promise.all 或组件级 Suspense

部署：
□ 开启 gzip/brotli 压缩
□ 配置 CDN
□ 使用连接池管理数据库连接
□ CI 中包含 lint + type-check + test + build
```

## 练习

1. 用 `@next/bundle-analyzer` 分析项目打包，发现并修复一个体积问题
2. 将一个页面中的大组件改为 `dynamic import` 懒加载
3. 用 Lighthouse 审计你的应用，尝试将 LCP 降至 2.5s 以下
4. 编写一个 Dockerfile 并成功部署到本地 Docker
5. 搭建一个 GitHub Actions CI，包含 lint、type-check、build
