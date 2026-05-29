'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sun, Moon } from 'lucide-react';

// 用 cva 模式定义按钮变体（不依赖 class-variance-authority 库）
const buttonVariants = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
  destructive: 'bg-red-500 text-white hover:bg-red-600',
  outline: 'border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800',
  ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800',
} as const;

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
} as const;

type Variant = keyof typeof buttonVariants;
type Size = keyof typeof sizes;

export default function StylingDemoPage() {
  const [dark, setDark] = useState(false);

  return (
    <div className={`${dark ? 'dark' : ''}`}>
      <div className="min-h-screen bg-white px-6 py-10 text-gray-900 dark:bg-gray-950 dark:text-gray-100 lg:px-12">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-2 text-2xl font-bold">样式 & 主题</h1>
          <p className="mb-8 text-gray-500 dark:text-gray-400">
            演示 Button 变体系统（cva 模式）+ 暗色模式切换。
          </p>

          {/* 暗色模式开关 */}
          <div className="mb-8 flex items-center gap-3">
            <button
              onClick={() => setDark(!dark)}
              className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm dark:border-gray-600"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
              {dark ? '亮色模式' : '暗色模式'}
            </button>
            <span className="text-xs text-gray-400">（模拟，实际项目建议用 Tailwind dark: 类 + class 策略）</span>
          </div>

          {/* Button 变体展示 */}
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">Button 变体</h2>
            <div className="space-y-4">
              {(['sm', 'md', 'lg'] as Size[]).map(size => (
                <div key={size} className="flex flex-wrap items-center gap-3">
                  <span className="w-10 text-xs text-gray-400">{size}</span>
                  {(Object.keys(buttonVariants) as Variant[]).map(variant => (
                    <button
                      key={variant}
                      className={cn(
                        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
                        buttonVariants[variant],
                        sizes[size],
                      )}
                    >
                      {variant}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </section>

          {/* 禁用态 */}
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">禁用态</h2>
            <div className="flex gap-3">
              {(Object.keys(buttonVariants) as Variant[]).map(variant => (
                <button
                  key={variant}
                  disabled
                  className={cn(
                    'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium opacity-50 cursor-not-allowed',
                    buttonVariants[variant],
                  )}
                >
                  {variant}
                </button>
              ))}
            </div>
          </section>

          {/* 响应式展示 */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">响应式网格</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl border p-6 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    列 {i}：<br />
                    手机: 1 列<br />
                    平板: 2 列<br />
                    桌面: 3 列
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
