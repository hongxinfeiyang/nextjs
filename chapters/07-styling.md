# 第七章：样式方案 — CSS Modules / Tailwind / CSS-in-JS

---

## 7.1 全局样式与 CSS Modules

### 全局样式

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* CSS 自定义属性（设计 Tokens） */
:root {
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
  --radius: 0.5rem;
}

/* 基础重置 */
* { box-sizing: border-box; }

body {
  font-family: var(--font-sans);
  color: #111;
  background: #fff;
}
```

```tsx
// 全局样式只能在 src/app/layout.tsx 中导入
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### CSS Modules

Next.js 原生支持 `.module.css` 文件，提供**局部作用域**的 CSS：

```css
/* src/app/components/Button.module.css */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 150ms ease;
  cursor: pointer;
  border: none;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.primary {
  background-color: var(--color-primary);
  color: white;
}

.primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.secondary {
  background-color: #e5e7eb;
  color: #111;
}

.secondary:hover:not(:disabled) {
  background-color: #d1d5db;
}

.outline {
  background: transparent;
  border: 1px solid #d1d5db;
}

.outline:hover:not(:disabled) {
  background-color: #f3f4f6;
}

/* 尺寸变体 */
.sm { padding: 0.25rem 0.5rem; font-size: 0.875rem; }
.md { padding: 0.5rem 1rem; font-size: 1rem; }
.lg { padding: 0.75rem 1.5rem; font-size: 1.125rem; }
```

```tsx
// src/app/components/Button.tsx
import styles from './Button.module.css';
import { type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
      {...props}
    />
  );
}
```

### CSS Modules 的类型安全

```jsonc
// tsconfig.json — 让 TS 识别 .module.css 导入（通常已默认配置）
{
  "compilerOptions": {
    "plugins": [{ "name": "typescript-plugin-css-modules" }]
  }
}
```

---

## 7.2 Tailwind CSS

Next.js 默认集成 Tailwind CSS（创建项目时可选）。它是**原子化 CSS** 的代表。

### 核心概念

```tsx
// 传统的 CSS 写法：一个 class 对应多种样式
// .card { padding: 1rem; background: white; border-radius: 0.5rem; box-shadow: ... }

// Tailwind：每个 class 是一个原子化样式
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-md">
      {children}
    </div>
  );
}
```

### 常用工具类

```tsx
export function ExampleComponent() {
  return (
    <div className="
      /* 布局 */
      flex items-center justify-between
      /* 间距 */
      p-4 m-2 gap-4
      /* 尺寸 */
      w-full max-w-lg h-12
      /* 文字 */
      text-lg font-bold text-gray-900
      /* 背景 */
      bg-white hover:bg-gray-50
      /* 边框 */
      border border-gray-200 rounded-lg
      /* 阴影 */
      shadow-sm hover:shadow-md
      /* 过渡 */
      transition-all duration-200
      /* 响应式 */
      md:flex-row md:p-6
      /* 暗色模式 */
      dark:bg-gray-800 dark:text-white
    ">
      内容
    </div>
  );
}
```

### Tailwind 配置

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a5f',
        },
      },
      spacing: {
        '18': '4.5rem',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-in-out',
        'slide-up': 'slideUp 300ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

### 提取组件模式（避免 class 堆砌）

当同一个 class 组合出现多次时，提取：

```tsx
// ❌ 坏：重复的 class 组合散落各处
<div className="rounded-lg bg-white p-4 shadow-md">A</div>
<div className="rounded-lg bg-white p-4 shadow-md">B</div>
<div className="rounded-lg bg-white p-4 shadow-md">C</div>

// ✅ 方案一：提取为组件
export function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-white p-4 shadow-md">{children}</div>;
}

// ✅ 方案二：@apply（谨慎使用）
// globals.css
@layer components {
  .card {
    @apply rounded-lg bg-white p-4 shadow-md;
  }
}
```

> **建议：** 优先提取为 React 组件，不要滥用 `@apply`。`@apply` 适合真正"无法提取为组件"的场景（如富文本内容样式）。

---

## 7.3 CSS-in-JS 与 RSC 兼容性

### 问题：CSS-in-JS 与 Server Components

大多数 CSS-in-JS 库（styled-components、Emotion）需要运行时的 JavaScript，与 Server Components **不兼容**。在 `'use client'` 组件中使用它们是可以的，但会失去 SSR 的样式提取优势。

### 推荐方案：零运行时 CSS

```
✅ Tailwind CSS           — 零运行时，完全兼容 RSC
✅ CSS Modules            — 零运行时，完全兼容 RSC
✅ Vanilla Extract         — 零运行时，TypeScript 原生
✅ Panda CSS              — 零运行时，完全兼容 RSC
⚠️ styled-components      — 需要 'use client'，有运行时开销
⚠️ Emotion                — 需要 'use client'，有运行时开销
```

### 如果必须使用 styled-components

```tsx
'use client';

import styled from 'styled-components';

const StyledButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  background: ${p => (p.$variant === 'primary' ? '#3b82f6' : '#e5e7eb')};
  color: ${p => (p.$variant === 'primary' ? 'white' : '#111')};
`;

// 注意：用 $ 前缀的 transient props 避免传递到 DOM
export function MyButton() {
  return <StyledButton $variant="primary">Click</StyledButton>;
}
```

---

## 7.4 条件样式与 `cn` 工具函数

### 为什么需要 `cn`

```tsx
// ❌ 手写条件类名，难以维护
className={`rounded p-2 ${active ? 'bg-blue-500 text-white' : 'bg-gray-100'} ${disabled ? 'opacity-50' : ''} ${className}`}
```

### `clsx` + `tailwind-merge`

```bash
npm install clsx tailwind-merge
```

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```tsx
import { cn } from '@/lib/utils';

export function Tab({ active, disabled, className, children }) {
  return (
    <button
      className={cn(
        'rounded p-2',
        active ? 'bg-blue-500 text-white' : 'bg-gray-100',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

### `cva` — 变体管理（class-variance-authority）

```bash
npm install class-variance-authority
```

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // 基础样式
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-blue-500 text-white hover:bg-blue-600',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        ghost: 'hover:bg-gray-100',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
```

使用：

```tsx
<Button variant="destructive" size="lg">删除</Button>
<Button variant="ghost" size="sm">取消</Button>
```

---

## 7.5 响应式设计与暗色模式

### Tailwind 响应式

```tsx
// Tailwind 默认断点（移动优先）：
// sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px

export function ResponsiveLayout() {
  return (
    <div className="
      grid
      grid-cols-1        /* 手机：1 列 */
      sm:grid-cols-2     /* ≥640px：2 列 */
      lg:grid-cols-3     /* ≥1024px：3 列 */
      xl:grid-cols-4     /* ≥1280px：4 列 */
      gap-4 p-4
    ">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded bg-gray-100 p-8 text-center">
          Card {i + 1}
        </div>
      ))}
    </div>
  );
}
```

### 暗色模式

```ts
// tailwind.config.ts
const config: Config = {
  darkMode: 'class', // 或 'media'（跟随系统）
};
```

```tsx
// src/lib/theme-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
}>({ theme: 'system', setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    root.classList.toggle('dark', isDark);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

```tsx
// 使用暗色模式样式
export function Card() {
  return (
    <div className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">
      <h2 className="text-gray-900 dark:text-gray-100">标题</h2>
      <p className="text-gray-600 dark:text-gray-400">描述</p>
    </div>
  );
}
```

---

## 7.6 字体优化：`next/font`

Next.js 的 `next/font` 自动处理字体子集化、自托管和布局偏移（CLS）优化。

### Google Fonts

```tsx
// src/app/layout.tsx
import { Inter, Noto_Sans_SC } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-noto',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${notoSansSC.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

```ts
// tailwind.config.ts 中使用 CSS 变量
const config: Config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-noto)', 'sans-serif'],
      },
    },
  },
};
```

### 本地字体

```tsx
import localFont from 'next/font/local';

const myFont = localFont({
  src: [
    { path: '../fonts/MyFont-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/MyFont-Bold.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-my',
  // 可选：声明后备字体，减轻布局偏移
  fallback: ['system-ui', 'Arial'],
});
```

---

## 7.7 图片优化：`next/image`

`next/image` 是 Next.js 内置的图片优化组件，自动处理：
- 懒加载
- 尺寸优化（WebP/AVIF 转换）
- 占位符（blur placeholder）
- 防止 Cumulative Layout Shift (CLS)

### 基础用法

```tsx
import Image from 'next/image';
import heroImage from '@/images/hero.jpg'; // 本地图片自动获取宽高

export function HeroBanner() {
  return (
    <div className="relative h-96 w-full">
      <Image
        src={heroImage}
        alt="Hero"
        fill                    // 填充父容器
        className="object-cover"
        priority                // 首屏关键图片，禁用懒加载
        sizes="100vw"
      />
    </div>
  );
}
```

### 远程图片

```ts
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
        pathname: '/products/**',
      },
    ],
  },
};
```

```tsx
import Image from 'next/image';

export function ProductImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={300}
      className="rounded-lg object-cover"
      // placeholder="blur"  // 远程图片需要提供 blurDataURL
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}
```

### 理解 `sizes` 属性

```tsx
sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
//      ↑ 手机全屏                   ↑ 平板半屏                ↑ 桌面1/3屏

// 告诉浏览器：不同视口下图片的实际显示宽度
// Next.js 据此生成不同尺寸的 srcset
```

### 模糊占位符

```tsx
import { getPlaiceholder } from 'plaiceholder';

// 构建时生成 base64 模糊占位符
export async function BlurImage({ src, alt }: { src: string; alt: string }) {
  const buffer = await fetch(src).then(r => r.arrayBuffer());
  const { base64 } = await getPlaiceholder(Buffer.from(buffer));

  return (
    <Image
      src={src}
      alt={alt}
      width={600}
      height={400}
      placeholder="blur"
      blurDataURL={base64}
    />
  );
}
```

---

## 最佳实践总结

1. **默认使用 Tailwind CSS** — 开发效率高，零运行时，完美兼容 RSC
2. **用 `cn()` 管理条件样式** — 结合 `tailwind-merge` 避免样式冲突
3. **用 `cva` 管理组件变体** — 当组件有多种 variant/size 时特别有用
4. **`next/font` 处理所有字体** — 不要用 `<link>` 引入 Google Fonts
5. **`next/image` 处理所有图片** — 不要用原生 `<img>` 标签
6. **避免运行时 CSS-in-JS** — 除非有强烈的理由

---

:::demo button-variants
:::

## 练习

1. 用 Tailwind CSS 和 `cva` 创建一个支持多种 variant 和 size 的 Button 组件
2. 实现一个暗色模式切换功能
3. 用 `next/font` 配置一个中文字体和一个英文字体
4. 用 `next/image` 实现一个响应式图片画廊
5. 创建一个响应式布局：手机 1 列，平板 2 列，桌面 3 列
