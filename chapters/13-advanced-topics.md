# 第十三章：补充主题 — 进阶知识全景

本章补全前面 12 章未覆盖或未展开的知识点，包含 Script 组件、静态导出、MDX、环境变量、SEO 完整方案、Proxy/Rewrites、better-auth、Cookies API、国际化、PWA、Edge Runtime 等。

---

## 目录

- [13.1 Script 组件](#131-script-组件-nextscript)
- [13.2 静态导出](#132-静态导出-static-export)
- [13.3 MDX 支持](#133-mdx-支持)
- [13.4 环境变量详解](#134-环境变量详解)
- [13.5 SEO 完整方案](#135-seo-完整方案)
- [13.6 Proxy 与 Rewrites](#136-proxy-与-rewrites)
- [13.7 better-auth 认证](#137-better-auth-认证)
- [13.8 Cookies API 详解](#138-cookies-api-详解)
- [13.9 Redirect 详解](#139-redirect-详解)
- [13.10 国际化 (i18n)](#1310-国际化-i18n)
- [13.11 PWA 支持](#1311-pwa-支持)
- [13.12 Edge Runtime 详解](#1312-edge-runtime-详解)
- [13.13 配置文件完整参考](#1313-配置文件完整参考)

---

## 13.1 Script 组件 (`next/script`)

`next/script` 是 Next.js 内置的脚本加载组件，用于加载第三方脚本（分析、广告、客服等），它扩展了 HTML `<script>` 标签并提供了加载策略控制。

### 加载策略

| 策略 | 行为 | 适用场景 |
|------|------|---------|
| `beforeInteractive` | 在页面可交互**之前**加载（服务端注入） | 需要在 JS 执行前就绪的脚本（极少用） |
| `afterInteractive` | 在页面可交互**之后**加载（**默认**） | 分析、广告、聊天工具 |
| `lazyOnload` | 浏览器空闲时加载 | 低优先级脚本（客服、社交媒体） |
| `worker` | 在 Web Worker 中加载 | 密集型计算脚本 |

### 基础用法

```tsx
// src/app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        {children}

        {/* 第三方分析脚本 — afterInteractive（默认） */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
          strategy="afterInteractive"
        />

        {/* 内联脚本 */}
        <Script id="gtag-config" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>
      </body>
    </html>
  );
}
```

### 按需加载脚本

```tsx
// 仅在特定页面加载
import Script from 'next/script';

export default function PaymentPage() {
  return (
    <div>
      <h1>支付</h1>
      {/* 仅在支付页加载 Stripe */}
      <Script
        src="https://js.stripe.com/v3/"
        strategy="lazyOnload"
      />
    </div>
  );
}
```

### onLoad / onError 事件

```tsx
'use client';

import Script from 'next/script';

export function MapPage() {
  return (
    <Script
      src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`}
      strategy="afterInteractive"
      onLoad={() => console.log('地图脚本加载完成')}
      onReady={() => console.log('地图脚本就绪，可调用 API')}
      onError={(e) => console.error('地图脚本加载失败', e)}
    />
  );
}
```

### inline 脚本的注意事项

```tsx
// ✅ 内联脚本必须有 id，Next.js 用它来去重和追踪
<Script id="my-inline-script" strategy="afterInteractive">
  {`console.log('inline script');`}
</Script>

// ❌ 缺少 id 会触发警告
<Script strategy="afterInteractive">
  {`console.log('no id');`}
</Script>
```

---

## 13.2 静态导出 (Static Export)

当你的网站**完全不需要服务端运行时**（例如文档站、落地页），可以使用 `next build` 生成纯静态文件。

### 开启静态导出

```ts
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',  // ← 开启静态导出模式
  // 可选：自定义导出目录
  distDir: 'out',
  // 可选：如果部署在子路径，设置 basePath
  basePath: '/docs',
  // 可选：图片优化（需要设置 images.unoptimized）
  images: {
    unoptimized: true, // 静态导出不支持 next/image 优化
  },
};

export default nextConfig;
```

### 静态导出模式的限制

```
❌ 不能用 Server Components（async/await 数据获取）
❌ 不能用 Server Actions
❌ 不能用 Route Handlers (route.ts)
❌ 不能用 Middleware
❌ 不能用 ISR (revalidate)
❌ 不能用 next/image 的服务器端优化
❌ 不能用 cookies() / headers()
❌ 不能用 redirect() / notFound() (动态版本)

✅ 可以用 SSG（generateStaticParams + 构建时 fetch）
✅ 可以用 'use client' 组件
✅ 可以用 SWR / TanStack Query 做客户端数据获取
✅ 部署到任意静态托管（GitHub Pages、Cloudflare Pages、S3）
```

### 生成完整静态站点

```tsx
// src/app/blog/[slug]/page.tsx
type Props = { params: Promise<{ slug: string }> };

// 必须！告诉 Next.js 构建时生成哪些页面
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then(r => r.json());
  return posts.map((p: { slug: string }) => ({ slug: p.slug }));
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  // 在 SSG 模式下，这个 fetch 只在构建时执行
  const post = await fetch(`https://api.example.com/posts/${slug}`).then(r => r.json());

  return <article>{post.content}</article>;
}
```

### 构建输出

```bash
npm run build
# 输出到 out/ 目录：
# out/
# ├── index.html
# ├── about.html
# ├── blog/
# │   ├── post-1.html
# │   └── post-2.html
# └── _next/
#     └── static/       # JS/CSS chunks
```

### 部署到 GitHub Pages

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

---

## 13.3 MDX 支持

MDX 让你在 Markdown 中直接使用 React 组件，适合文档、博客等内容型站点。

### 配置 MDX

```bash
npm install @next/mdx @mdx-js/loader @mdx-js/react @types/mdx
```

```ts
// next.config.ts
import createMDX from '@next/mdx';

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
};

export default withMDX(nextConfig);
```

### 编写 MDX 页面

```mdx
<!-- src/app/blog/my-post/page.mdx -->
import { Callout } from '@/components/callout';
import { CodeBlock } from '@/components/code-block';

# Next.js 性能优化指南

<Callout type="info">
  本文基于 Next.js 15 编写
</Callout>

## 一、图片优化

使用 `next/image` 可以自动优化图片：

<CodeBlock language="tsx">
{`import Image from 'next/image';

export function Hero() {
  return <Image src="/hero.jpg" alt="Hero" width={1200} height={600} priority />;
}`}
</CodeBlock>

## 二、性能数据

| 优化前 | 优化后 |
|--------|--------|
| LCP 4.2s | LCP 1.8s |
| CLS 0.25 | CLS 0.02 |
```

### 自定义 MDX 组件

```tsx
// src/mdx-components.tsx — MDX 组件的全局映射
import type { MDXComponents } from 'mdx/types';
import { CodeBlock } from '@/components/code-block';
import { Callout } from '@/components/callout';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // 自定义 h1-h6
    h1: (props) => <h1 className="mb-6 text-3xl font-bold" {...props} />,
    h2: (props) => <h2 className="mb-4 mt-8 text-2xl font-semibold" {...props} />,
    h3: (props) => <h3 className="mb-3 mt-6 text-xl font-semibold" {...props} />,

    // 自定义代码块
    pre: (props) => <CodeBlock {...props} />,

    // 自定义链接
    a: (props) => <a className="text-blue-500 underline" {...props} />,

    // 引入的自定义组件自动可用（无需手动注册）
    ...components,
  };
}
```

```tsx
// src/app/mdx-layout.tsx — MDX 页面的布局
import { MDXProvider } from '@mdx-js/react';
import { useMDXComponents } from '@/mdx-components';

export default function MDXLayout({ children }: { children: React.ReactNode }) {
  const components = useMDXComponents({});
  return <MDXProvider components={components}>{children}</MDXProvider>;
}
```

### MDX 与 Contentlayer / Velite

对于内容驱动的站点，推荐使用 **Velite**（轻量级 Contentlayer 替代）：

```ts
// velite.config.ts
import { defineConfig } from 'velite';

export default defineConfig({
  collections: {
    posts: {
      name: 'Post',
      pattern: 'content/posts/**/*.mdx',
      schema: (z) => ({
        title: z.string(),
        slug: z.string(),
        description: z.string(),
        publishedAt: z.string(),
        tags: z.array(z.string()).optional(),
        content: z.string(),
      }),
    },
  },
});
```

---

## 13.4 环境变量详解

### 文件加载优先级

```
.env.local          ← 最高优先级，不提交到 Git（存放密钥）
.env.development    ← 开发环境专用（npm run dev）
.env.production     ← 生产环境专用（npm run build / npm start）
.env                ← 所有环境默认值，提交到 Git

npm run dev 时的加载顺序：
.env → .env.development → .env.local
（后加载的覆盖前面同名的）

npm run build / npm start 时的加载顺序：
.env → .env.production → .env.local
```

### 两种前缀

```env
# .env.local

# 服务端变量：只有 Server Components / Server Actions / Route Handlers 能访问
DATABASE_URL="postgresql://localhost:5432/mydb"
STRIPE_SECRET_KEY="sk_live_xxxxx"
AUTH_SECRET="my-secret-32-chars"

# 客户端变量：浏览器 JS 中也能读取（必须以 NEXT_PUBLIC_ 开头）
NEXT_PUBLIC_APP_URL="https://example.com"
NEXT_PUBLIC_ANALYTICS_ID="G-XXXXXXXXXX"
```

```tsx
// Server Component — 两类变量都能读
export default async function Page() {
  // ✅ 服务端变量，安全
  const dbUrl = process.env.DATABASE_URL;

  // ✅ 客户端变量，服务端也能读
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  return <div>...</div>;
}
```

```tsx
// Client Component — 只能读 NEXT_PUBLIC_*
'use client';

export function Analytics() {
  // ✅ 可以读取（在构建时内联到客户端 bundle 中）
  const analyticsId = process.env.NEXT_PUBLIC_ANALYTICS_ID;

  // ❌ undefined！服务端变量不会暴露到客户端
  // const secretKey = process.env.STRIPE_SECRET_KEY;

  return <script>{/* 使用 analyticsId */}</script>;
}
```

### 环境变量安全原则

```
1. 密钥类变量永远不用 NEXT_PUBLIC_ 前缀
2. .env.local 文件加入 .gitignore（默认已加入）
3. 生产环境变量在部署平台设置（Vercel / GitHub Actions Secrets）
4. 不要在 Server Actions 中把服务端变量返回给客户端
5. 使用 .env.example 记录所需变量（不含真实值）
```

---

## 13.5 SEO 完整方案

### robots.txt

```ts
// src/app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://example.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/checkout/', '/profile/'],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

访问 `https://example.com/robots.txt` 会自动生成。

### sitemap.xml

```ts
// src/app/sitemap.ts
import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://example.com';

  // 静态路由
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  // 动态路由 — 商品
  const products = await db.product.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
  });

  const productRoutes: MetadataRoute.Sitemap = products.map(p => ({
    url: `${baseUrl}/products/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes];
}
```

### JSON-LD 结构化数据

```tsx
// src/components/json-ld.tsx
import type { Product, WithContext } from 'schema-dts';

export function ProductJsonLd({
  product,
}: {
  product: {
    name: string;
    description: string;
    image: string;
    price: number;
    slug: string;
  };
}) {
  const jsonLd: WithContext<Product> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'CNY',
      availability: 'https://schema.org/InStock',
      url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

```tsx
// 在商品详情页使用
// src/app/products/[slug]/page.tsx
import { ProductJsonLd } from '@/components/json-ld';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await db.product.findUnique({ where: { slug } });

  return (
    <>
      <ProductJsonLd product={product} />
      {/* 页面 UI */}
    </>
  );
}
```

### TDK + OpenGraph + Twitter Card

```tsx
// src/app/products/[slug]/page.tsx
import type { Metadata } from 'next';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.product.findUnique({ where: { slug } });

  if (!product) {
    return { title: '商品不存在' };
  }

  return {
    // TDK — SEO 基础三要素
    title: `${product.name} — My Store`,
    description: product.description.slice(0, 160),
    keywords: [product.category, product.name, '商城'].join(', '),

    // OpenGraph — 社交分享（Facebook / LinkedIn / Telegram...）
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 200),
      url: `/products/${product.slug}`,
      siteName: 'My Store',
      images: [
        {
          url: product.images[0],
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      locale: 'zh_CN',
      type: 'article',
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description.slice(0, 200),
      images: [product.images[0]],
    },

    // robots 元标签
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
      },
    },

    // canonical URL（防止重复内容）
    alternates: {
      canonical: `/products/${product.slug}`,
    },
  };
}
```

### metadata 继承与模板

```tsx
// src/app/layout.tsx — 全局默认 SEO
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    template: '%s — My Store',
    default: 'My Store — 最好的在线商城',
  },
  description: 'My Store 提供各种优质商品，全场包邮，7天无忧退换。',
  openGraph: {
    siteName: 'My Store',
    locale: 'zh_CN',
  },
};
```

---

## 13.6 Proxy 与 Rewrites

Next.js 的 `rewrites` 可以充当反向代理，将请求转发到其他服务，客户端看到的一直是同域 URL，彻底避免了 CORS 问题。

### 基础 Rewrites（API 代理）

```ts
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/external/:path*',   // 前端请求 /api/external/users
        destination: 'https://api.external.com/:path*', // 实际请求外部 API
      },
    ];
  },
};
```

```tsx
// 组件中直接请求同域 URL，无 CORS
export default async function Page() {
  const users = await fetch('/api/external/users').then(r => r.json());
  // 实际请求的是 https://api.external.com/users
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

### 多种 Rewrites 模式

```ts
async rewrites() {
  return {
    beforeFiles: [
      // 1. beforeFiles: 拦截 header/redirect 之前
      {
        source: '/health',
        destination: '/api/health',
      },
    ],
    afterFiles: [
      // 2. afterFiles: 页面/文件没匹配时生效
      {
        source: '/blog/:slug',
        destination: 'https://headless-cms.com/blog/:slug',
      },
    ],
    fallback: [
      // 3. fallback: 所有资源都不匹配时的兜底
      {
        source: '/:path*',
        destination: 'https://old-site.example.com/:path*',
      },
    ],
  };
}
```

### Rewrites 实际应用场景

```ts
async rewrites() {
  return [
    // 场景一：代理后端 API（避免 CORS，隐藏真实地址）
    {
      source: '/api/backend/:path*',
      destination: `${process.env.BACKEND_API_URL}/:path*`,
    },

    // 场景二：多版本 API 共存
    {
      source: '/api/v2/:path*',
      destination: 'https://api-v2.example.com/:path*',
    },

    // 场景三：A/B 测试
    {
      source: '/landing',
      destination: '/landing-v2',
      has: [{ type: 'cookie', key: 'ab_test', value: 'b' }],
    },

    // 场景四：图片代理（绕过防盗链）
    {
      source: '/images/proxy/:slug',
      destination: 'https://cdn.supplier.com/images/:slug',
    },
  ];
}
```

### Redirects 配置

```ts
async redirects() {
  return [
    // 永久重定向（301）
    {
      source: '/old-blog/:slug',
      destination: '/blog/:slug',
      permanent: true,
    },
    // 临时重定向（307）
    {
      source: '/promo',
      destination: '/products/special-offer',
      permanent: false,
    },
    // 条件重定向
    {
      source: '/admin',
      missing: [{ type: 'cookie', key: 'is_admin' }],
      destination: '/login',
      permanent: false,
    },
  ];
}
```

### Headers 配置（安全响应头）

```ts
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
        },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
    // API 路由的 CORS 头
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
      ],
    },
  ];
}
```

---

## 13.7 better-auth 认证

[better-auth](https://better-auth.com) 是 2024 年兴起的新一代认证库，相比 Auth.js 更轻量、TypeScript 支持更好、与框架无关。

### 对比 Auth.js

| 特性 | Auth.js (NextAuth v5) | better-auth |
|------|----------------------|-------------|
| 框架依赖 | Next.js 强绑定 | 框架无关 |
| 包大小 | 较大 | 更小 |
| 类型安全 | 需手动泛型 | 自动推断 |
| 插件系统 | 有限 | 丰富的插件生态 |
| 数据库适配 | Adapter 模式 | 原生 Prisma/Drizzle 集成 |
| 文档质量 | 尚可 | 优秀 |

### better-auth 集成

```bash
npm install better-auth
```

```ts
// src/lib/auth.ts
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { db } from '@/lib/db';

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  plugins: [
    // 管理后台插件
    admin(),
    // 组织/多租户插件
    organization(),
    // 两步验证
    twoFactor(),
  ],
});
```

```ts
// src/app/api/auth/[...all]/route.ts
import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
```

```tsx
// 在 Server Component 中获取用户
import { auth } from '@/lib/auth';

export default async function Dashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect('/login');

  return <div>你好，{session.user.name}</div>;
}
```

### 使用插件 — 两步验证示例

```ts
import { twoFactor } from 'better-auth/plugins';

const auth = betterAuth({
  plugins: [
    twoFactor({
      issuer: 'My App',
      otpOptions: {
        sendOTP: async ({ phone, code }) => {
          // 发送短信验证码
          await sendSMS(phone, code);
        },
      },
    }),
  ],
});
```

> **选型建议：** 如果是全新项目，可以优先考虑 better-auth（类型安全更好、更轻量）；如果团队已熟悉 Auth.js，继续使用也没问题。

---

## 13.8 Cookies API 详解

### 服务端读取 Cookies

```tsx
import { cookies } from 'next/headers';

export default async function Page() {
  const cookieStore = await cookies();

  // 读取单个 cookie
  const token = cookieStore.get('token');
  console.log(token?.name, token?.value);

  // 检查是否存在
  const hasToken = cookieStore.has('token');

  // 获取所有 cookies
  const allCookies = cookieStore.getAll();

  return <div>...</div>;
}
```

### 服务端设置 / 删除 Cookies

```tsx
// 在 Server Action 或 Route Handler 中设置
import { cookies } from 'next/headers';

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();

  cookieStore.set({
    name: 'token',
    value: token,
    httpOnly: true,      // JS 无法读取
    secure: true,        // 仅 HTTPS
    sameSite: 'lax',     // CSRF 防护
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 天
    // expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
}

export async function deleteAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('token');
}
```

### 中间件中操作 Cookies

```ts
// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 可以在 response 上设置 cookie
  const response = NextResponse.next();

  // 刷新 cookie 过期时间
  response.cookies.set({
    name: 'token',
    value: token,
    maxAge: 60 * 60 * 24 * 7, // 重新计算 7 天
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });

  return response;
}
```

### Cookies 安全清单

```
✅ httpOnly: true — 防止 XSS 窃取
✅ secure: true — 仅通过 HTTPS 传输
✅ sameSite: 'lax' — 防止跨站请求伪造
✅ path: '/' — 限制 cookie 生效路径
✅ 设置合理的 maxAge/expires
✅ __Host- / __Secure- 前缀增强安全性（见下文）

❌ 不要在 cookie 中存储敏感数据（即使 httpOnly）
❌ 不要用 maxAge: 0 删 cookie — 用 cookieStore.delete()
❌ 不要在客户端直接 document.cookie 读写
```

### Cookie 前缀约定

```
__Host-前缀（最强限制）：
  - 必须设置 secure
  - 不能设置 domain（仅当前域名生效）
  - 必须设置 path=/
  例：__Host-auth-token

__Secure-前缀（中等限制）：
  - 必须设置 secure
  例：__Secure-cart-id
```

---

## 13.9 Redirect 详解

### 服务端重定向

```tsx
import { redirect, permanentRedirect } from 'next/navigation';

// 临时重定向（307）
// 在 Server Component / Server Action / Route Handler 中可用
export default function OldPage() {
  redirect('/new-page'); // 抛出 NEXT_REDIRECT 错误
}

// 永久重定向（308）
// 搜索引擎会更新索引
export default function ReallyOldPage() {
  permanentRedirect('/new-location');
}

// 带参数的组件内部重定向
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id } });

  if (!product) redirect('/404');
  if (product.archived) permanentRedirect(`/products/${product.slug}`);

  return <div>{product.name}</div>;
}
```

### 客户端重定向

```tsx
'use client';

import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn('credentials', { ... });

    if (!result.error) {
      // 客户端重定向
      router.push('/dashboard');      // 可以后退
      // router.replace('/dashboard'); // 不可后退，替换历史记录
      router.refresh(); // 刷新服务端组件
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### redirect 的工作原理

```
redirect('/new-page') 不是真的 HTTP 302/307！
它会抛出一个特殊的 NEXT_REDIRECT 错误，
Next.js 内部捕获这个错误并返回适当的重定向响应。

这样做的好处：
- 可以在 try/catch 外的任意位置调用
- 不会破坏组件渲染流程
- 错误边界不会捕获它（NEXT_REDIRECT 是内部错误）
```

---

## 13.10 国际化 (i18n)

### 路由国际化方案

```
app/
├── [lang]/
│   ├── layout.tsx       # 根据 lang 参数设置语言
│   ├── page.tsx
│   ├── about/
│   │   └── page.tsx
│   └── products/
│       └── page.tsx
└── middleware.ts         # 自动检测/重定向语言
```

```ts
// src/middleware.ts — 语言自动检测
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const supportedLocales = ['zh-CN', 'en-US', 'ja-JP'];
const defaultLocale = 'zh-CN';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 检查路径是否已有 locale
  const pathnameHasLocale = supportedLocales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameHasLocale) return;

  // 从 cookie 或 Accept-Language 获取偏好语言
  const cookieLocale = request.cookies.get('locale')?.value;
  const acceptLanguage = request.headers.get('accept-language')?.split(',')[0];

  const locale =
    (cookieLocale && supportedLocales.includes(cookieLocale) ? cookieLocale : null) ||
    (acceptLanguage?.startsWith('zh') ? 'zh-CN' :
     acceptLanguage?.startsWith('ja') ? 'ja-JP' :
     acceptLanguage?.startsWith('en') ? 'en-US' :
     defaultLocale);

  const newUrl = new URL(`/${locale}${pathname}`, request.url);
  return NextResponse.redirect(newUrl);
}

export const config = {
  matcher: ['/((?!api|_next|_static|favicon.ico|robots|sitemap).*)'],
};
```

### 翻译字典与 Provider

```ts
// src/lib/dictionaries.ts
export const dictionaries = {
  'zh-CN': () => import('@/dictionaries/zh-CN.json').then(m => m.default),
  'en-US': () => import('@/dictionaries/en-US.json').then(m => m.default),
  'ja-JP': () => import('@/dictionaries/ja-JP.json').then(m => m.default),
} as const;

export type Locale = keyof typeof dictionaries;
```

```json
// src/dictionaries/zh-CN.json
{
  "home": {
    "title": "欢迎来到 My Store",
    "subtitle": "发现好物，享受生活"
  },
  "nav": {
    "home": "首页",
    "products": "商品",
    "cart": "购物车",
    "login": "登录"
  },
  "cart": {
    "empty": "购物车是空的",
    "checkout": "去结算",
    "total": "合计"
  }
}
```

```tsx
// src/app/[lang]/layout.tsx
import { dictionaries, type Locale } from '@/lib/dictionaries';
import { LocaleProvider } from './locale-provider';
import { notFound } from 'next/navigation';

const supportedLocales: Locale[] = ['zh-CN', 'en-US', 'ja-JP'];

type Props = { children: React.ReactNode; params: Promise<{ lang: string }> };

export default async function LocaleLayout({ children, params }: Props) {
  const { lang } = await params;

  if (!supportedLocales.includes(lang as Locale)) {
    notFound();
  }

  const dict = await dictionaries[lang as Locale]();

  return <LocaleProvider locale={lang as Locale} dict={dict}>{children}</LocaleProvider>;
}
```

```tsx
// 使用翻译的 hooks
'use client';

import { createContext, useContext } from 'react';
import type { Locale } from '@/lib/dictionaries';

const LocaleContext = createContext<{ locale: Locale; dict: any } | null>(null);

export function LocaleProvider({ ... }) { ... }

export function useTranslation() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('Missing LocaleProvider');
  return ctx;
}

// 组件中使用
'use client';

import { useTranslation } from '@/app/[lang]/locale-provider';

export function CartHeader() {
  const { dict } = useTranslation();
  return <h1>{dict.cart.empty}</h1>;
}
```

### next-intl（推荐第三方库）

更复杂的 i18n 需求推荐使用 `next-intl`：

```bash
npm install next-intl
```

它提供更好的 API、类型安全、日期/数字格式化、ICU 消息语法等。

---

## 13.11 PWA 支持

### 手动集成 PWA

```bash
npm install serwist
```

```ts
// next.config.ts
import withSerwist from '@serwist/next';

const withPWA = withSerwist({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  // ...
};

export default withPWA(nextConfig);
```

```ts
// src/sw.ts — Service Worker
import { defaultCache } from '@serwist/next/worker';
import { Serwist } from 'serwist';

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
});

serwist.addEventListeners();
```

### Web App Manifest

```tsx
// src/app/manifest.ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'My Store',
    short_name: 'Store',
    description: 'My Store — 最好的在线商城',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
```

```tsx
// src/app/layout.tsx — 注册 manifest
export const metadata: Metadata = {
  manifest: '/manifest.webmanifest',
};
```

---

## 13.12 Edge Runtime 详解

### 什么是 Edge Runtime

Edge Runtime 是 Next.js 在**全球边缘节点**上运行的轻量级运行时环境，基于 Web API 标准。

```
用户（亚洲）        用户（欧洲）          用户（北美）
    │                    │                    │
    ▼                    ▼                    ▼
┌────────┐         ┌────────┐          ┌────────┐
│ 东京边缘│         │ 法兰克福 │          │ 弗吉尼亚 │
│ ───────│         │────────│          │────────│
│ Middleware         Middleware           Middleware
│ API Route          API Route            API Route
└────────┘         └────────┘          └────────┘
    │                    │                    │
    └────────────────────┼────────────────────┘
                         ▼
                   ┌──────────┐
                   │ 数据库    │
                   │ (单区域)  │
                   └──────────┘
```

### Edge vs Node.js Runtime

| 能力 | Node.js Runtime | Edge Runtime |
|------|----------------|--------------|
| 可用 API | Node.js 全部 API | 仅 Web API |
| 冷启动 | 较慢（~200ms-2s） | 极快（~0-100ms） |
| 文件系统 | ✅ | ❌ 不支持 fs |
| 原生 TCP | ✅ | ❌ 只支持 HTTP/fetch |
| 数据库直连 | ✅ | ❌ 需要 HTTP 代理 |
| 包大小限制 | 无限制 | 有大小限制（1-4MB） |
| 地理位置 | 单区域 | 全球边缘 |

### 如何在 Edge 运行

```ts
// Middleware 默认在 Edge 运行，无需声明
// src/middleware.ts

// Route Handler 声明 Edge
// src/app/api/geo/route.ts
export const runtime = 'edge';

export async function GET(request: Request) {
  // Edge 环境中可用的地理信息
  const country = request.headers.get('x-vercel-ip-country');
  const city = request.headers.get('x-vercel-ip-city');

  return Response.json({ country, city });
}
```

### Edge Runtime 适用场景

```
✅ 适用：
  - 地理信息检测
  - A/B 测试路由
  - 速率限制
  - URL 重写/重定向
  - 认证检查（JWT 验证）
  - 轻量级 API（不需要数据库）

❌ 不适用：
  - 数据库直接操作
  - 文件系统操作
  - 大计算量任务
  - 需要完整 Node.js API 的场景
```

---

## 13.13 配置文件完整参考

### `next.config.ts` 完整选项

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // === 输出 ===
  output: undefined,              // 'standalone' | 'export'

  // === 环境 ===
  env: {
    // 在构建时硬编码到 bundle 的环境变量
    BUILD_TIME: new Date().toISOString(),
  },

  // === 图片 ===
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
        pathname: '/images/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],  // 现代图片格式
    deviceSizes: [640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,                     // 缓存最小秒数
  },

  // === 重写/重定向/请求头 ===
  async rewrites() { return []; },
  async redirects() { return []; },
  async headers() { return []; },

  // === 编译 ===
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },

  // === 实验性功能 ===
  experimental: {
    ppr: 'incremental',              // 部分预渲染
    serverActions: {
      bodySizeLimit: '2mb',          // Server Actions 请求体大小限制
    },
    typedRoutes: true,                // 类型安全的路由链接
    mdxRs: true,                     // 用 Rust 编译 MDX
  },

  // === 日志 ===
  logging: {
    fetches: {
      fullUrl: true,                  // 开发时显示完整 fetch URL
    },
  },

  // === HTTP 代理配置 ===
  httpAgentOptions: {
    keepAlive: true,
  },

  // === 转译第三方包（使其支持 RSC） ===
  transpilePackages: ['@mui/material', 'lodash-es'],

  // === Webpack/Turbopack 自定义（通常不需要） ===
  webpack: (config, { isServer }) => {
    // 极少情况下需要修改 webpack 配置
    return config;
  },

  // === 开发服务器 ===
  devIndicators: {
    buildActivity: true,             // 构建指示器
  },

  // === 允许的开发域名 ===
  allowedDevOrigins: ['local.example.com'],

  // === Turbopack 配置 ===
  turbopack: {
    // Turbopack 特定配置（极少需要）
  },
};

export default nextConfig;
```

### `package.json` 脚本

```jsonc
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "test:e2e": "playwright test",
    "postinstall": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "prisma db seed",
    "analyze": "ANALYZE=true next build",
    "export": "next build && npx serve out"
  }
}
```

---

## 练习

1. 使用 `next/script` 在项目中集成 Google Analytics
2. 为一个文档站开启 `output: 'export'`，部署到 GitHub Pages
3. 配置一个 MDX 博客页面，包含自定义 React 组件
4. 为商品详情页添加完整的 JSON-LD 结构化数据
5. 使用 `rewrites` 代理一个外部 API，前端请求同域地址
6. 集成 better-auth 实现带两步验证的登录系统
7. 使用 `cookies()` API 实现一个"7 天内自动登录"功能
8. 用中间件链实现"日志 + 认证 + 速率限制"的组合
9. 实现支持 zh-CN / en-US 的路由国际化
10. 为应用添加 PWA 支持（Service Worker + manifest）
