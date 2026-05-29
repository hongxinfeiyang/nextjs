'use client';

import { useState, createContext, useContext } from 'react';

const translations = {
  'zh-CN': {
    title: '国际化示例',
    subtitle: '使用 Context 实现语言切换',
    greeting: '你好，世界！',
    description: '这段文字会根据选择的语言自动切换。在实际项目中可以使用 URL 路由或 Cookie 持久化语言设置。',
    button: '点击计数',
    count: (n: number) => `你点击了 ${n} 次`,
    lang: '语言',
    current: '当前语言',
  },
  'en-US': {
    title: 'i18n Demo',
    subtitle: 'Language switching with Context',
    greeting: 'Hello, World!',
    description: 'This text changes automatically based on the selected language. In real projects, use URL routing or cookies to persist language settings.',
    button: 'Click Me',
    count: (n: number) => `You clicked ${n} times`,
    lang: 'Language',
    current: 'Current Language',
  },
  'ja-JP': {
    title: '国際化デモ',
    subtitle: 'Context による言語切り替え',
    greeting: 'こんにちは、世界！',
    description: 'このテキストは選択した言語に応じて自動的に切り替わります。実際のプロジェクトでは URL ルーティングや Cookie で言語設定を永続化します。',
    button: 'クリック',
    count: (n: number) => `${n} 回クリックしました`,
    lang: '言語',
    current: '現在の言語',
  },
};

type Locale = keyof typeof translations;
type Dict = typeof translations['zh-CN'];

const I18nContext = createContext<{ locale: Locale; dict: Dict; setLocale: (l: Locale) => void } | null>(null);

function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('Missing I18nProvider');
  return ctx;
}

export default function I18nDemoPage() {
  const [locale, setLocale] = useState<Locale>('zh-CN');
  const dict = translations[locale];

  return (
    <I18nContext.Provider value={{ locale, dict, setLocale }}>
      <div className="px-6 py-10 lg:px-12">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-2 text-2xl font-bold">{dict.title}</h1>
          <p className="mb-8 text-gray-500">{dict.subtitle}</p>

          {/* 语言切换 */}
          <div className="mb-8 flex items-center gap-3">
            <span className="text-sm text-gray-500">{dict.lang}：</span>
            {(['zh-CN', 'en-US', 'ja-JP'] as Locale[]).map(l => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  locale === l ? 'bg-brand text-white' : 'border hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {l === 'zh-CN' ? '中文' : l === 'en-US' ? 'English' : '日本語'}
              </button>
            ))}
          </div>

          {/* 内容展示 */}
          <div className="rounded-xl border p-8 space-y-6">
            <div>
              <p className="mb-1 text-xs text-gray-400">{dict.current}：{locale}</p>
              <h2 className="text-4xl font-bold">{dict.greeting}</h2>
            </div>
            <p className="text-gray-500">{dict.description}</p>
            <InteractiveSection />
          </div>
        </div>
      </div>
    </I18nContext.Provider>
  );
}

function InteractiveSection() {
  const { dict } = useI18n();
  const [count, setCount] = useState(0);

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => setCount(c => c + 1)}
        className="rounded-lg bg-brand px-4 py-2 text-sm text-white font-medium hover:bg-brand-dark"
      >
        {dict.button}
      </button>
      <span className="text-sm text-gray-500">{dict.count(count)}</span>
    </div>
  );
}
